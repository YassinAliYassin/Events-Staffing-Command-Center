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

function initDB(db) {
  db.run(`CREATE TABLE IF NOT EXISTS events (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    date TEXT NOT NULL,
    duration INTEGER DEFAULT 4,
    staff_assigned TEXT,
    dressCode TEXT DEFAULT 'All Black',
    arrivalTime TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`, (err) => {
    if (err) console.error('DB init error:', err);
  });
}

export default async function handler(req, res) {
  const db = getDB();
  initDB(db);
  
  if (req.method === 'GET') {
    db.all('SELECT * FROM events ORDER BY date DESC', [], (err, rows) => {
      db.close();
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    });
  } else if (req.method === 'POST') {
    const { id, title, date, duration, staff_assigned, dressCode, arrivalTime } = req.body;
    
    if (!title || !date) {
      db.close();
      return res.status(400).json({ error: 'Title and date are required' });
    }
    
    db.run(`INSERT INTO events (id, title, date, duration, staff_assigned, dressCode, arrivalTime) 
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        id || `FP-${Date.now()}`,
        title,
        date,
        duration || 4,
        JSON.stringify(staff_assigned || []),
        dressCode || 'All Black',
        arrivalTime || ''
      ],
      function(err) {
        db.close();
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID || id, message: 'Event created successfully' });
      });
  } else {
    db.close();
    res.status(405).json({ error: 'Method not allowed' });
  }
}
