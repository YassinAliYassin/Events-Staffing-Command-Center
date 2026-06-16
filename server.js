// Local Express dev server (NOT used by Vercel - Vercel uses /api/*.js serverless functions).
// Mirrors the production API for local development.
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { fetchAndParseICalendar, DEFAULT_ICLOUD_URL } from './lib/ical.js';
import { signToken, verifyToken } from './lib/auth.js';
import { handleFinanceRequest } from './lib/finance-core.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json({ limit: '1mb' }));

// Basic in-memory rate limiting for writes (per IP, simple for small team / dev)
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 min
const RATE_LIMIT_MAX = 30; // writes per window

function rateLimitWrites(req, res, next) {
  if (req.method === 'GET' || req.method === 'OPTIONS') return next();
  const ip = req.ip || req.connection?.remoteAddress || 'unknown';
  const now = Date.now();
  const entry = rateLimitMap.get(ip) || { count: 0, reset: now + RATE_LIMIT_WINDOW_MS };
  if (now > entry.reset) {
    entry.count = 0;
    entry.reset = now + RATE_LIMIT_WINDOW_MS;
  }
  entry.count++;
  rateLimitMap.set(ip, entry);
  if (entry.count > RATE_LIMIT_MAX) {
    return res.status(429).json({ error: 'Rate limit exceeded. Try again later.' });
  }
  next();
}

const localStaff = [
  { id: 1, name: 'Amara Diallo', phone: '+27 71 001 0001', role: 'Bar Staff', total_hours: 0 },
  { id: 2, name: 'Themba Nkosi', phone: '+27 71 001 0002', role: 'Floor Staff', total_hours: 0 },
  { id: 3, name: 'Priya Moodley', phone: '+27 71 001 0003', role: 'Supervisor', total_hours: 0 },
  { id: 4, name: 'Lerato Khumalo', phone: '+27 71 001 0004', role: 'Bar Staff', total_hours: 0 },
  { id: 5, name: 'Sipho Dlamini', phone: '+27 71 001 0005', role: 'Security', total_hours: 0 },
  { id: 6, name: 'Naledi Tau', phone: '+27 71 001 0006', role: 'Floor Staff', total_hours: 0 },
];

const localEvents = [
  { id: '1', title: 'Sandton Jazz Festival', date: '2026-06-14', duration: 6, staff_assigned: '[1,2,5]', staff_ids: '[1,2,5]', start_time: '17:00', end_time: '23:00', venue: 'Sandton Convention Centre', client_id: 1, notes: 'Smart dress code. Parking in basement.', color: '#00e5a0' },
  { id: '2', title: 'Corporate Gala — MTN', date: '2026-06-17', duration: 4, staff_assigned: '[3,4,6]', staff_ids: '[3,4,6]', start_time: '18:00', end_time: '22:00', venue: 'Hyatt Regency JHB', client_id: 2, notes: 'Formal.', color: '#7c6af7' },
];

function parseStaffArray(value) {
  if (Array.isArray(value)) return value.map(item => Number(item)).filter(Number.isFinite);
  if (value === null || value === undefined || value === '') return [];
  const text = String(value).trim();
  if (!text) return [];
  if (text.startsWith('[')) {
    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) return parsed.map(item => Number(item)).filter(Number.isFinite);
    } catch {}
  }
  if (text.includes(',')) return text.split(',').map(item => Number(item.trim())).filter(Number.isFinite);
  return [Number(text)].filter(Number.isFinite);
}

function localStaffById(id) {
  return localStaff.find(staff => Number(staff.id) === Number(id));
}

function localStaffByName(name) {
  return localStaff.find(staff => staff.name === name);
}

function recalculateLocalStaffHours() {
  for (const staff of localStaff) staff.total_hours = 0;
  for (const event of localEvents) {
    const staffIds = parseStaffArray(event.staff_ids || event.staff_assigned);
    for (const staffId of staffIds) {
      const staff = localStaffById(staffId);
      if (staff) staff.total_hours += Number(event.duration || 5);
    }
  }
}

// Basic login for token bootstrap (mirrors /api/login serverless)
app.post('/api/login', (req, res) => {
  const { password, pin } = req.body || {};
  const provided = password || pin;
  if (!provided) return res.status(400).json({ error: 'password or pin required' });

  const adminPass = process.env.FPCC_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD || 'change-this-strong-secret-now';
  const fallback = '0000';
  const valid = provided === adminPass || (provided === fallback && !process.env.FPCC_ADMIN_PASSWORD);

  if (!valid) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const token = signToken({ role: 'admin', sub: 'ops' });
  res.json({ success: true, token, expiresIn: '8h' });
});

function requireWriteAuth(req, res, next) {
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : req.headers['x-admin-token'];
  const user = verifyToken(token);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized - admin token required (POST /api/login)' });
  }
  req.user = user;
  next();
}

