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

    // Create staff_check_ins table if not exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS staff_check_ins (
        id SERIAL PRIMARY KEY,
        staff_id INTEGER REFERENCES staff(id) ON DELETE CASCADE,
        check_in_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        check_out_time TIMESTAMP WITH TIME ZONE,
        status TEXT DEFAULT 'checked-in' CHECK (status IN ('checked-in', 'checked-out')),
        location TEXT DEFAULT '',
        notes TEXT DEFAULT '',
        UNIQUE(staff_id, check_in_time)
      )
    `).catch(e => console.log('Check-ins table note:', e.message));

    // Get all staff with their latest check-in status
    const { rows } = await pool.query(`
      SELECT 
        s.id, s.name, s.phone, s.role,
        sci.status as check_in_status,
        sci.check_in_time,
        sci.check_out_time,
        sci.location
      FROM staff s
      LEFT JOIN (
        SELECT DISTINCT ON (staff_id) *
        FROM staff_check_ins
        ORDER BY staff_id, check_in_time DESC
      ) sci ON s.id = sci.staff_id
      ORDER BY s.name ASC
    `);

    await pool.end();
    return res.json({ staff: rows });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: error.message || 'Server error' });
  }
}
