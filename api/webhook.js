import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Init table
async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      title TEXT,
      date TEXT,
      duration INTEGER,
      staff_assigned TEXT,
      dressCode TEXT,
      arrivalTime TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

export default async function handler(req, res) {
  await initDB();
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const event = req.body;
  const id = event.id || `FP-${Date.now()}`;
  
  await pool.query(
    'INSERT INTO events (id, title, date, duration, staff_assigned, dressCode, arrivalTime) VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (id) DO UPDATE SET title=$2, date=$3, duration=$4, staff_assigned=$5, dressCode=$6, arrivalTime=$7',
    [id, event.title, event.date, event.duration || 4, JSON.stringify(event.staff_assigned || []), event.dressCode || 'Formal All Black', event.arrivalTime || '1hr before']
  );
  
  return res.json({ id, message: 'Event synced from webhook' });
}
