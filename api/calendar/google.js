// Google Calendar API - Simple & Direct
// Uses service account to read/write Google Calendar
// No Nylas needed - direct Google ↔ Apple sync via iCal

const { JWT } = require('google-auth-library');

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Parse service account from base64
    if (!process.env.GOOGLE_SERVICE_ACCOUNT_BASE64) {
      return res.status(500).json({ 
        error: 'Missing GOOGLE_SERVICE_ACCOUNT_BASE64 in Vercel env vars' 
      });
    }

    const serviceAccount = JSON.parse(
      Buffer.from(process.env.GOOGLE_SERVICE_ACCOUNT_BASE64, 'base64').toString()
    );

    // Authenticate with Google
    const client = new JWT({
      email: serviceAccount.client_email,
      key: serviceAccount.private_key,
      scopes: ['https://www.googleapis.com/auth/calendar']
    });

    await client.authorize();
    
    const calendarId = 'primary'; // Your main calendar
    const baseUrl = `https://www.googleapis.com/calendar/v3/calendars/${calendarId}`;

    // GET - Fetch events from Google Calendar
    if (req.method === 'GET') {
      const timeMin = new Date().toISOString();
      const timeMax = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      
      const url = `${baseUrl}/events?timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime`;
      
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${client.credentials.access_token}` }
      });

      const data = await response.json();
      
      if (!response.ok) {
        return res.status(response.status).json({ 
          error: 'Google API error', 
          details: data 
        });
      }

      return res.status(200).json({
        success: true,
        events: (data.items || []).map(event => ({
          id: event.id,
          title: event.summary || 'Untitled Event',
          start: event.start?.dateTime || event.start?.date,
          end: event.end?.dateTime || event.end?.date,
          description: event.description || '',
          location: event.location || ''
        })),
        count: data.items?.length || 0
      });
    }

    // POST - Create event in Google Calendar
    if (req.method === 'POST') {
      const { title, start, end, description, location } = req.body;

      const event = {
        summary: title || 'New Event',
        start: { dateTime: new Date(start).toISOString() },
        end: { dateTime: new Date(end).toISOString() },
        description: description || '',
        location: location || ''
      };

      const url = `${baseUrl}/events`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${client.credentials.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(event)
      });

      const data = await response.json();
      
      if (!response.ok) {
        return res.status(response.status).json({ 
          error: 'Failed to create event', 
          details: data 
        });
      }

      return res.status(200).json({
        success: true,
        eventId: data.id,
        message: 'Event created in Google Calendar ✓'
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Google Calendar API error:', error);
    return res.status(500).json({ 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
