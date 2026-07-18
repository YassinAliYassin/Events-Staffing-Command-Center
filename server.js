// Local Express dev server (NOT used by Vercel - Vercel uses /api/*.js serverless functions).
// Mirrors the production API for local development.
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { fetchAndParseICalendar, DEFAULT_ICLOUD_URL } from './lib/ical.js';
import { getDemoCalendarEvents } from './lib/demo-calendar.js';
import { loadStore, saveStore, nextId } from './lib/local-store.js';

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
    mode: process.env.DATABASE_URL ? 'db' : 'local-file',
    timestamp: new Date().toISOString(),
  });
});

// Apple Calendar
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

// Calendar unified
app.get('/api/calendar', async (req, res) => {
  try {
    const icloudUrl = process.env.ICLOUD_CALENDAR_URL || DEFAULT_ICLOUD_URL;
    const { events: iCloudEvents, source } = await loadAppleEvents(icloudUrl);
    if (req.query.format === 'json') {
      return res.json({ local: [], icloud: iCloudEvents, source });
    }
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

// WhatsApp dispatch (mock locally)
app.post('/api/dispatch-staff', async (req, res) => {
  const { eventId, staffIds } = req.body || {};
  if (!eventId || !Array.isArray(staffIds) || staffIds.length === 0) {
    return res.status(400).json({ success: false, error: 'eventId and staffIds required', dispatched: 0 });
  }
  return res.json({
    success: true,
    note: 'Local dev: WhatsApp dispatch is mock. Production: api/dispatch-staff.js uses real DB + Meta API.',
    eventId,
    dispatched: staffIds.length,
    details: staffIds.map(id => ({ staffId: id, status: 'mock-sent' })),
  });
});

// Google Calendar (empty mock when no SA credentials)
app.get('/api/calendar/google', (_req, res) => {
  res.json({
    success: true,
    events: [],
    note: 'Local dev: configure GOOGLE_SERVICE_ACCOUNT_BASE64 in .env for real Google Calendar sync',
  });
});

// Nylas push mock
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

// ─── Staff API (local file store — mirrors api/staff for offline) ─────────────
app.get('/api/staff', (_req, res) => {
  const store = loadStore();
  res.json({ staff: store.staff });
});

app.post('/api/staff', (req, res) => {
  const store = loadStore();
  const body = req.body || {};
  const id = nextId(store.staff);
  const member = {
    id,
    name: body.name || body.staffName || '',
    phone: body.phone || body.staffPhone || '',
    role: body.role || '',
    rate: Number(body.rate || body.hourlyRate) || 40,
    email: body.email || '',
    department: body.department || 'Floor',
    pin: body.pin || String(1000 + id).slice(-4),
    total_hours: 0,
    status: 'active',
    availability: 'available',
    notes: body.notes || '',
  };
  store.staff.push(member);
  saveStore(store);
  res.json({ staff: member, message: 'Staff added successfully' });
});

app.patch('/api/staff', (req, res) => {
  const store = loadStore();
  const { id, ...patch } = req.body || {};
  if (id == null) return res.status(400).json({ error: 'id required' });
  const idx = store.staff.findIndex(s => String(s.id) === String(id));
  if (idx < 0) return res.status(404).json({ error: 'Staff not found' });
  store.staff[idx] = { ...store.staff[idx], ...patch, id: store.staff[idx].id };
  saveStore(store);
  res.json({ staff: store.staff[idx], message: 'Staff updated successfully' });
});

app.delete('/api/staff', (req, res) => {
  const store = loadStore();
  const id = req.body?.id ?? req.query?.id;
  if (id == null) return res.status(400).json({ error: 'id required' });
  store.staff = store.staff.filter(s => String(s.id) !== String(id));
  saveStore(store);
  res.json({ message: 'Staff deleted successfully' });
});

// ─── Events API (local file store) ───────────────────────────────────────────
app.get('/api/events', (req, res) => {
  const store = loadStore();
  if (req.query.id) {
    const event = store.events.find(e => String(e.id) === String(req.query.id));
    if (!event) return res.status(404).json({ error: 'Event not found' });
    return res.json({ event });
  }
  res.json({ events: store.events });
});

app.post('/api/events', (req, res) => {
  const store = loadStore();
  const body = req.body || {};
  const id = String(nextId(store.events));
  const event = {
    id,
    title: body.title || 'Untitled',
    date: body.date || new Date().toISOString().slice(0, 10),
    duration: body.duration ?? 5,
    venue: body.venue || '',
    staffIds: body.staffIds || body.staff_assigned || [],
    startTime: body.startTime || '09:00',
    endTime: body.endTime || '17:00',
    clientId: body.clientId ?? null,
    status: body.status || 'Pending',
    notes: body.notes || '',
  };
  store.events.push(event);
  saveStore(store);
  res.json({ event, message: 'Event created successfully' });
});

app.patch('/api/events', (req, res) => {
  const store = loadStore();
  const id = req.body?.id ?? req.query?.id;
  if (id == null) return res.status(400).json({ error: 'id required' });
  const idx = store.events.findIndex(e => String(e.id) === String(id));
  if (idx < 0) return res.status(404).json({ error: 'Event not found' });
  const { id: _drop, ...patch } = req.body || {};
  store.events[idx] = { ...store.events[idx], ...patch, id: store.events[idx].id };
  saveStore(store);
  res.json({ event: store.events[idx], message: 'Event updated successfully' });
});

app.delete('/api/events', (req, res) => {
  const store = loadStore();
  const id = req.body?.id ?? req.query?.id;
  if (id == null) return res.status(400).json({ error: 'id required' });
  store.events = store.events.filter(e => String(e.id) !== String(id));
  saveStore(store);
  res.json({ message: 'Event deleted successfully' });
});

// Dashboard data (local aggregate)
app.get('/api/dashboard-data', (_req, res) => {
  const store = loadStore();
  const today = new Date().toISOString().slice(0, 10);
  res.json({
    success: true,
    staffCount: store.staff.length,
    eventCount: store.events.length,
    clientCount: store.clients.length,
    todayEvents: store.events.filter(e => e.date === today),
    upcoming: store.events.filter(e => e.date >= today).slice(0, 10),
  });
});

// Serve static build
app.use(express.static(path.join(__dirname, 'dist')));

// SPA fallback (skip API)
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'Not found', path: req.path });
  }
  const index = path.join(__dirname, 'dist', 'index.html');
  res.sendFile(index, (err) => {
    if (err) res.status(404).send('Build not found. Run npm run build or npm run dev.');
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Health:    GET  /api/health`);
  console.log(`Staff:     GET  /api/staff`);
  console.log(`Events:    GET  /api/events`);
  console.log(`Apple:     GET  /api/calendar/apple`);
  console.log(`Google:    GET  /api/calendar/google`);
  console.log(`Dispatch:  POST /api/dispatch-staff`);
});
