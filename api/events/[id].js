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
  const { id } = req.query;
  
  if (!id) {
    return res.status(400).json({ error: 'Event ID is required' });
  }
  
  const db = getDB();
  
  try {
    await initDB(db);
    
    if (req.method === 'PATCH' || req.method === 'PUT') {
      const updates = req.body;
      
      if (Object.keys(updates).length === 0) {
        db.close();
        return res.status(400).json({ error: 'No fields to update' });
      }
      
      const fields = Object.keys(updates).map(k => `${k} = ?`).join(', ');
      const values = [...Object.values(updates), id];
      
      await runAsync(db, `UPDATE events SET ${fields} WHERE id = ?`, values);
      db.close();
      return res.json({ message: 'Event updated successfully' });
    } else if (req.method === 'DELETE') {
      await runAsync(db, 'DELETE FROM events WHERE id = ?', [id]);
      db.close();
      return res.json({ message: 'Event deleted successfully' });
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
