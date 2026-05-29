import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  const { id } = req.query;
  
  if (!id) {
    return res.status(400).json({ error: 'Event ID is required' });
  }
  
  try {
    if (req.method === 'PATCH' || req.method === 'PUT') {
      // Get existing event
      const existing = await kv.get(`event:${id}`);
      
      if (!existing) {
        return res.status(404).json({ error: 'Event not found' });
      }
      
      // Merge updates
      const updated = { ...existing, ...req.body };
      await kv.set(`event:${id}`, updated);
      
      return res.json({ message: 'Event updated successfully' });
    } 
    
    if (req.method === 'DELETE') {
      await kv.del(`event:${id}`);
      return res.json({ message: 'Event deleted successfully' });
    }
    
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('API error:', err);
    return res.status(500).json({ error: err.message });
  }
}
