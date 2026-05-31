import { testConnection } from '../../lib/calendar/apple/index.js';

export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      connected: false, 
      error: 'Method not allowed. Use GET.' 
    });
  }

  try {
    // Call the Apple Calendar API server running on VPS
    const apiUrl = process.env.APPLE_CALENDAR_API_URL || 'http://solidai.solidsolutions.africa/apple-calendar/api/calendar/apple/test';
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      // 30 second timeout
      signal: AbortSignal.timeout(30000)
    });
    
    if (!response.ok) {
      throw new Error(`API server returned ${response.status}`);
    }
    
    const result = await response.json();
    return res.status(200).json(result);
  } catch (error) {
    console.error('[Apple Calendar] Proxy error:', error.message);
    
    // Fallback: try local connection if env vars are set
    if (process.env.ICLOUD_EMAIL && process.env.ICLOUD_APP_PASSWORD) {
      console.log('[Apple Calendar] Falling back to direct connection...');
      try {
        const result = await testConnection();
        return res.status(200).json(result);
      } catch (fallbackError) {
        console.error('[Apple Calendar] Fallback also failed:', fallbackError.message);
      }
    }
    
    return res.status(200).json({
      connected: false,
      error: 'Apple Calendar API server unreachable: ' + error.message,
      calendars: []
    });
  }
}