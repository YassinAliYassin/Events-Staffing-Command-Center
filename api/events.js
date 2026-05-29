import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      // Get all event keys
      const keys = await kv.keys('event:*');
      
      if (keys.length === 0) {
        return res.json({ events: [] });
      }
      
      // Fetch all events
      const events = await kv.mget(keys);
      
      // Filter out null values and sort by date descending
      const validEvents = events.filter(e => e !== null).sort((a, b) => 
        new Date(b.date) - new Date(a.date)
      );
      
      return res.json({ events: validEvents });
    } 
    
    if (req.method === 'POST') {
      const { id, title, date, duration, staff_assigned, dressCode, arrivalTime } = req.body;
      
      if (!title || !date) {
        return res.status(400).json({ error: 'Title and date are required' });
      }
      
      const eventId = id || `FP-${Date.now()}`;
      const event = {
        id: eventId,
        title,
        date,
        duration: duration || 4,
        staff_assigned: staff_assigned || [],
        dressCode: dressCode || 'All Black',
        arrivalTime: arrivalTime || '',
        created_at: new Date().toISOString()
      };
      
      // Store event
      await kv.set(`event:${eventId}`, event);
      
      return res.json({ id: eventId, message: 'Event created successfully' });
    }
    
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('API error:', err);
    return res.status(500).json({ error: err.message });
  }
}
