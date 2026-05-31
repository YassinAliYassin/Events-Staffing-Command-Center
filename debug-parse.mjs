// Detailed debug of parseICS
async function test() {
  try {
    const response = await fetch('https://p56-caldav.icloud.com/published/2/MjA3NTMxODM0NzYyMDc1M_MJWBML9PYYcak11gdiRE00jIWbogtgWyD9NtdzTpGoU6oXGhtZYzSDjGnia66w7NxkexZbSwm_tUVl14qv7-g');
    const icsText = await response.text();
    
    // Unfold
    const unfolded = icsText.replace(/\r\n[ \t]/g, '').replace(/\n[ \t]/g, '');
    const lines = unfolded.split('\n');
    
    let currentEvent = null;
    let eventCount = 0;
    const events = [];
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      
      if (trimmed === 'BEGIN:VEVENT') {
        currentEvent = {};
      } else if (trimmed === 'END:VEVENT') {
        if (currentEvent) {
          eventCount++;
          if (eventCount === 1) {
            console.log('First event object:', currentEvent);
            console.log('Has start?', !!currentEvent.dtstart);
          }
          if (currentEvent.dtstart) {
            events.push(currentEvent);
          }
          currentEvent = null;
        }
      } else if (currentEvent) {
        if (trimmed.startsWith('UID:')) {
          currentEvent.uid = trimmed.substring(4);
        } else if (trimmed.startsWith('SUMMARY:')) {
          currentEvent.summary = trimmed.substring(8);
        } else if (trimmed.startsWith('DTSTART')) {
          const val = trimmed.split(':')[1];
          currentEvent.dtstart = val;
          if (eventCount === 0) console.log('DTSTART val:', val);
        } else if (trimmed.startsWith('DTEND')) {
          const val = trimmed.split(':')[1];
          currentEvent.dtend = val;
        }
      }
    }
    
    console.log('Total VEVENTs:', eventCount);
    console.log('Events with start:', events.length);
  } catch (err) {
    console.error('Error:', err.message);
  }
}
test();
