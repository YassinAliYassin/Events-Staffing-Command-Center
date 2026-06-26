/**
 * Build script: Fetch Apple Calendar feed and save as JSON
 * Fix: Properly parse iCal date formats
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const FEED_URL = 'https://p56-caldav.icloud.com/published/2/MjA3NTMxODM0NzYyMDc1M_MJWBML9PYYcak11gdiRE00jIWbogtgWyD9NtdzTpGoU6oXGhtZYzSDjGnia66w7NxkexZbSwm_tUVl14qv7-g';
const OUTPUT_PATH = path.join(__dirname, '..', 'src', 'data', 'apple-calendar-events.json');

function fetchFeed() {
  return new Promise((resolve, reject) => {
    https.get(FEED_URL, { headers: { 'User-Agent': 'Fresh-People-Command-Center/1.0' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
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
          description: (currentEvent.description || '').replace(/\\n/g, '\n'),
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
      // Handle line continuations (lines starting with space or tab)
      if (line.startsWith(' ') || line.startsWith('\t')) {
        // Continuation of previous line - skip for simplicity
        continue;
      }
      
      const colonIndex = line.indexOf(':');
      if (colonIndex === -1) continue;
      
      const key = line.substring(0, colonIndex);
      let value = line.substring(colonIndex + 1);
      
      // Remove TZID parameter if present (e.g., "DTSTART;TZID=Africa/Johannesburg:20260525T120000")
      const cleanKey = key.split(';')[0];
      
      switch (cleanKey) {
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
  if (!dateStr) return null;
  
  try {
    // Handle TZID parameter (already stripped in parseICal)
    // Format 1: 20260525T120000Z (UTC)
    // Format 2: 2026-05-25T12:00:00Z (ISO)
    // Format 3: 20260525T120000 (local time)
    
    if (dateStr.includes('T')) {
      // ISO format or iCal with T
      const cleanStr = dateStr.replace(/Z$/, '+00:00');
      const date = new Date(cleanStr);
      if (!isNaN(date.getTime())) {
        return date.toISOString();
      }
    }
    
    // iCal format: YYYYMMDDTHHMMSS
    const match = dateStr.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z)?$/);
    if (match) {
      const [_, y, m, d, h, min, s, z] = match;
      const isoStr = z ? `${y}-${m}-${d}T${h}:${min}:${s}Z` : `${y}-${m}-${d}T${h}:${min}:${s}`;
      const date = new Date(isoStr);
      if (!isNaN(date.getTime())) {
        return date.toISOString();
      }
    }
    
    // Date only: YYYYMMDD
    const dateMatch = dateStr.match(/^(\d{4})(\d{2})(\d{2})$/);
    if (dateMatch) {
      const [_, y, m, d] = dateMatch;
      return new Date(`${y}-${m}-${d}`).toISOString();
    }
  } catch (e) {
    console.error('Date parse error:', e.message, 'for', dateStr);
  }
  
  return null;
}

async function main() {
  console.log('Fetching Apple Calendar feed...');
  const icalData = await fetchFeed();
  console.log(`Downloaded ${icalData.length} chars`);
  
  const events = parseICal(icalData);
  console.log(`Parsed ${events.length} events`);
  
  // Count events with valid dates
  const withDates = events.filter(e => e.start || e.end);
  console.log(`${withDates.length} events have dates`);
  
  // Ensure output directory exists
  const dir = path.dirname(OUTPUT_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(events, null, 2));
  console.log(`Saved to ${OUTPUT_PATH}`);
}

main().catch(console.error);