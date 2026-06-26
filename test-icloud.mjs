// Test parseICS function from api/calendar.js (ES module)
async function parseICS(icsText) {
  const events = [];
  const lines = icsText.split('\n');
  let currentEvent = null;
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    if (trimmed === 'BEGIN:VEVENT') {
      currentEvent = {};
    } else if (trimmed === 'END:VEVENT') {
      if (currentEvent && currentEvent.start) {
        events.push({
          id: currentEvent.uid || `icloud-${Date.now()}`,
          title: currentEvent.summary || 'Untitled Event',
          start: currentEvent.dtstart,
          end: currentEvent.dtend || currentEvent.dtstart,
          source: 'icloud'
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
        currentEvent.dtstart = val;
      } else if (trimmed.startsWith('DTEND')) {
        const val = trimmed.split(':')[1];
        currentEvent.dtend = val;
      }
    }
  }
  
  return events;
}

async function test() {
  try {
    console.log('Fetching iCloud ICS...');
    const response = await fetch('https://p56-caldav.icloud.com/published/2/MjA3NTMxODM0NzYyMDc1M_MJWBML9PYYcak11gdiRE00jIWbogtgWyD9NtdzTpGoU6oXGhtZYzSDjGnia66w7NxkexZbSwm_tUVl14qv7-g');
    console.log('Fetch status:', response.status);
    if (!response.ok) throw new Error(`Fetch failed: ${response.statusText}`);
    
    const icsText = await response.text();
    console.log('ICS length:', icsText.length);
    
    const events = await parseICS(icsText);
    console.log('Parsed events count:', events.length);
    if (events.length > 0) {
      console.log('First event:', JSON.stringify(events[0], null, 2));
    }
  } catch (err) {
    console.error('Test error:', err.message, err.stack);
  }
}

test();
