// Google Calendar API endpoint (Vercel serverless function)
// Uses REST API directly (no googleapis package needed)
// Requires: GOOGLE_SERVICE_ACCOUNT_BASE64 environment variable

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Parse service account from base64 env var
    if (!process.env.GOOGLE_SERVICE_ACCOUNT_BASE64) {
      return res.status(500).json({ error: 'Missing GOOGLE_SERVICE_ACCOUNT_BASE64' });
    }

    const serviceAccount = JSON.parse(
      Buffer.from(process.env.GOOGLE_SERVICE_ACCOUNT_BASE64, 'base64').toString()
    );

    // Get access token using service account
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: await createJWT(serviceAccount)
      })
    });

    const tokenData = await tokenResponse.json();
    if (!tokenData.access_token) {
      return res.status(500).json({ error: 'Failed to get access token', details: tokenData });
    }

    const accessToken = tokenData.access_token;
    const calendarId = 'primary'; // Use your calendar ID here

    // GET - Fetch events from Google Calendar
    if (req.method === 'GET') {
      const timeMin = new Date().toISOString();
      const timeMax = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      
      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events?timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime`,
        {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        }
      );

      const data = await response.json();
      
      if (!response.ok) {
        return res.status(response.status).json({ error: 'Google API error', details: data });
      }

      return res.status(200).json({
        success: true,
        events: (data.items || []).map(event => ({
          id: event.id,
          title: event.summary || 'Untitled Event',
          start: event.start?.dateTime || event.start?.date || new Date().toISOString(),
          end: event.end?.dateTime || event.end?.date || new Date().toISOString(),
          description: event.description || '',
          location: event.location || ''
        })),
        count: data.items?.length || 0
      });
    }

    // POST - Add event to Google Calendar
    if (req.method === 'POST') {
      const { title, start, end, description, location } = req.body;

      const eventData = {
        summary: title || 'New Event',
        start: { dateTime: new Date(start).toISOString() },
        end: { dateTime: new Date(end).toISOString() },
        description: description || '',
        location: location || ''
      };

      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(eventData)
        }
      );

      const data = await response.json();
      
      if (!response.ok) {
        return res.status(response.status).json({ error: 'Failed to create event', details: data });
      }

      return res.status(200).json({
        success: true,
        eventId: data.id,
        message: 'Event added to Google Calendar'
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Google Calendar API error:', error);
    return res.status(500).json({ error: error.message });
  }
}

// Helper: Create JWT for Google Service Account authentication
async function createJWT(serviceAccount) {
  const header = { alg: 'RS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  
  const claim = {
    iss: serviceAccount.client_email,
    sub: serviceAccount.client_email,
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
    scope: 'https://www.googleapis.com/auth/calendar'
  };

  const encodedHeader = base64urlEncode(JSON.stringify(header));
  const encodedClaim = base64urlEncode(JSON.stringify(claim));
  const signatureInput = `${encodedHeader}.${encodedClaim}`;

  // Import private key and sign
  const privateKey = await crypto.subtle.importKey(
    'pkcs8',
    pemToArrayBuffer(serviceAccount.private_key),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    privateKey,
    new TextEncoder().encode(signatureInput)
  );

  const encodedSignature = base64urlEncode(new Uint8Array(signature));
  return `${signatureInput}.${encodedSignature}`;
}

function base64urlEncode(data) {
  if (typeof data === 'string') {
    data = new TextEncoder().encode(data);
  }
  return Buffer.from(data).toString('base64url');
}

function pemToArrayBuffer(pem) {
  const b64 = pem.replace(/-----BEGIN[^-]+-----|-----END[^-]+-----|\n/g, '');
  return Buffer.from(b64, 'base64');
}
