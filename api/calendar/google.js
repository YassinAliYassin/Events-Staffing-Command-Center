// Google Calendar API endpoint (Vercel serverless function)
// Fetches events from Google Calendar using iCal URL (read-only)
// For writing: uses Nylas to push to Apple Calendar (which syncs to Google)

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // GET - Fetch events from Google Calendar via iCal URL
    if (req.method === 'GET') {
      // Your Google Calendar iCal URL
      const icalUrl = 'https://calendar.google.com/calendar/ical/gq7gjllsghrfgr8ijgqvrbdijbu1i2ka%40import.calendar.google.com/public/basic.ics';
      
      const response = await fetch(icalUrl);
      if (!response.ok) {
        return res.status(response.status).json({ 
          error: 'Failed to fetch iCal data',
          status: response.status 
        });
      }
      
      const icalData = await response.text();
      
      // Parse iCal format (simplified parser)
      const events = parseICal(icalData);
      
      return res.status(200).json({
        success: true,
        events: events,
        count: events.length
      });
    }

    // POST - Push to Apple Calendar via Nylas (which syncs to Google)
    if (req.method === 'POST') {
      const apiKey = process.env.NYLAS_API_KEY;
      const grantId = process.env.NYLAS_GRANT_ID;
      
      if (!apiKey || !grantId) {
        return res.status(500).json({ 
          error: 'Missing Nylas credentials',
          hasCredentials: false 
        });
      }

      const { title, start, end, description, location } = req.body;

      const eventData = {
        title: title || 'New Event',
        when: {
          start_time: Math.floor(new Date(start).getTime() / 1000),
          end_time: Math.floor(new Date(end).getTime() / 1000)
        },
        description: description || '',
        location: location || ''
      };

      const response = await fetch(
        `https://api.us.nylas.com/v3/grants/${grantId}/events`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(eventData)
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        return res.status(response.status).json({ 
          error: 'Failed to create event in Nylas',
          details: errorText 
        });
      }

      const data = await response.json();
      
      return res.status(200).json({
        success: true,
        eventId: data.data?.id,
        message: 'Event added to Apple Calendar (syncs to Google via iCal)'
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ error: error.message });
  }
}

// Simple iCal parser
function parseICal(icalData) {
  const events = [];
  const lines = icalData.split('\n');
  let currentEvent = null;
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    if (trimmed === 'BEGIN:VEVENT') {
      currentEvent = {};
    } else if (trimmed === 'END:VEVENT') {
      if (currentEvent && currentEvent.uid) {
        events.push({
          id: currentEvent.uid,
          title: currentEvent.summary || 'Untitled Event',
          start: currentEvent.dtstart || new Date().toISOString(),
          end: currentEvent.dtend || new Date().toISOString(),
          description: currentEvent.description || '',
          location: currentEvent.location || ''
        });
      }
      currentEvent = null;
    } else if (currentEvent) {
      const [key, ...valueParts] = trimmed.split(':');
      const value = valueParts.join(':');
      
      switch (key) {
        case 'UID':
          currentEvent.uid = value;
          break;
        case 'SUMMARY':
          currentEvent.summary = value;
          break;
        case 'DTSTART':
          currentEvent.dtstart = parseICalDate(value);
          break;
        case 'DTEND':
          currentEvent.dtend = parseICalDate(value);
          break;
        case 'DESCRIPTION':
          currentEvent.description = value;
          break;
        case 'LOCATION':
          currentEvent.location = value;
          break;
      }
    }
  }
  
  return events;
}

function parseICalDate(dateStr) {
  // Simple iCal date parser (handles YYYYMMDDTHHMMSSZ format)
  if (!dateStr) return new Date().toISOString();
  
  // Remove any parameters like ;TZID=...
  dateStr = dateStr.split(';')[0];
  
  if (dateStr.includes('T')) {
    // DateTime format
    const year = dateStr.substring(0, 4);
    const month = dateStr.substring(4, 6);
    const day = dateStr.substring(6, 8);
    const hour = dateStr.substring(9, 11);
    const minute = dateStr.substring(11, 13);
    const second = dateStr.substring(13, 15);
    return `${year}-${month}-${day}T${hour}:${minute}:${second}Z`;
  } else {
    // Date only format
    const year = dateStr.substring(0, 4);
    const month = dateStr.substring(4, 6);
    const day = dateStr.substring(6, 8);
    return `${year}-${month}-${day}`;
  }
}
