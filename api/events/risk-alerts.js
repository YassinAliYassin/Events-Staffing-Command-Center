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

    // Create tables if not exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS events (
        id TEXT PRIMARY KEY,
        title TEXT,
        date TEXT,
        duration INTEGER DEFAULT 5,
        staff_assigned TEXT
      )
    `).catch(e => console.log('Events table note:', e.message));

    await pool.query(`
      CREATE TABLE IF NOT EXISTS staff (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        phone TEXT DEFAULT '',
        role TEXT DEFAULT '',
        total_hours INTEGER DEFAULT 0
      )
    `).catch(e => console.log('Staff table note:', e.message));

    const currentDate = new Date().toISOString().split('T')[0];
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Get upcoming events
    const eventsResult = await pool.query(
      'SELECT * FROM events WHERE date >= $1 AND date <= $2 ORDER BY date ASC',
      [currentDate, nextWeek]
    );

    const alerts = [];
    
    for (const event of eventsResult.rows) {
      const staffAssigned = typeof event.staff_assigned === 'string' 
        ? JSON.parse(event.staff_assigned) 
        : (event.staff_assigned || []);
      
      const eventDate = new Date(event.date);
      const daysUntil = Math.ceil((eventDate - new Date()) / (1000 * 60 * 60 * 24));

      // Alert 1: Event with no staff assigned
      if (staffAssigned.length === 0) {
        alerts.push({
          event_id: event.id,
          event_title: event.title,
          date: event.date,
          severity: 'high',
          type: 'no_staff',
          message: `Event "${event.title}" has no staff assigned (${daysUntil} days away)`
        });
      }

      // Alert 2: Event with staff having high hours
      if (staffAssigned.length > 0) {
        const staffResult = await pool.query(
          'SELECT name, total_hours FROM staff WHERE name = ANY($1)',
          [staffAssigned]
        );
        
        const overworkedStaff = staffResult.rows.filter(s => s.total_hours >= 40);
        if (overworkedStaff.length > 0) {
          alerts.push({
            event_id: event.id,
            event_title: event.title,
            date: event.date,
            severity: 'medium',
            type: 'overworked_staff',
            message: `Event "${event.title}" has staff with high hours: ${overworkedStaff.map(s => `${s.name} (${s.total_hours}h)`).join(', ')}`
          });
        }
      }

      // Alert 3: Event very soon (less than 24 hours) with no staff
      if (daysUntil < 1 && staffAssigned.length === 0) {
        alerts.push({
          event_id: event.id,
          event_title: event.title,
          date: event.date,
          severity: 'critical',
          type: 'imminent_no_staff',
          message: `URGENT: Event "${event.title}" is less than 24 hours away with no staff assigned!`
        });
      }
    }

    await pool.end();
    return res.json({ 
      alerts, 
      count: alerts.length,
      generated_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: error.message || 'Server error' });
  }
}
