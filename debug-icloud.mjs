// Debug unfolded lines
async function test() {
  try {
    const response = await fetch('https://p56-caldav.icloud.com/published/2/MjA3NTMxODM0NzYyMDc1M_MJWBML9PYYcak11gdiRE00jIWbogtgWyD9NtdzTpGoU6oXGhtZYzSDjGnia66w7NxkexZbSwm_tUVl14qv7-g');
    const icsText = await response.text();
    
    // Unfold
    const unfolded = icsText.replace(/\r\n[ \t]/g, '').replace(/\n[ \t]/g, '');
    const lines = unfolded.split('\n');
    
    console.log('Total unfolded lines:', lines.length);
    console.log('First 20 unfolded lines:');
    lines.slice(0,20).forEach((line, i) => console.log(`${i}: ${line.trim()}`));
    
    // Check for VEVENT lines
    const veventStart = lines.filter(l => l.trim() === 'BEGIN:VEVENT').length;
    const veventEnd = lines.filter(l => l.trim() === 'END:VEVENT').length;
    console.log('BEGIN:VEVENT count:', veventStart);
    console.log('END:VEVENT count:', veventEnd);
  } catch (err) {
    console.error('Error:', err.message);
  }
}
test();
