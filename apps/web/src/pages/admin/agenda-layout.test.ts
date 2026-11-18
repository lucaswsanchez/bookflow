import { describe, expect, it } from 'vitest';
import { layoutLanes } from './agenda-layout';

const at = (item: string, start: number, end: number) => ({ item, start, end });
const summary = (input: ReturnType<typeof at>[]) =>
  Object.fromEntries(layoutLanes(input).map((p) => [p.item, `${p.lane}/${p.lanes}`]));

describe('layoutLanes', () => {
  it('keeps back-to-back appointments in a single lane', () => {
    expect(summary([at('a', 600, 630), at('b', 630, 660)])).toEqual({ a: '0/1', b: '0/1' });
  });

  it('places overlapping appointments side by side', () => {
    expect(summary([at('a', 600, 660), at('b', 615, 645), at('c', 700, 730)])).toEqual({
      a: '0/2',
      b: '1/2',
      c: '0/1',
    });
  });

  it('reuses a freed lane inside a chained group', () => {
    // a overlaps b, b overlaps c, but a ends before c starts → c reuses lane 0
    expect(summary([at('a', 600, 630), at('b', 610, 680), at('c', 640, 700)])).toEqual({
      a: '0/2',
      b: '1/2',
      c: '0/2',
    });
  });
});
