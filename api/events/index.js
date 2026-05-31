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
      const { id, title, date, duration, staff_assigned, sendWhatsApp } = req.body;
      
      // Validate minimum 5-hour charge
      if (!duration || duration < 5) {
        await pool.end();
        return res.status(400).json({ error: 'Minimum event duration is 5 hours' });
      }
      
      await pool.query(
        'INSERT INTO events (id, title, date, duration, staff_assigned) VALUES ($1, $2, $3, $4, $5)',
        [id, title, date, duration, JSON.stringify(staff_assigned)]
      );
      
      // Send WhatsApp notifications if requested
      let whatsappResults = [];
      if (sendWhatsApp && staff_assigned && staff_assigned.length > 0) {
        const eventDate = new Date(date);
        const whatsappMessage = `📅 NEW BOOKING ASSIGNED\n\nEvent: ${title}\nDate: ${eventDate.toLocaleDateString()}\nTime: ${eventDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}\nDuration: ${duration || 5}hrs (Minimum 5-hour charge applies)\n\nPlease confirm availability. Thank you!`;
        
        for (const staffName of staff_assigned) {
          const staffResult = await pool.query('SELECT phone FROM staff WHERE name = $1', [staffName]);
          if (staffResult.rows.length > 0 && staffResult.rows[0].phone) {
            const phone = staffResult.rows[0].phone;
            const sent = await sendWhatsAppMessage(phone, whatsappMessage);
            whatsappResults.push({ staff: staffName, phone, sent });
          }
        }
      }
      
      // Recalculate staff total hours after creation
      await recalculateStaffHours();
      
      await pool.end();
      return res.json({ 
        id, 
        message: 'Event created successfully',
        whatsapp: whatsappResults.length > 0 ? whatsappResults : undefined
      });
    }
    
    await pool.end();
    return res.status(405).json({ error: 'Method not allowed' });
    
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: error.message || 'Server error' });
  }
}

function formatE164(phone) {
  if (!phone) return '';
  // Remove all non-digit characters except +
  let cleaned = phone.replace(/[^\d+]/g, '');
  // If it doesn't start with +, add it
  if (!cleaned.startsWith('+')) {
    cleaned = '+' + cleaned.replace(/\D/g, '');
  }
  return cleaned;
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

async function sendWhatsAppMessage(phone, message) {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  
  if (!token || !phoneId || !phone) {
    console.log('[WhatsApp] Missing credentials or phone, skipping');
    return false;
  }

  const formattedPhone = formatE164(phone);
  if (!formattedPhone) {
    console.error('[WhatsApp] Invalid phone number after formatting:', phone);
    return false;
  }
  
  try {
    const response = await fetch(`https://graph.facebook.com/v22.0/${phoneId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: formattedPhone,
        type: 'text',
        text: { body: message }
      })
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      console.error('[WhatsApp] API Request Failed:', {
        status: response.status,
        statusText: response.statusText,
        phoneId,
        recipient: formattedPhone,
        originalPhone: phone,
        error: result.error || result,
        messagePreview: message.substring(0, 50) + '...'
      });
      return false;
    }
    
    if (result.error) {
      console.error('[WhatsApp] Business Logic Error:', {
        recipient: formattedPhone,
        error: result.error,
        whatsappError: result.error
      });
      return false;
    }
    
    console.log('[WhatsApp] Message sent successfully to:', formattedPhone);
    return true;
  } catch (e) {
    console.error('[WhatsApp] Send Exception:', {
      recipient: formattedPhone,
      error: e.message,
      stack: e.stack?.split('\n').slice(0, 3).join('\n')
    });
    return false;
  }
}
