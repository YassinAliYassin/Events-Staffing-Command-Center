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
  
  if (req.method === 'GET') {
    const { rows } = await pool.query('SELECT * FROM events ORDER BY date ASC');
    return res.json({ events: rows });
  }
  
  if (req.method === 'POST') {
    const { id, title, date, duration, staff_assigned, dressCode, arrivalTime } = req.body;
    await pool.query(
      'INSERT INTO events (id, title, date, duration, staff_assigned, dressCode, arrivalTime) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [id, title, date, duration, JSON.stringify(staff_assigned), dressCode, arrivalTime]
    );
    return res.json({ id, message: 'Event created successfully' });
  }
  
  res.status(405).json({ error: 'Method not allowed' });
}
