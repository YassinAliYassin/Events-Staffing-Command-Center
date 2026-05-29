import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = process.env.NODE_ENV === 'production' ? '/tmp/events.db' : path.join(__dirname, '..', 'events.db');

function getDB() {
  return new sqlite3.Database(dbPath, (err) => {
    if (err) console.error('DB open error:', err);
  });
}

function runAsync(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}

function allAsync(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

async function initDB(db) {
  await runAsync(db, `CREATE TABLE IF NOT EXISTS events (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    date TEXT NOT NULL,
    duration INTEGER DEFAULT 4,
    staff_assigned TEXT,
    dressCode TEXT DEFAULT 'All Black',
    arrivalTime TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const db = getDB();
  
  try {
    await initDB(db);
    
    const events = await allAsync(db, 'SELECT * FROM events ORDER BY date');
    db.close();
    
    let ics = 'BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Fresh People//Events//EN\r\n';
    
    events.forEach(event => {
      const startDate = new Date(event.date);
      const endDate = new Date(startDate.getTime() + (event.duration || 4) * 60 * 60 * 1000);
      
      const formatDate = (d) => {
        return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      };
      
      ics += 'BEGIN:VEVENT\r\n';
      ics += `UID:${event.id}@fresh-people.co.za\r\n`;
      ics += `DTSTART:${formatDate(startDate)}\r\n`;
      ics += `DTEND:${formatDate(endDate)}\r\n`;
      ics += `SUMMARY:${event.title || 'Event'}\r\n`;
      ics += `DESCRIPTION:Dress Code: ${event.dressCode || 'All Black'}\r\n`;
      ics += 'END:VEVENT\r\n';
    });
    
    ics += 'END:VCALENDAR\r\n';
    
    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="FreshPeople-Events.ics"');
    res.send(ics);
  } catch (err) {
    db.close();
    console.error('API error:', err);
    return res.status(500).json({ error: err.message });
  }
}
