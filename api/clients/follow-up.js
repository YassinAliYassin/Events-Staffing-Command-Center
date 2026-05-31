export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
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

    // Create client_follow_ups table if not exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS client_follow_ups (
        id SERIAL PRIMARY KEY,
        client_name TEXT NOT NULL,
        client_phone TEXT DEFAULT '',
        follow_up_date DATE NOT NULL,
        status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
        notes TEXT DEFAULT '',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `).catch(e => console.log('Follow-ups table note:', e.message));

    if (req.method === 'POST') {
      const { client_name, client_phone, follow_up_date, notes } = req.body;
      
      if (!client_name || !follow_up_date) {
        await pool.end();
        return res.status(400).json({ error: 'client_name and follow_up_date are required' });
      }

      const { rows } = await pool.query(
        `INSERT INTO client_follow_ups 
         (client_name, client_phone, follow_up_date, notes) 
         VALUES ($1, $2, $3, $4) 
         RETURNING *`,
        [client_name, client_phone || '', follow_up_date, notes || '']
      );

      // Send WhatsApp notification if phone is provided
      let whatsappSent = false;
      if (client_phone && process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID) {
        const message = `Hello ${client_name}, this is a follow-up regarding your recent booking with Fresh People. We'd love to hear about your experience!`;
        whatsappSent = await sendWhatsAppMessage(client_phone, message);
      }

      await pool.end();
      return res.json({ 
        follow_up: rows[0], 
        whatsapp_sent: whatsappSent,
        message: 'Follow-up created successfully' 
      });
    }

    if (req.method === 'GET') {
      const status = req.query.status || 'pending';
      const { rows } = await pool.query(
        'SELECT * FROM client_follow_ups WHERE status = $1 ORDER BY follow_up_date ASC',
        [status]
      );
      await pool.end();
      return res.json({ follow_ups: rows });
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
  let cleaned = phone.replace(/[^\d+]/g, '');
  if (!cleaned.startsWith('+')) {
    cleaned = '+' + cleaned.replace(/\D/g, '');
  }
  return cleaned;
}

async function sendWhatsAppMessage(phone, message) {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  
  if (!token || !phoneId || !phone) return false;

  const formattedPhone = formatE164(phone);
  if (!formattedPhone) return false;

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
    return response.ok;
  } catch (e) {
    console.error('WhatsApp send error:', e.message);
    return false;
  }
}
