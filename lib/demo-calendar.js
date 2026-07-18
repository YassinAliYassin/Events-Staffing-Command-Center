// Demo / offline calendar events used when the live iCloud feed is unavailable.
// Keeps Calendar sync UI useful for local dev and demos without a public feed URL.

function ymd(d) {
  return d.toISOString().slice(0, 10);
}

function addDays(d, n) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

/**
 * Generate a few upcoming demo events relative to "now".
 * Shape matches fetchAndParseICalendar() output.
 */
export function getDemoCalendarEvents() {
  const today = new Date();
  const samples = [
    { title: 'Sandton Product Launch', days: 1, startH: 17, endH: 22, location: 'Sandton Convention Centre' },
    { title: 'Corporate Gala — MTN', days: 3, startH: 18, endH: 23, location: 'Hyatt Regency JHB' },
    { title: 'Wedding: Khumalo/Singh', days: 7, startH: 12, endH: 20, location: 'Zimbali Estate' },
    { title: 'VIP Lounge — FNB Stadium', days: 10, startH: 14, endH: 21, location: 'FNB Stadium' },
    { title: 'Brand Activation — Rosebank', days: 14, startH: 9, endH: 17, location: 'The Zone @ Rosebank' },
  ];

  return samples.map((s, i) => {
    const day = addDays(today, s.days);
    const date = ymd(day);
    const start = `${date}T${String(s.startH).padStart(2, '0')}:00:00`;
    const end = `${date}T${String(s.endH).padStart(2, '0')}:00:00`;
    return {
      id: `demo-${i + 1}`,
      uid: `demo-escc-${i + 1}@freshpeople.local`,
      title: s.title,
      start,
      end,
      description: 'Demo event (live iCloud feed unavailable)',
      location: s.location,
      calendar: 'Demo Calendar',
      calendarId: 'demo-feed',
      source: 'demo',
      sourceType: 'demo-fallback',
      color: '#FF9500',
    };
  });
}
