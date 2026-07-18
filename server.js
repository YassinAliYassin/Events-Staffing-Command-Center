// Local Express dev server (NOT used by Vercel - Vercel uses /api/*.js serverless functions).
// Mirrors the production API for local development.
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { fetchAndParseICalendar, DEFAULT_ICLOUD_URL } from './lib/ical.js';
import { getDemoCalendarEvents } from './lib/demo-calendar.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3001;

app.use(cors());
app.use(express.json());

async function loadAppleEvents(icloudUrl) {
  if (!icloudUrl) {
    const demo = getDemoCalendarEvents();
    return { events: demo, source: 'demo', error: 'No iCloud URL configured' };
  }
  try {
    const events = await fetchAndParseICalendar(icloudUrl);
    return { events, source: 'icloud' };
  } catch (error) {
    console.warn('[Calendar] iCloud unavailable, using demo events:', error.message);
    return { events: getDemoCalendarEvents(), source: 'demo', error: error.message };
  }
}

app.get('/api/health', (_req, res) => {
  res.status(200).json({
    ok: true,
    service: 'escc',
    timestamp: new Date().toISOString(),
  });
});

// Apple Calendar API - mirrors api/calendar/apple.js (uses shared lib)
// NOTE: must be GET to match the serverless handler (api/calendar/apple.js) and
// the frontend fetchApple() call, which issues a GET (no body).
app.get('/api/calendar/apple', async (req, res) => {
  try {
    const icloudUrl = req.query?.url || process.env.ICLOUD_CALENDAR_URL || DEFAULT_ICLOUD_URL;
    const { events, source, error } = await loadAppleEvents(icloudUrl);
    return res.json({
      success: true,
      events,
      count: events.length,
      source,
      ...(error ? { note: `Live feed failed (${error}); serving demo events` } : {}),
    });
  } catch (error) {
    console.error('Apple Calendar sync error:', error);
    return res.status(500).json({ success: false, events: [], count: 0, error: error.message });
  }
});

// Calendar unified API - mirrors api/calendar.js
app.get('/api/calendar', async (req, res) => {
  try {
    const icloudUrl = process.env.ICLOUD_CALENDAR_URL || DEFAULT_ICLOUD_URL;
    const { events: iCloudEvents, source } = await loadAppleEvents(icloudUrl);
    if (req.query.format === 'json') {
      return res.json({ local: [], icloud: iCloudEvents, source });
    }
    // ICS format
    let ics = 'BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Fresh People//Command Center//EN\r\n';
    for (const event of iCloudEvents) {
      const start = String(event.start || '').replace(/[-:]/g, '').split('.')[0];
      const end = String(event.end || '').replace(/[-:]/g, '').split('.')[0];
      ics += `BEGIN:VEVENT\r\nUID:${event.uid || event.id}\r\nDTSTART:${start}Z\r\nDTEND:${end}Z\r\nSUMMARY:${event.title}\r\nEND:VEVENT\r\n`;
    }
    ics += 'END:VCALENDAR';
    res.setHeader('Content-Type', 'text/calendar');
    return res.send(ics);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to generate calendar' });
  }
});

// WhatsApp Staff Dispatch - mirrors api/dispatch-staff.js
// For local dev, returns mock response (no real DB)
app.post('/api/dispatch-staff', async (req, res) => {
  const { eventId, staffIds } = req.body || {};
  if (!eventId || !Array.isArray(staffIds) || staffIds.length === 0) {
    return res.status(400).json({ success: false, error: 'eventId and staffIds required', dispatched: 0 });
  }
  // Local mock: just confirm the request shape is valid
  return res.json({
    success: true,
    note: 'Local dev: WhatsApp dispatch is mock. Production: api/dispatch-staff.js uses real DB + Meta API.',
    eventId,
    dispatched: staffIds.length,
    details: staffIds.map(id => ({ staffId: id, status: 'mock-sent' })),
  });
});

// Google Calendar API (mock for local dev)
// GET matches the serverless handler (api/calendar/google.js) and fetchGcal()'s GET call.
app.get('/api/calendar/google', (req, res) => {
  res.json({
    success: true,
    events: [],
    note: 'Local dev: configure GOOGLE_SERVICE_ACCOUNT_BASE64 in .env for real Google Calendar sync',
  });
});

// Nylas push (mock for local dev — production uses api/calendar/nylas.js)
app.post('/api/calendar/nylas', (req, res) => {
  const { title, start, end } = req.body || {};
  if (!title || !start || !end) {
    return res.status(400).json({ success: false, error: 'title, start, end required' });
  }
  return res.json({
    success: true,
    eventId: `local-${Date.now()}`,
    note: 'Local dev: Nylas push is mock. Production uses api/calendar/nylas.js',
  });
});

// Serve static build
app.use(express.static(path.join(__dirname, 'dist')));

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Apple Calendar: GET  http://localhost:${PORT}/api/calendar/apple`);
  console.log(`Google Calendar: GET http://localhost:${PORT}/api/calendar/google`);
  console.log(`Calendar JSON:   GET http://localhost:${PORT}/api/calendar?format=json`);
  console.log(`Dispatch:        POST http://localhost:${PORT}/api/dispatch-staff`);
});
