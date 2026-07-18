// Apple Calendar API - iCloud public feed
// Uses shared lib/ical.js for parsing (DRY: single source of truth)
// Falls back to demo events when the live feed is unavailable.

import { fetchAndParseICalendar, DEFAULT_ICLOUD_URL, sanitizeEnvValue } from '../../lib/ical.js';
import { getDemoCalendarEvents } from '../../lib/demo-calendar.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  // Allow query override (handy for testing different feeds)
  // Fallback chain: query param → sanitized env var → default URL
  const icloudUrl = sanitizeEnvValue(req.query.url) || sanitizeEnvValue(process.env.ICLOUD_CALENDAR_URL) || DEFAULT_ICLOUD_URL;

  if (!icloudUrl) {
    const demo = getDemoCalendarEvents();
    return res.status(200).json({
      success: true,
      events: demo,
      count: demo.length,
      source: 'demo',
      note: 'ICLOUD_CALENDAR_URL not configured — serving demo events',
      hint: 'Get the URL from iCloud Calendar → Share Calendar → Public Calendar',
    });
  }

  try {
    const events = await fetchAndParseICalendar(icloudUrl);
    return res.status(200).json({
      success: true,
      events,
      count: events.length,
      source: 'icloud',
    });
  } catch (error) {
    console.error('[Apple Calendar] sync error:', error);
    const demo = getDemoCalendarEvents();
    return res.status(200).json({
      success: true,
      events: demo,
      count: demo.length,
      source: 'demo',
      note: `Live feed failed (${error.message}); serving demo events`,
    });
  }
}
