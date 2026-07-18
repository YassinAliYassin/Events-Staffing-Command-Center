// File-backed store for local Express API (mirrors browser dataStore seed).
// Used when DATABASE_URL is not configured so /api/staff and /api/events work offline.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STORE_PATH = path.join(__dirname, '..', '.data', 'local-api-store.json');

function ymd(d) {
  return d.toISOString().slice(0, 10);
}
function addDays(d, n) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

function seed() {
  const today = new Date();
  return {
    staff: [
      { id: 1, name: 'Amara Diallo', phone: '+27 71 001 0001', role: 'Bar Staff', rate: 40, pin: '1111', department: 'Bar', email: 'amara@freshpeople.co.za', total_hours: 0, status: 'active', availability: 'available' },
      { id: 2, name: 'Themba Nkosi', phone: '+27 71 001 0002', role: 'Floor Staff', rate: 40, pin: '2222', department: 'Floor', email: 'themba@freshpeople.co.za', total_hours: 0, status: 'active', availability: 'available' },
      { id: 3, name: 'Priya Moodley', phone: '+27 71 001 0003', role: 'Supervisor', rate: 55, pin: '3333', department: 'Management', email: 'priya@freshpeople.co.za', total_hours: 0, status: 'active', availability: 'available' },
      { id: 4, name: 'Lerato Khumalo', phone: '+27 71 001 0004', role: 'Bar Staff', rate: 40, pin: '4444', department: 'Bar', email: 'lerato@freshpeople.co.za', total_hours: 0, status: 'active', availability: 'available' },
      { id: 5, name: 'Sipho Dlamini', phone: '+27 71 001 0005', role: 'Security', rate: 45, pin: '5555', department: 'Security', email: 'sipho@freshpeople.co.za', total_hours: 0, status: 'active', availability: 'available' },
      { id: 6, name: 'Naledi Tau', phone: '+27 71 001 0006', role: 'Floor Staff', rate: 40, pin: '6666', department: 'Floor', email: 'naledi@freshpeople.co.za', total_hours: 0, status: 'active', availability: 'available' },
    ],
    events: [
      { id: '1', title: 'Sandton Jazz Festival', date: ymd(addDays(today, 2)), duration: 6, venue: 'Sandton Convention Centre', staffIds: [1, 2, 5], startTime: '17:00', endTime: '23:00', clientId: 1, status: 'Confirmed' },
      { id: '2', title: 'Corporate Gala — MTN', date: ymd(addDays(today, 5)), duration: 4, venue: 'Hyatt Regency JHB', staffIds: [3, 4, 6], startTime: '18:00', endTime: '22:00', clientId: 2, status: 'Confirmed' },
      { id: '3', title: 'Wedding: Khumalo/Singh', date: ymd(addDays(today, 8)), duration: 8, venue: 'Zimbali Estate', staffIds: [1, 2, 3, 4], startTime: '12:00', endTime: '20:00', clientId: 3, status: 'Pending' },
    ],
    clients: [
      { id: 1, name: 'Sandton Events Co', email: 'ops@sandtonevents.co.za', phone: '+27 11 555 0100' },
      { id: 2, name: 'MTN Group Ltd', email: 'procurement@mtn.com', phone: '+27 11 912 3000' },
      { id: 3, name: 'Priya & Dev Khumalo', email: 'priya.khumalo@gmail.com', phone: '+27 82 333 0001' },
    ],
  };
}

function ensureDir() {
  const dir = path.dirname(STORE_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

export function loadStore() {
  try {
    if (fs.existsSync(STORE_PATH)) {
      return JSON.parse(fs.readFileSync(STORE_PATH, 'utf8'));
    }
  } catch {}
  const s = seed();
  saveStore(s);
  return s;
}

export function saveStore(store) {
  try {
    ensureDir();
    fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2));
  } catch (e) {
    console.warn('[local-store] save failed:', e.message);
  }
}

export function nextId(arr) {
  const nums = arr.map((x) => Number(x.id) || 0);
  return (nums.length ? Math.max(...nums) : 0) + 1;
}
