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
    console.log('[Apple Calendar] Starting connection test...');
    console.log('[Apple Calendar] ICLOUD_EMAIL set:', !!process.env.ICLOUD_EMAIL);
    console.log('[Apple Calendar] ICLOUD_APP_PASSWORD set:', !!process.env.ICLOUD_APP_PASSWORD);
    
    const result = await testConnection();
    console.log('[Apple Calendar] Success:', result.connected);
    return res.status(200).json(result);
  } catch (error) {
    // Mask any accidental secret exposure in errors
    const safeError = (error.message || 'Unknown error')
      .replace(/ICLOUD_APP_PASSWORD/gi, '****')
      .replace(process.env.ICLOUD_APP_PASSWORD || 'dummy', '****');
    
    console.error('[Apple Calendar] Error:', safeError);
    console.error('[Apple Calendar] Stack:', error.stack);
    
    // Return detailed error for debugging (temporary)
    return res.status(500).json({
      connected: false,
      error: safeError,
      stack: error.stack,
      hint: 'This detailed error is temporary for debugging Vercel deployment'
    });
  }
}