// Calendar API v1.1 - Fixed folded line parsing + debug logs
export default async function handler(req, res) {
  
  try {
    // Dynamic import for pg (serverless-compatible)
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
    
    // Fetch local events from database
    let eventsResult = { rows: [] };
    try {
      eventsResult = await pool.query('SELECT * FROM events ORDER BY date ASC');
    } catch (e) {
      console.log('[Calendar] DB query failed:', e.message);
    }
    
    // Fetch from iCloud calendar
    let iCloudEvents = [];
    const iCloudUrl = process.env.ICLOUD_CALENDAR_URL;
    
    if (iCloudUrl) {
      try {
        console.log('[Calendar] Fetching iCloud URL:', iCloudUrl.substring(0, 50) + '...');
        const response = await fetch(iCloudUrl, { 
          headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        console.log('[Calendar] iCloud fetch status:', response.status);
        if (response.ok) {
          const icsText = await response.text();
          console.log('[Calendar] iCloud ICS length:', icsText.length);
          iCloudEvents = parseICS(icsText);
          console.log('[Calendar] Parsed iCloud events count:', iCloudEvents.length);
        } else {
          console.log('[Calendar] iCloud fetch failed:', response.status, response.statusText);
        }
      } catch (e) {
        console.log('[Calendar] iCloud fetch error:', e.message, e.stack);
      }
    } else {
      console.log('[Calendar] No ICLOUD_CALENDAR_URL set');
    }
    
    await pool.end();
    
    // If JSON format requested (for frontend calendar UI)
    const format = req.query.format;
    if (format === 'json') {
      const localEvents = eventsResult.rows.map(event => ({
        id: event.id,
        title: event.title,
        start: event.date,
        end: new Date(new Date(event.date).getTime() + (event.duration || 4) * 60 * 60 * 1000).toISOString(),
        source: 'local',
        staff_assigned: event.staff_assigned || '',
        dressCode: 'Formal All Black',
        clientName: ''
      }));
      
      return res.status(200).json({
        local: localEvents,
        icloud: iCloudEvents
      });
    }
    
    // Otherwise return ICS file (original behavior)
    const ics = generateICS(eventsResult.rows, iCloudEvents);
    res.setHeader('Content-Type', 'text/calendar');
    res.setHeader('Content-Disposition', 'attachment; filename="fresh-people-events.ics"');
    return res.send(ics);
    
  } catch (error) {
    console.error('[Calendar API Error]', error);
    return res.status(500).json({ error: 'Failed to generate calendar' });
  }
}

function parseICS(icsText) {
  const events = [];
  
  // Unfold folded lines (RFC 5545): replace CRLF + space/tab with nothing
  const unfolded = icsText.replace(/\r\n[ \t]/g, '').replace(/\n[ \t]/g, '');
  const lines = unfolded.split('\n');
  
  let currentEvent = null;
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    
    if (trimmed === 'BEGIN:VEVENT') {
      currentEvent = {};
    } else if (trimmed === 'END:VEVENT') {
      if (currentEvent && currentEvent.start) {
        events.push({
          id: currentEvent.uid || `icloud-${Date.now()}`,
          title: currentEvent.summary || 'Untitled Event',
          start: currentEvent.dtstart,
          end: currentEvent.dtend || currentEvent.dtstart,
          source: 'icloud',
          staff_assigned: '',
          dressCode: 'Formal All Black',
          clientName: ''
        });
      }
      currentEvent = null;
    } else if (currentEvent) {
      if (trimmed.startsWith('UID:')) {
        currentEvent.uid = trimmed.substring(4);
      } else if (trimmed.startsWith('SUMMARY:')) {
        currentEvent.summary = trimmed.substring(8);
      } else if (trimmed.startsWith('DTSTART')) {
        const val = trimmed.split(':')[1];
        if (val) currentEvent.dtstart = formatICSDate(val);
      } else if (trimmed.startsWith('DTEND')) {
        const val = trimmed.split(':')[1];
        if (val) currentEvent.dtend = formatICSDate(val);
      }
    }
  }
  
  return events;
}

function formatICSDate(icsDate) {
  if (!icsDate) return new Date().toISOString();
  // Handle format like 20260531T180000Z
  const year = icsDate.substring(0, 4);
  const month = icsDate.substring(4, 6);
  const day = icsDate.substring(6, 8);
  const hour = icsDate.substring(9, 11);
  const minute = icsDate.substring(11, 13);
  return new Date(`${year}-${month}-${day}T${hour}:${minute}:00Z`).toISOString();
}

function generateICS(localEvents, iCloudEvents) {
  let ics = 'BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Fresh People//Command Center//EN\r\nCALSCALE:GREGORIAN\r\nMETHOD:PUBLISH\r\n';
  
  for (const event of localEvents) {
    ics += generateEventBlock(event);
  }
  
  for (const event of iCloudEvents) {
    ics += generateEventBlock(event);
  }
  
  ics += 'END:VCALENDAR';
  return ics;
}

function generateEventBlock(event) {
  const uid = `${event.id}@fresh-people.co.za`;
  const dtstamp = formatDate(new Date());
  const dtstart = event.start || new Date().toISOString();
  const dtend = event.end || new Date(new Date(dtstart).getTime() + 4 * 60 * 60 * 1000).toISOString();
  const summary = event.title || 'Untitled Event';
  const description = `Dress: ${event.dressCode || 'Formal All Black'}\\nArrival: 1hr before\\nStaff: ${event.staff_assigned || 'TBD'}`;
  
  return `BEGIN:VEVENT\r\nUID:${uid}\r\nDTSTAMP:${dtstamp}\r\nDTSTART:${formatDateForICS(dtstart)}\r\nDTEND:${formatDateForICS(dtend)}\r\nSUMMARY:${summary}\r\nDESCRIPTION:${description}\r\nLOCATION:Fresh People Event\r\nEND:VEVENT\r\n`;
}

function formatDate(date) {
  try {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  } catch (e) {
    return new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  }
}

function formatDateForICS(isoString) {
  try {
    return new Date(isoString).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  } catch (e) {
    return new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  }
}
