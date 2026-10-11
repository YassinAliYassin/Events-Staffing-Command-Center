export default async function handler(req, res) {
  // Permanent CORS headers for browser-based submissions
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
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
    
    // Create table if not exists (original schema only)
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS events (
          id TEXT PRIMARY KEY,
          title TEXT,
          date TEXT,
          duration INTEGER DEFAULT 5,
          staff_assigned TEXT
        )
      `);
    } catch (e) {
      console.log('Table creation note:', e.message);
    }
    
    const { id } = req.query;
    
    // Single event operations
    if (id) {
      if (req.method === 'GET') {
        const { rows } = await pool.query('SELECT * FROM events WHERE id = $1', [id]);
        if (rows.length === 0) {
          await pool.end();
          return res.status(404).json({ error: 'Event not found' });
        }
        const event = {
          ...rows[0],
          staff_assigned: typeof rows[0].staff_assigned === 'string' ? JSON.parse(rows[0].staff_assigned) : rows[0].staff_assigned
        };
        await pool.end();
        return res.json({ event });
      }
      
      if (req.method === 'PATCH') {
        const { title, date, duration, staff_assigned } = req.body;
        
        // Validate minimum 5-hour charge if duration is being updated
        if (duration !== undefined && duration < 5) {
          await pool.end();
          return res.status(400).json({ error: 'Minimum event duration is 5 hours' });
        }
        
        await pool.query(
          'UPDATE events SET title=$1, date=$2, duration=$3, staff_assigned=$4 WHERE id=$5',
          [title, date, duration, JSON.stringify(staff_assigned), id]
        );
        
        // Recalculate staff total hours after update
        await recalculateStaffHours();
        await pool.end();
        return res.json({ id, message: 'Event updated successfully' });
      }
      
      if (req.method === 'DELETE') {
        await pool.query('DELETE FROM events WHERE id=$1', [id]);
        
        // Recalculate staff total hours after deletion
        await recalculateStaffHours();
        await pool.end();
        return res.json({ message: 'Event deleted successfully' });
      }
      
      await pool.end();
      return res.status(405).json({ error: 'Method not allowed' });
    }
    
    // Collection operations
    if (req.method === 'GET') {
      const { rows } = await pool.query('SELECT * FROM events ORDER BY date ASC');
      const events = rows.map(row => ({
        ...row,
        staff_assigned: typeof row.staff_assigned === 'string' ? JSON.parse(row.staff_assigned) : row.staff_assigned
      }));
      await pool.end();
      return res.json({ events });
    }
    
    if (req.method === 'POST') {
      const { id, title, date, duration, staff_assigned } = req.body;
      
      // Validate minimum 5-hour charge
      if (!duration || duration < 5) {
        await pool.end();
        return res.status(400).json({ error: 'Minimum event duration is 5 hours' });
      }
      
      await pool.query(
        'INSERT INTO events (id, title, date, duration, staff_assigned) VALUES ($1, $2, $3, $4, $5)',
        [id, title, date, duration, JSON.stringify(staff_assigned)]
      );

      await recalculateStaffHours();

      await pool.end();
      return res.json({
        id,
        message: 'Event created successfully'
      });
    }
    
    await pool.end();
    return res.status(405).json({ error: 'Method not allowed' });
    
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: error.message || 'Server error' });
  }
}

// Calculate current payroll cycle (26th of previous month to 25th of current month)
function getCurrentCycle() {
  const now = new Date();
  const currentDay = now.getDate();
  const currentMonth = now.getMonth(); // 0-indexed
  const currentYear = now.getFullYear();
  
  let startDate, endDate;
  
  if (currentDay >= 26) {
    // After 26th: cycle starts this month on 26th, ends 25th next month
    startDate = new Date(currentYear, currentMonth, 26);
    endDate = new Date(currentYear, currentMonth + 1, 25, 23, 59, 59, 999);
  } else {
    // Before 26th: cycle started last month on 26th, ends 25th this month
    startDate = new Date(currentYear, currentMonth - 1, 26);
    endDate = new Date(currentYear, currentMonth, 25, 23, 59, 59, 999);
  }
  
  return {
    start: startDate.toISOString().split('T')[0],
    end: endDate.toISOString().split('T')[0]
  };
}

// Recalculate staff total hours for current cycle and update staff records
async function recalculateStaffHours() {
  try {
    const { Pool } = await import('pg');
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: 1,
      idleTimeoutMillis: 100
    });
    
    // Add totalHours column to staff table if not exists
    await pool.query(`
      ALTER TABLE staff ADD COLUMN IF NOT EXISTS total_hours INTEGER DEFAULT 0
    `).catch(e => console.log('Column exists or error:', e.message));
    
    const cycle = getCurrentCycle();
    
    // Get all events in current cycle with their staff assignments and duration
    const eventsResult = await pool.query(`
      SELECT staff_assigned, duration, date FROM events 
      WHERE date >= $1 AND date <= $2
    `, [cycle.start, cycle.end]);
    
    // Calculate total hours per staff member
    const staffHours = {};
    
    for (const event of eventsResult.rows) {
      const staffAssigned = typeof event.staff_assigned === 'string' 
        ? JSON.parse(event.staff_assigned) 
        : event.staff_assigned;
      const duration = event.duration || 5;
      
      if (Array.isArray(staffAssigned)) {
        for (const staffName of staffAssigned) {
          if (!staffHours[staffName]) {
            staffHours[staffName] = 0;
          }
          staffHours[staffName] += duration;
        }
      }
    }
    
    // Update each staff member's total hours
    for (const [staffName, totalHours] of Object.entries(staffHours)) {
      await pool.query(`
        UPDATE staff SET total_hours = $1 WHERE name = $2
      `, [totalHours, staffName]);
    }
    
    // Reset total hours for staff not in current cycle events
    const allStaff = await pool.query('SELECT name FROM staff');
    for (const staff of allStaff.rows) {
      if (!staffHours[staff.name]) {
        await pool.query(`
          UPDATE staff SET total_hours = 0 WHERE name = $1
        `, [staff.name]);
      }
    }
    
    await pool.end();
    console.log('Staff total hours recalculated for cycle:', cycle.start, 'to', cycle.end);
  } catch (error) {
    console.error('Error recalculating staff hours:', error);
  }
}
