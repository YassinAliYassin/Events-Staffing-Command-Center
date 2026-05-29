import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  // Accept POST requests (webhooks from external platforms)
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      platform,        // e.g., 'whatsapp', 'booking-system'
      title, 
      date, 
      duration, 
      staff_assigned, 
      dressCode, 
      arrivalTime,
      clientName,
      clientPhone,
      ...extra 
    } = req.body;

    // Validate required fields
    if (!title || !date) {
      return res.status(400).json({ error: 'Title and date are required' });
    }

    // Generate event ID with platform prefix
    const platformPrefix = platform ? platform.substring(0, 3).toUpperCase() : 'EVT';
    const eventId = `${platformPrefix}-${Date.now()}`;

    const event = {
      id: eventId,
      title,
      date,
      duration: duration || 4,
      staff_assigned: staff_assigned || [],
      dressCode: dressCode || 'All Black',
      arrivalTime: arrivalTime || '',
      clientName: clientName || '',
      clientPhone: clientPhone || '',
      platform: platform || 'unknown',
      created_at: new Date().toISOString()
    };

    // Store event
    await kv.set(`event:${eventId}`, event);

    console.log(`Event created via webhook from ${platform}:`, eventId);

    return res.status(201).json({ 
      id: eventId, 
      message: 'Event created successfully via webhook',
      event 
    });
  } catch (err) {
    console.error('Webhook error:', err);
    return res.status(500).json({ error: err.message });
  }
}
