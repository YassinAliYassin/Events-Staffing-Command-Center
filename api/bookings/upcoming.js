export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { Pool } = await import('pg');
    
    if (!process.env.DATABASE_URL) {
      return res.status(500).json({ error: 'DATABASE_URL not set' });
    }
    
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: 1,
      idleTimeoutMillis: 100
    });

    // Create events table if not exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS events (
        id TEXT PRIMARY KEY,
        title TEXT,
        date TEXT,
        duration INTEGER DEFAULT 5,
        staff_assigned TEXT
      )
    `).catch(e => console.log('Events table note:', e.message));

    // Upcoming bookings: all events from today onwards
    const currentDate = new Date().toISOString().split('T')[0];
    const limit = parseInt(req.query.limit) || 10;

    const { rows } = await pool.query(
      'SELECT * FROM events WHERE date >= $1 ORDER BY date ASC LIMIT $2',
      [currentDate, limit]
    );

    const bookings = rows.map(row => ({
      ...row,
      staff_assigned: typeof row.staff_assigned === 'string' ? JSON.parse(row.staff_assigned) : row.staff_assigned
    }));

    await pool.end();
    return res.json({ bookings, count: bookings.length });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: error.message || 'Server error' });
  }
}
