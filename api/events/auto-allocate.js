export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
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

    const { event_id, staff_count = 1, role_filter = null } = req.body;

    if (!event_id) {
      await pool.end();
      return res.status(400).json({ error: 'event_id is required' });
    }

    // Check if event exists
    const eventResult = await pool.query('SELECT * FROM events WHERE id = $1', [event_id]);
    if (eventResult.rows.length === 0) {
      await pool.end();
      return res.status(404).json({ error: 'Event not found' });
    }

    const event = eventResult.rows[0];
    const currentStaff = typeof event.staff_assigned === 'string' 
      ? JSON.parse(event.staff_assigned) 
      : (event.staff_assigned || []);

    if (currentStaff.length > 0) {
      await pool.end();
      return res.status(400).json({ 
        error: 'Event already has staff assigned',
        current_staff: currentStaff 
      });
    }

    // Get available staff (not already assigned to overlapping events)
    let staffQuery = `
      SELECT s.id, s.name, s.role, s.total_hours
      FROM staff s
      WHERE s.name NOT IN (
        SELECT unnest(JSON_PARSE(e.staff_assigned)) as name
        FROM events e
        WHERE e.date = $1 AND e.id != $2
      )
    `;
    
    const queryParams = [event.date, event_id];
    
    if (role_filter) {
      staffQuery += ' AND s.role = $3';
      queryParams.push(role_filter);
    }
    
    staffQuery += ' ORDER BY s.total_hours ASC LIMIT $' + (queryParams.length + 1);
    queryParams.push(staff_count);

    const availableStaff = await pool.query(staffQuery, queryParams);

    if (availableStaff.rows.length === 0) {
      await pool.end();
      return res.status(404).json({ 
        error: 'No available staff found for auto-allocation',
        suggestion: 'Try without role filter or add more staff'
      });
    }

    const assignedStaff = availableStaff.rows.map(s => s.name);

    // Update event with assigned staff
    await pool.query(
      'UPDATE events SET staff_assigned = $1 WHERE id = $2',
      [JSON.stringify(assignedStaff), event_id]
    );

    // Recalculate staff hours
    await recalculateStaffHours(pool);
    
    await pool.end();
    return res.json({ 
      event_id,
      assigned_staff: assignedStaff,
      message: `Successfully allocated ${assignedStaff.length} staff to event`,
      staff_details: availableStaff.rows
    });

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: error.message || 'Server error' });
  }
}

async function recalculateStaffHours(pool) {
  try {
    // Add totalHours column to staff table if not exists
    await pool.query(`ALTER TABLE staff ADD COLUMN IF NOT EXISTS total_hours INTEGER DEFAULT 0`).catch(e => {});
    
    // Calculate current cycle
    const now = new Date();
    const currentDay = now.getDate();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    let startDate, endDate;
    if (currentDay >= 26) {
      startDate = new Date(currentYear, currentMonth, 26);
      endDate = new Date(currentYear, currentMonth + 1, 25, 23, 59, 59, 999);
    } else {
      startDate = new Date(currentYear, currentMonth - 1, 26);
      endDate = new Date(currentYear, currentMonth, 25, 23, 59, 59, 999);
    }
    
    const cycleStart = startDate.toISOString().split('T')[0];
    const cycleEnd = endDate.toISOString().split('T')[0];

    // Get all events in current cycle
    const eventsResult = await pool.query(`
      SELECT staff_assigned, duration, date FROM events 
      WHERE date >= $1 AND date <= $2
    `, [cycleStart, cycleEnd]);
    
    // Calculate total hours per staff
    const staffHours = {};
    for (const event of eventsResult.rows) {
      const staffAssigned = typeof event.staff_assigned === 'string' 
        ? JSON.parse(event.staff_assigned) 
        : event.staff_assigned;
      const duration = event.duration || 5;
      
      if (Array.isArray(staffAssigned)) {
        for (const staffName of staffAssigned) {
          staffHours[staffName] = (staffHours[staffName] || 0) + duration;
        }
      }
    }
    
    // Update staff hours
    for (const [staffName, totalHours] of Object.entries(staffHours)) {
      await pool.query(`UPDATE staff SET total_hours = $1 WHERE name = $2`, [totalHours, staffName]);
    }
    
    // Reset hours for staff not in current cycle
    const allStaff = await pool.query('SELECT name FROM staff');
    for (const staff of allStaff.rows) {
      if (!staffHours[staff.name]) {
        await pool.query(`UPDATE staff SET total_hours = 0 WHERE name = $1`, [staff.name]);
      }
    }
  } catch (error) {
    console.error('Error recalculating staff hours:', error);
  }
}
