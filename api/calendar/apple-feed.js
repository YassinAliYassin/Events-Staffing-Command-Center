/**
 * Apple Calendar API - parses published iCloud feed
 * Uses your existing feed URL (no Nylas, no local servers)
 */

export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      connected: false, 
      error: 'Method not allowed. Use GET.' 
    });
  }

  try {
    const feedUrl = req.query.feed || process.env.APPLE_FEED_URL || 
      'https://p56-caldav.icloud.com/published/2/MjA3NTMxODM0NzYyMDc1M_MJWBML9PYYcak11gdiRE00jIWbogtgWyD9NtdzTpGoU6oXGhtZYzSDjGnia66w7NxkexZbSwm_tUVl14qv7-g';
    
    // Fetch the iCal feed
    const response = await fetch(feedUrl, {
      headers: {
        'User-Agent': 'Fresh-People-Command-Center/1.0'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch feed: ${response.status}`);
    }

    const icalData = await response.text();
    
    // Parse iCal format
    const events = parseICal(icalData);
    
    return res.status(200).json({
      connected: true,
      user: 'realyassinali@gmail.com',
      calendars: [{ id: 'icloud-feed', name: 'iCloud Calendar' }],
      events: events,
      count: events.length,
      source: 'icloud-feed'
    });

  } catch (error) {
    console.error('[Apple Calendar Feed] Error:', error.message);
    return res.status(200).json({
      connected: false,
      error: `Feed error: ${error.message}`,
      events: [],
      count: 0
    });
  }
}

function parseICal(icalData) {
  const events = [];
  const lines = icalData.split('\n');
  let currentEvent = null;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (line === 'BEGIN:VEVENT') {
      currentEvent = {};
    } else if (line === 'END:VEVENT') {
      if (currentEvent && currentEvent.summary) {
        events.push({
          id: currentEvent.uid || `apple-${events.length}`,
          title: currentEvent.summary,
          start: currentEvent.dtstart || null,
          end: currentEvent.dtend || null,
          description: currentEvent.description || '',
          location: currentEvent.location || '',
          calendar: 'iCloud Calendar',
          calendarId: 'icloud-feed',
          source: 'apple',
          sourceType: 'icloud-feed',
          color: '#34C759'
        });
      }
      currentEvent = null;
    } else if (currentEvent) {
      const [key, ...valueParts] = line.split(':');
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
          currentEvent.description = value.replace(/\\n/g, '\n');
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
  if (!dateStr) return null;
  
  // Remove TZID prefix if present
  dateStr = dateStr.replace(/^.*:/, '');
  
  // Format: 20260525T120000Z or 2026-05-25T12:00:00Z
  try {
    // Try ISO format
    if (dateStr.includes('T')) {
      return new Date(dateStr).toISOString();
    }
    // Try YYYYMMDDTHHMMSSZ format
    const match = dateStr.match(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z?/);
    if (match) {
      const [_, y, m, d, h, min, s] = match;
      return new Date(`${y}-${m}-${d}T${h}:${min}:${s}Z`).toISOString();
    }
  } catch (e) {
    console.error('Date parse error:', e.message);
  }
  
  return dateStr;
}