// Apple Calendar API - mirrors api/calendar/apple.js (uses shared lib)
app.post('/api/calendar/apple', rateLimitWrites, async (req, res) => {
  try {
    const icloudUrl = req.body?.calendarUrl || process.env.ICLOUD_CALENDAR_URL || DEFAULT_ICLOUD_URL;
    if (!icloudUrl) {
      return res.json({
        success: false,
        events: [],
        count: 0,
        error: 'No iCloud URL configured (set ICLOUD_CALENDAR_URL or pass in body)',
      });
    }
    const events = await fetchAndParseICalendar(icloudUrl);
    return res.json({ success: true, events, count: events.length });
  } catch (error) {
    console.error('Apple Calendar sync error:', error);
    return res.status(500).json({ success: false, events: [], count: 0, error: error.message });
  }
});

// Calendar unified API - mirrors api/calendar.js
app.get('/api/calendar', async (req, res) => {
  try {
    const icloudUrl = process.env.ICLOUD_CALENDAR_URL || DEFAULT_ICLOUD_URL;
    let iCloudEvents = [];
    if (icloudUrl) {
      try {
        iCloudEvents = await fetchAndParseICalendar(icloudUrl);
      } catch (e) {
        console.log('[Calendar] iCloud fetch/parse error:', e.message);
      }
    }
    if (req.query.format === 'json') {
      return res.json({ local: [], icloud: iCloudEvents });
    }
    // ICS format
    let ics = 'BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Fresh People//Command Center//EN\r\n';
    for (const event of iCloudEvents) {
      ics += `BEGIN:VEVENT\r\nUID:${event.uid}\r\nDTSTART:${event.start.replace(/[-:]/g, '').split('.')[0]}Z\r\nDTEND:${event.end.replace(/[-:]/g, '').split('.')[0]}Z\r\nSUMMARY:${event.title}\r\nEND:VEVENT\r\n`;
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
app.post('/api/dispatch-staff', rateLimitWrites, requireWriteAuth, async (req, res) => {
  const { eventId, staffIds } = req.body || {};
  if (!eventId || !Array.isArray(staffIds) || staffIds.length === 0) {
    return res.status(400).json({ success: false, error: 'eventId and staffIds required', dispatched: 0 });
  }
  const event = localEvents.find(item => String(item.id) === String(eventId));
  if (!event) {
    return res.status(404).json({ success: false, error: `Event ${eventId} not found`, dispatched: 0 });
  }
  const details = staffIds.map(id => {
    const staff = localStaffById(id);
    return staff?.phone ? { staffId: Number(id), name: staff.name, phone: staff.phone, status: 'mock-sent' } : { staffId: Number(id), status: 'skipped', reason: 'no phone' };
  });
  return res.json({
    success: true,
    note: 'Local dev: WhatsApp dispatch is mock. Production: api/dispatch-staff.js uses real DB + Meta API. Authenticated.',
    eventId,
    eventTitle: event.title,
    dispatched: details.filter(item => item.status === 'mock-sent').length,
    sent: details.filter(item => item.status === 'mock-sent').length,
    skipped: details.filter(item => item.status === 'skipped').length,
    failed: 0,
    details,
  });
});

// Staff API - mirrors api/staff/index.js for local dev
app.get('/api/staff', (req, res) => res.json({ staff: localStaff }));
app.post('/api/staff', rateLimitWrites, requireWriteAuth, (req, res) => {
  const { name, phone, role, total_hours = 0 } = req.body || {};
  if (!name) return res.status(400).json({ error: 'name is required for new staff' });
  const id = Math.max(0, ...localStaff.map(item => Number(item.id))) + 1;
  const staff = { id, name: name || '', phone: phone || '', role: role || '', total_hours: Number(total_hours) || 0 };
  localStaff.push(staff);
  return res.json({ staff, message: 'Staff added successfully' });
});
app.patch('/api/staff', rateLimitWrites, requireWriteAuth, (req, res) => {
  const { id, name, phone, role } = req.body || {};
  const staff = localStaffById(id);
  if (!staff) return res.status(404).json({ error: 'Staff not found' });
  Object.assign(staff, { name: name ?? staff.name, phone: phone ?? staff.phone, role: role ?? staff.role });
  return res.json({ message: 'Staff updated successfully' });
});
app.delete('/api/staff', rateLimitWrites, requireWriteAuth, (req, res) => {
  const { id } = req.body || {};
  const before = localStaff.length;
  const staff = localStaff.filter(item => String(item.id) !== String(id));
  if (staff.length === before) return res.status(404).json({ error: 'Staff not found' });
  localStaff.splice(0, localStaff.length, ...staff);
  return res.json({ message: 'Staff deleted successfully' });
});

// Events API - mirrors api/events/index.js for local dev
app.get('/api/events', (req, res) => {
  const { id } = req.query || {};
  if (id) {
    const event = localEvents.find(item => String(item.id) === String(id));
    if (!event) return res.status(404).json({ error: 'Event not found' });
    return res.json({ event: { ...event, staff_assigned: parseStaffArray(event.staff_assigned), staff_ids: parseStaffArray(event.staff_ids), date: String(event.date).slice(0, 10) } });
  }
  return res.json({ events: localEvents.map(event => ({ ...event, staff_assigned: parseStaffArray(event.staff_assigned), staff_ids: parseStaffArray(event.staff_ids), date: String(event.date).slice(0, 10) })) });
});
app.post('/api/events', rateLimitWrites, requireWriteAuth, (req, res) => {
  const { id, title, date, duration, staff_assigned, staff_ids, startTime, endTime, venue, clientId, notes, color } = req.body || {};
  if (!title || !date) return res.status(400).json({ error: 'title and date are required' });
  if (!duration || Number(duration) < 5) return res.status(400).json({ error: 'Minimum event duration is 5 hours' });
  const parsedStaffIds = parseStaffArray(staff_ids ?? staff_assigned);
  const event = { id: String(id || (Math.max(0, ...localEvents.map(item => Number(item.id))) + 1)), title, date: String(date).slice(0, 10), duration: Number(duration), staff_assigned: JSON.stringify(staff_assigned || parsedStaffIds), staff_ids: JSON.stringify(parsedStaffIds), start_time: startTime || null, end_time: endTime || null, venue: venue || null, client_id: clientId || null, notes: notes || null, color: color || null };
  localEvents.push(event);
  recalculateLocalStaffHours();
  return res.json({ id: event.id, message: 'Event created successfully' });
});
app.patch('/api/events', rateLimitWrites, requireWriteAuth, (req, res) => {
  const { id, title, date, duration, staff_assigned, staff_ids, startTime, endTime, venue, clientId, notes, color } = req.body || {};
  const event = localEvents.find(item => String(item.id) === String(id));
  if (!event) return res.status(404).json({ error: 'Event not found' });
  if (duration !== undefined && Number(duration) < 5) return res.status(400).json({ error: 'Minimum event duration is 5 hours' });
  Object.assign(event, {
    title: title ?? event.title,
    date: date ? String(date).slice(0, 10) : event.date,
    duration: duration ?? event.duration,
    staff_assigned: staff_assigned !== undefined ? JSON.stringify(staff_assigned) : event.staff_assigned,
    staff_ids: staff_ids !== undefined ? JSON.stringify(parseStaffArray(staff_ids)) : event.staff_ids,
    start_time: startTime !== undefined ? startTime : event.start_time,
    end_time: endTime !== undefined ? endTime : event.end_time,
    venue: venue !== undefined ? venue : event.venue,
    client_id: clientId !== undefined ? clientId : event.client_id,
    notes: notes !== undefined ? notes : event.notes,
    color: color !== undefined ? color : event.color,
  });
  recalculateLocalStaffHours();
  return res.json({ id, message: 'Event updated successfully' });
});
app.delete('/api/events', rateLimitWrites, requireWriteAuth, (req, res) => {
  const { id } = req.body || {};
  const before = localEvents.length;
  const events = localEvents.filter(item => String(item.id) !== String(id));
  if (events.length === before) return res.status(404).json({ error: 'Event not found' });
  localEvents.splice(0, localEvents.length, ...events);
  recalculateLocalStaffHours();
  return res.json({ message: 'Event deleted successfully' });
});

// Google Calendar API (mock for local dev)
app.post('/api/calendar/google', (req, res) => {
  res.json({
    success: true,
    events: [],
    note: 'Local dev: configure GOOGLE_SERVICE_ACCOUNT_BASE64 in .env for real Google Calendar sync',
  });
});

// Finance API - invoices, quotations, statements, and staff-hours reconciliation.
// Vercel Hobby allows 12 functions, so this is mounted through /api/dashboard-data
// and routed by resource=finance instead of a separate /api/finance function.
app.use('/api/dashboard-data', rateLimitWrites, async (req, res) => {
  if (String(req.query?.resource || req.query?.endpoint) !== 'finance') {
    return res.status(404).json({ error: 'Local dashboard-data route not configured' });
  }
  await handleFinanceRequest(req, res);
});

// Serve static build
app.use(express.static(path.join(__dirname, 'dist')));

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📅 Apple Calendar: POST http://localhost:${PORT}/api/calendar/apple`);
  console.log(`📅 Calendar JSON: GET http://localhost:${PORT}/api/calendar?format=json`);
  console.log(`📤 Dispatch: POST http://localhost:${PORT}/api/dispatch-staff (protected)`);
  console.log(`🧾 Finance: GET/POST/PATCH/DELETE http://localhost:${PORT}/api/dashboard-data?resource=finance&financeResource=docs`);
  console.log(`⏱️ Staff hours: GET/POST http://localhost:${PORT}/api/dashboard-data?resource=finance&financeResource=staff-hours`);
  console.log(`🔐 Login for token: POST http://localhost:${PORT}/api/login {password: '...'}`);
  console.log(`🛡️ Writes to /api/staff and /api/events now require admin token (see SECURITY.md)`);
});
