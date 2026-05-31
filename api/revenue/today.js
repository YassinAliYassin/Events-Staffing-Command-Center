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

    const today = new Date().toISOString().split('T')[0];
    const hourlyRate = parseFloat(process.env.HOURLY_RATE) || 50; // Default $50/hour

    // Get today's events
    const eventsResult = await pool.query(
      'SELECT * FROM events WHERE date = $1',
      [today]
    );

    const events = eventsResult.rows.map(row => ({
      ...row,
      staff_assigned: typeof row.staff_assigned === 'string' ? JSON.parse(row.staff_assigned) : row.staff_assigned
    }));

    // Calculate revenue
    let totalRevenue = 0;
    let totalHours = 0;
    const eventDetails = [];

    for (const event of events) {
      const duration = Math.max(event.duration || 5, 5); // Enforce 5-hour minimum
      const eventRevenue = duration * hourlyRate;
      totalRevenue += eventRevenue;
      totalHours += duration;

      eventDetails.push({
        id: event.id,
        title: event.title,
        duration,
        revenue: eventRevenue,
        staff_count: (event.staff_assigned || []).length
      });
    }

    // Get week-to-date and month-to-date revenue
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Start of week (Sunday)
    const monthStart = new Date();
    monthStart.setDate(1); // Start of month

    const weekResult = await pool.query(
      'SELECT SUM(duration) as total_hours FROM events WHERE date >= $1 AND date <= $2',
      [weekStart.toISOString().split('T')[0], today]
    );

    const monthResult = await pool.query(
      'SELECT SUM(duration) as total_hours FROM events WHERE date >= $1 AND date <= $2',
      [monthStart.toISOString().split('T')[0], today]
    );

    const weekHours = weekResult.rows[0].total_hours || 0;
    const monthHours = monthResult.rows[0].total_hours || 0;

    await pool.end();
    return res.json({
      date: today,
      today: {
        events_count: events.length,
        total_hours: totalHours,
        revenue: totalRevenue,
        hourly_rate: hourlyRate,
        events: eventDetails
      },
      week_to_date: {
        total_hours: weekHours,
        revenue: weekHours * hourlyRate
      },
      month_to_date: {
        total_hours: monthHours,
        revenue: monthHours * hourlyRate
      },
      generated_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: error.message || 'Server error' });
  }
}
