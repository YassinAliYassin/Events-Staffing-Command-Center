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

    // Create staff_attendance table if not exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS staff_attendance (
        id SERIAL PRIMARY KEY,
        staff_id INTEGER REFERENCES staff(id) ON DELETE CASCADE,
        attendance_date DATE DEFAULT CURRENT_DATE,
        status TEXT DEFAULT 'present' CHECK (status IN ('present', 'absent', 'late', 'half-day')),
        check_in_time TIMESTAMP WITH TIME ZONE,
        check_out_time TIMESTAMP WITH TIME ZONE,
        hours_worked INTEGER DEFAULT 0,
        UNIQUE(staff_id, attendance_date)
      )
    `).catch(e => console.log('Attendance table note:', e.message));

    // Get attendance summary for current month
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

    const { rows } = await pool.query(`
      SELECT 
        s.id, s.name, s.role,
        COUNT(CASE WHEN sa.status = 'present' THEN 1 END) as present_days,
        COUNT(CASE WHEN sa.status = 'absent' THEN 1 END) as absent_days,
        COUNT(CASE WHEN sa.status = 'late' THEN 1 END) as late_days,
        COUNT(CASE WHEN sa.status = 'half-day' THEN 1 END) as half_days,
        SUM(sa.hours_worked) as total_hours,
        COUNT(sa.id) as total_days_recorded
      FROM staff s
      LEFT JOIN staff_attendance sa ON s.id = sa.staff_id 
        AND TO_CHAR(sa.attendance_date, 'YYYY-MM') = $1
      GROUP BY s.id, s.name, s.role
      ORDER BY s.name ASC
    `, [currentMonth]);

    // Get overall summary
    const summaryResult = await pool.query(`
      SELECT 
        COUNT(CASE WHEN status = 'present' THEN 1 END) as total_present,
        COUNT(CASE WHEN status = 'absent' THEN 1 END) as total_absent,
        COUNT(CASE WHEN status = 'late' THEN 1 END) as total_late,
        COUNT(*) as total_records
      FROM staff_attendance
      WHERE TO_CHAR(attendance_date, 'YYYY-MM') = $1
    `, [currentMonth]);

    await pool.end();
    return res.json({ 
      attendance: rows,
      summary: summaryResult.rows[0] || {},
      month: currentMonth
    });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: error.message || 'Server error' });
  }
}
