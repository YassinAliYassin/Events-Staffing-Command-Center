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
  const db = getDB();
  
  try {
    await initDB(db);
    
    if (req.method === 'GET') {
      const rows = await allAsync(db, 'SELECT * FROM events ORDER BY date DESC');
      db.close();
      return res.json(rows);
    } else if (req.method === 'POST') {
      const { id, title, date, duration, staff_assigned, dressCode, arrivalTime } = req.body;
      
      if (!title || !date) {
        db.close();
        return res.status(400).json({ error: 'Title and date are required' });
      }
      
      const result = await runAsync(db, 
        `INSERT INTO events (id, title, date, duration, staff_assigned, dressCode, arrivalTime) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          id || `FP-${Date.now()}`,
          title,
          date,
          duration || 4,
          JSON.stringify(staff_assigned || []),
          dressCode || 'All Black',
          arrivalTime || ''
        ]
      );
      
      db.close();
      return res.json({ id: id || `FP-${Date.now()}`, message: 'Event created successfully' });
    } else {
      db.close();
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (err) {
    db.close();
    console.error('API error:', err);
    return res.status(500).json({ error: err.message });
  }
}
