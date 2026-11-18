import { apiFetch } from './api';

/** Downloads the API's CSV export for the given filters. */
export async function downloadAppointmentsCsv(query: {
  from: string;
  to: string;
  staffId?: string;
  status?: string;
}) {
  const res = await apiFetch('/appointments/export', { query });
  const url = URL.createObjectURL(await res.blob());
  const a = document.createElement('a');
  a.href = url;
  a.download = `bookflow-appointments-${query.from}-to-${query.to}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
