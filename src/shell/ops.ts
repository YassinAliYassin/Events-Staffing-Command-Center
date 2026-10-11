/** Staffing helpers. Pure functions over the existing local store shape. */

export function minutesOf(time: string | undefined | null): number | null {
  if (!time || !String(time).includes(':')) return null;
  const [h, m] = String(time).split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
}

/** Same-day overlap, including shifts that cross midnight. */
export function shiftsOverlap(a: { date?: string; startTime?: string; endTime?: string }, b: { date?: string; startTime?: string; endTime?: string }): boolean {
  if (!a?.date || a.date !== b?.date) return false;
  const as = minutesOf(a.startTime);
  const ae = minutesOf(a.endTime);
  const bs = minutesOf(b.startTime);
  const be = minutesOf(b.endTime);
  if (as == null || ae == null || bs == null || be == null) return false;
  const span = (s: number, e: number) => (e <= s ? [s, e + 1440] : [s, e]);
  const [a1, a2] = span(as, ae);
  const [b1, b2] = span(bs, be);
  return a1 < b2 && b1 < a2;
}

export function assignmentConflicts(staffId: number, candidate: any, events: any[]): any[] {
  return (events || []).filter((ev) => {
    if (!ev || ev.id === candidate?.id) return false;
    const ids = ev.staffIds || [];
    if (!ids.includes(staffId)) return false;
    return shiftsOverlap(ev, candidate);
  });
}

export function isMarkedOff(staff: any, date: string | undefined): boolean {
  if (!date || !Array.isArray(staff?.unavailableDates)) return false;
  return staff.unavailableDates.includes(date);
}

export interface CrewFill {
  assigned: number;
  needed: number;
  ratio: number;
  targetSet: boolean;
}

export function crewTarget(event: any): CrewFill {
  const assigned = Array.isArray(event?.staffIds) ? event.staffIds.length : 0;
  const raw = Number(event?.requiredHeadcount);
  const targetSet = Number.isFinite(raw) && raw > 0;
  const needed = targetSet ? raw : assigned;
  const ratio = needed > 0 ? Math.min(1, assigned / needed) : 0;
  return { assigned, needed, ratio, targetSet };
}

export function isCheckedIn(event: any, staffId: number): boolean {
  return Array.isArray(event?.checkIns) && event.checkIns.some((c: any) => c && c.staffId === staffId);
}

export function downloadCsv(filename: string, rows: (string | number | null | undefined)[][]) {
  const esc = (value: string | number | null | undefined) => {
    const s = value == null ? '' : String(value);
    if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const csv = rows.map((row) => row.map(esc).join(',')).join('\r\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function runSheetText(event: any, staff: any[], client?: any): string {
  const crew = (event?.staffIds || [])
    .map((id: number) => staff.find((s) => s.id === id))
    .filter(Boolean);
  const lines = [
    'FRESH PEOPLE — RUN SHEET',
    event?.demo || event?.source === 'demo' ? 'DEMO EVENT' : '',
    event?.title || 'Untitled event',
    `Date: ${event?.date || 'TBC'}`,
    `Time: ${event?.startTime || '—'} – ${event?.endTime || '—'}`,
    `Venue: ${event?.venue || 'TBC'}`,
    client?.name ? `Client: ${client.name}` : '',
    client?.phone ? `Client phone: ${client.phone}` : '',
    '',
    'CREW',
    ...(crew.length
      ? crew.map((s: any) => {
          const here = isCheckedIn(event, s.id) ? 'checked in' : 'not checked in';
          return `- ${s.name} · ${s.role || s.department || 'Crew'} · ${s.phone || 'no phone'} · ${here}`;
        })
      : ['- No crew assigned']),
    '',
    event?.notes ? `Notes: ${event.notes}` : 'Notes: —',
  ];
  return lines.filter((line) => line !== '').join('\n');
}
