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
    const { checkAuth } = await import('../../lib/auth.js');
    
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
          staff_assigned TEXT,
          staff_ids TEXT
        )
      `);
      await pool.query(`ALTER TABLE events ADD COLUMN IF NOT EXISTS staff_ids TEXT`);
      await pool.query(`ALTER TABLE events ADD COLUMN IF NOT EXISTS start_time TEXT`);
      await pool.query(`ALTER TABLE events ADD COLUMN IF NOT EXISTS end_time TEXT`);
      await pool.query(`ALTER TABLE events ADD COLUMN IF NOT EXISTS venue TEXT`);
      await pool.query(`ALTER TABLE events ADD COLUMN IF NOT EXISTS client_id INTEGER`);
      await pool.query(`ALTER TABLE events ADD COLUMN IF NOT EXISTS notes TEXT`);
      await pool.query(`ALTER TABLE events ADD COLUMN IF NOT EXISTS color TEXT`);
    } catch (e) {
      console.log('Table creation note:', e.message);
    }
    
    const { id } = req.query;
    
    // Protect write operations (POST/PATCH/DELETE) with token from /api/login
    const isWrite = ['POST', 'PATCH', 'DELETE'].includes(req.method);
    if (isWrite) {
      const authed = checkAuth(req, res);
      if (!authed) {
        await pool.end();
        return;
      }
    }
    
    // Basic validation for writes
    if (isWrite && req.method !== 'DELETE') {
      const b = req.body || {};
      if (!b.title || !b.date) {
        await pool.end();
        return res.status(400).json({ error: 'title and date are required' });
      }
    }
    
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
          date: dateOnly(rows[0].date),
          staff_assigned: parseStaffArray(rows[0].staff_assigned),
          staff_ids: parseStaffArray(rows[0].staff_ids)
        };
        await pool.end();
        return res.json({ event });
      }
      
      if (req.method === 'PATCH') {
        const { title, date, duration, staff_assigned, staff_ids, startTime, endTime, venue, clientId, notes, color } = req.body;
        
        // Validate minimum 5-hour charge if duration is being updated
        if (duration !== undefined && duration < 5) {
          await pool.end();
          return res.status(400).json({ error: 'Minimum event duration is 5 hours' });
        }
        
        await pool.query(
          'UPDATE events SET title=COALESCE($1,title), date=COALESCE($2,date), duration=COALESCE($3,duration), staff_assigned=$4, staff_ids=$5, start_time=COALESCE($6,start_time), end_time=COALESCE($7,end_time), venue=COALESCE($8,venue), client_id=COALESCE($9,client_id), notes=COALESCE($10,notes), color=COALESCE($11,color) WHERE id=$12',
          [
            title,
            date ? dateOnly(date) : null,
            duration,
            JSON.stringify(parseStaffArray(staff_assigned)),
            JSON.stringify(parseStaffArray(staff_ids)),
            startTime || null,
            endTime || null,
            venue || null,
            clientId || null,
            notes || null,
            color || null,
            id
          ]
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
        date: dateOnly(row.date),
        staff_assigned: parseStaffArray(row.staff_assigned),
        staff_ids: parseStaffArray(row.staff_ids)
      }));
      await pool.end();
      return res.json({ events });
    }
    
    if (req.method === 'POST') {
      const { id, title, date, duration, staff_assigned, staff_ids, startTime, endTime, venue, clientId, notes, color, sendWhatsApp } = req.body;
      const parsedStaffIds = parseStaffArray(staff_ids ?? staff_assigned);
      
      // Validate minimum 5-hour charge
      if (!duration || duration < 5) {
        await pool.end();
        return res.status(400).json({ error: 'Minimum event duration is 5 hours' });
      }
      
      await pool.query(
        'INSERT INTO events (id, title, date, duration, staff_assigned, staff_ids, start_time, end_time, venue, client_id, notes, color) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)',
        [id, title, date, duration, JSON.stringify(staff_assigned || parsedStaffIds), JSON.stringify(parsedStaffIds), startTime || null, endTime || null, venue || null, clientId || null, notes || null, color || null]
      );
      
      // Send WhatsApp notifications if requested
      let whatsappResults = [];
      if (sendWhatsApp && parsedStaffIds.length > 0) {
        const eventDate = new Date(date);
        const whatsappMessage = `📅 NEW BOOKING ASSIGNED\n\nEvent: ${title}\nDate: ${eventDate.toLocaleDateString()}\nTime: ${eventDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}\nDuration: ${duration || 5}hrs (Minimum 5-hour charge applies)\n\nPlease confirm availability. Thank you!`;
        
        for (const staffId of parsedStaffIds) {
          const staffResult = await pool.query('SELECT id, name, phone FROM staff WHERE id = $1', [staffId]);
          if (staffResult.rows.length > 0 && staffResult.rows[0].phone) {
            const staff = staffResult.rows[0];
            const phone = staff.phone;
            const sent = await sendWhatsAppMessage(phone, whatsappMessage);
            whatsappResults.push({ staff: staff.name, staffId, phone, sent });
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

function parseStaffArray(value) {
  if (Array.isArray(value)) return value.map(item => Number(item)).filter(Number.isFinite);
  if (value === null || value === undefined || value === '') return [];
  const text = String(value).trim();
  if (!text) return [];
  if (text.startsWith('[')) {
    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) return parsed.map(item => Number(item)).filter(Number.isFinite);
    } catch {
      return [];
    }
  }
  if (text.includes(',')) return text.split(',').map(item => Number(item.trim())).filter(Number.isFinite);
  return [Number(text)].filter(Number.isFinite);
}

function parseStaffNames(value) {
  if (Array.isArray(value)) return value.map(item => String(item)).filter(Boolean);
  if (value === null || value === undefined || value === '') return [];
  const text = String(value).trim();
  if (!text) return [];
  if (text.startsWith('[')) {
    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) return parsed.map(item => String(item)).filter(Boolean);
    } catch {
      return [];
    }
  }
  if (text.includes(',')) return text.split(',').map(item => String(item).trim()).filter(Boolean);
  return [text].filter(Boolean);
}

function dateOnly(value) {
  if (!value) return '';
  const text = String(value);
  if (/^\d{4}-\d{2}-\d{2}/.test(text)) return text.slice(0, 10);
  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? text.slice(0, 10) : parsed.toISOString().slice(0, 10);
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
      SELECT staff_ids, staff_assigned, duration, date FROM events 
      WHERE date >= $1 AND date <= $2
    `, [cycle.start, cycle.end]);
    
    // Calculate total hours per staff member
    const staffHours = {};
    
    for (const event of eventsResult.rows) {
      const duration = Number(event.duration || 5);
      const staffIds = parseStaffArray(event.staff_ids);
      let staffKeys = staffIds.length ? staffIds : [];
      
      if (staffKeys.length === 0) {
        const staffNames = parseStaffNames(event.staff_assigned);
        for (const staffName of staffNames) {
          const staffResult = await pool.query('SELECT id FROM staff WHERE name = $1', [staffName]);
          if (staffResult.rows.length > 0) {
            staffKeys.push(Number(staffResult.rows[0].id));
          }
        }
      }
      
      for (const staffId of staffKeys) {
        if (!staffHours[staffId]) {
          staffHours[staffId] = 0;
        }
        staffHours[staffId] += duration;
      }
    }
    
    // Update each staff member's total hours
    for (const [staffId, totalHours] of Object.entries(staffHours)) {
      await pool.query(`
        UPDATE staff SET total_hours = $1 WHERE id = $2
      `, [totalHours, staffId]);
    }
    
    // Reset total hours for staff not in current cycle events
    const allStaff = await pool.query('SELECT id FROM staff');
    for (const staff of allStaff.rows) {
      if (!staffHours[staff.id]) {
        await pool.query(`
          UPDATE staff SET total_hours = 0 WHERE id = $1
        `, [staff.id]);
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
