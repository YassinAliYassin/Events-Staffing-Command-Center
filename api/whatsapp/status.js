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
    const token = process.env.WHATSAPP_ACCESS_TOKEN;
    const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    
    const status = {
      configured: !!(token && phoneId),
      access_token_set: !!token,
      phone_number_id_set: !!phoneId,
      timestamp: new Date().toISOString()
    };

    // Test API connection if configured
    if (status.configured) {
      try {
        const response = await fetch(`https://graph.facebook.com/v22.0/${phoneId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          status.api_status = 'connected';
          status.phone_number_id = data.id;
          status.display_phone_number = data.display_phone_number;
        } else {
          status.api_status = 'error';
          status.error = `API returned ${response.status}`;
        }
      } catch (error) {
        status.api_status = 'error';
        status.error = error.message;
      }
    } else {
      status.api_status = 'not_configured';
    }

    return res.json({ whatsapp: status });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: error.message || 'Server error' });
  }
}
