export interface Positioned<T> {
  item: T;
  start: number;
  end: number;
  /** Zero-based lane inside its group of overlapping items. */
  lane: number;
  /** Number of lanes in that group (the item's width is 1 / lanes). */
  lanes: number;
}

/**
 * Places overlapping time ranges side by side, like a calendar app.
 * Items that overlap (directly or through a chain) form a group; each item takes the first
 * free lane, and every item in the group shares the group's lane count.
 */
export function layoutLanes<T>(input: { item: T; start: number; end: number }[]): Positioned<T>[] {
  const sorted = [...input].sort((a, b) => a.start - b.start || b.end - a.end);
  const result: Positioned<T>[] = [];
  let group: Positioned<T>[] = [];
  let laneEnds: number[] = [];
  let groupEnd = -Infinity;

  const flush = () => {
    for (const p of group) p.lanes = laneEnds.length;
    result.push(...group);
    group = [];
    laneEnds = [];
  };

  for (const entry of sorted) {
    if (entry.start >= groupEnd) flush();
    let lane = laneEnds.findIndex((end) => end <= entry.start);
    if (lane === -1) {
      lane = laneEnds.length;
      laneEnds.push(entry.end);
    } else {
      laneEnds[lane] = entry.end;
    }
    group.push({ ...entry, lane, lanes: 1 });
    groupEnd = Math.max(groupEnd, entry.end);
  }
  flush();
  return result;
}
