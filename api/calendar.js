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

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const db = getDB();
  
  db.all('SELECT * FROM events ORDER BY date', [], (err, events) => {
    db.close();
    if (err) return res.status(500).json({ error: err.message });
    
    let ics = 'BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Fresh People//Events//EN\r\n';
    
    events.forEach(event => {
      // Parse date from ISO string (e.g., "2026-05-29T10:00")
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
  });
}
