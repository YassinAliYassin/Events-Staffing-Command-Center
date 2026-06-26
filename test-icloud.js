// Test parseICS function from api/calendar.js
const fs = require('fs');

function parseICS(icsText) {
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

// Fetch iCloud ICS
fetch('https://p56-caldav.icloud.com/published/2/MjA3NTMxODM0NzYyMDc1M_MJWBML9PYYcak11gdiRE00jIWbogtgWyD9NtdzTpGoU6oXGhtZYzSDjGnia66w7NxkexZbSwm_tUVl14qv7-g')
  .then(res => res.text())
  .then(icsText => {
    console.log('ICS length:', icsText.length);
    const events = parseICS(icsText);
    console.log('Parsed events count:', events.length);
    console.log('First event:', events[0]);
  })
  .catch(err => console.error('Error:', err.message));
