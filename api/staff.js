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
  await runAsync(db, `CREATE TABLE IF NOT EXISTS staff (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fullName TEXT NOT NULL,
    role TEXT DEFAULT 'Staff',
    phone TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
}

export default async function handler(req, res) {
  const db = getDB();
  
  try {
    await initDB(db);
    
    if (req.method === 'GET') {
      const rows = await allAsync(db, 'SELECT * FROM staff ORDER BY fullName');
      db.close();
      return res.json({ staff: rows });
    } else if (req.method === 'POST') {
      const { fullName, role, phone } = req.body;
      
      if (!fullName) {
        db.close();
        return res.status(400).json({ error: 'fullName is required' });
      }
      
      await runAsync(db, 
        `INSERT INTO staff (fullName, role, phone) VALUES (?, ?, ?)`,
        [fullName, role || 'Staff', phone || '']
      );
      
      db.close();
      return res.json({ message: 'Staff added successfully' });
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
