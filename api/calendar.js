import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    // Get all event keys
    const keys = await kv.keys('event:*');
    
    if (keys.length === 0) {
      return res.json({ events: [] });
    }
    
    // Fetch all events
    const events = await kv.mget(keys);
    const validEvents = events.filter(e => e !== null);
    
    // Generate iCalendar format
    let ics = 'BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Fresh People//Events//EN\r\n';
    
    validEvents.forEach(event => {
      const startDate = new Date(event.date);
      const endDate = new Date(startDate.getTime() + (event.duration || 4) * 60 * 60 * 1000);
      
      const formatDate = (d) => {
        return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      };
      
      ics += 'BEGIN:VEVENT\r\n';
      ics += `UID:${event.id}@fresh-people.co.za\r\n`;
      ics += `DTSTART:${formatDate(startDate)}\r\n`;
      ics += `DTEND:${formatDate(endDate)}\r\n`;
      ics += `SUMMARY:${event.title || 'Event'}\r\n`;
      ics += `DESCRIPTION:Dress Code: ${event.dressCode || 'All Black'}\\nStaff: ${(event.staff_assigned || []).join(', ')}\r\n`;
      ics += 'END:VEVENT\r\n';
    });
    
    ics += 'END:VCALENDAR\r\n';
    
    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="FreshPeople-Events.ics"');
    res.send(ics);
  } catch (err) {
    console.error('Calendar API error:', err);
    return res.status(500).json({ error: err.message });
  }
}
