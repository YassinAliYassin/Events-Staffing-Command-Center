import { Pool } from 'pg';
import { format } from 'date-fns';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

export default async function handler(req, res) {
  const { rows } = await pool.query('SELECT * FROM events ORDER BY date ASC');
  
  let ics = 'BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Fresh People//Command Center//EN\r\nCALSCALE:GREGORIAN\r\nMETHOD:PUBLISH\r\n';
  
  for (const event of rows) {
    const startDate = new Date(event.date);
    const endDate = new Date(startDate.getTime() + (event.duration || 4) * 60 * 60 * 1000);
    const uid = `${event.id}@fresh-people.co.za`;
    const dtstamp = format(new Date(), "yyyyMMdd'T'HHmmss'Z'");
    const dtstart = format(startDate, "yyyyMMdd'T'HHmmss");
    const dtend = format(endDate, "yyyyMMdd'T'HHmmss");
    
    ics += `BEGIN:VEVENT\r\nUID:${uid}\r\nDTSTAMP:${dtstamp}\r\nDTSTART:${dtstart}\r\nDTEND:${dtend}\r\nSUMMARY:${event.title}\r\nDESCRIPTION:Dress: ${event.dresscode || 'Formal All Black'}\\nArrival: ${event.arrivaltime || '1hr before'}\\nStaff: ${event.staff_assigned || 'TBD'}\r\nLOCATION:Fresh People Event\r\nEND:VEVENT\r\n`;
  }
  
  ics += 'END:VCALENDAR';
  
  res.setHeader('Content-Type', 'text/calendar');
  res.setHeader('Content-Disposition', 'attachment; filename="fresh-people-events.ics"');
  res.send(ics);
}
