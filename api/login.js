// Basic /api/login for FPCC token bootstrap
// POST { password: '...' } -> { success, token, expiresIn, note }
// Matches against FPCC_ADMIN_PASSWORD env (server-only secret).
// Issues short-lived JWT for use in Authorization: Bearer <token> on write routes.
// For small internal team use: set strong secret in Vercel/Render env, enter it via UI prompt on admin login.

import { signToken } from '../lib/auth.js';

export default async function handler(req, res) {
  // CORS for browser calls
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { password, pin } = req.body || {};
    const provided = password || pin; // accept either for flexibility with existing PIN UX

    if (!provided) {
      return res.status(400).json({ error: 'password (or pin) is required' });
    }

    const adminPass = process.env.FPCC_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD || 'change-this-strong-secret-now';
    const adminPinFallback = '0000'; // for dev compat with client PINs; prefer env

    const isValid = (provided === adminPass) || (provided === adminPinFallback && !process.env.FPCC_ADMIN_PASSWORD);

    if (!isValid) {
      // Small delay to slow brute force
      await new Promise(r => setTimeout(r, 300));
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = signToken({ 
      role: 'admin', 
      sub: 'ops', 
      iat: Math.floor(Date.now() / 1000) 
    });

    return res.json({ 
      success: true, 
      token, 
      expiresIn: '8h',
      note: 'Use token in Authorization: Bearer <token> header for /api/staff, /api/events writes, /api/dispatch-staff etc. Set FPCC_ADMIN_PASSWORD in env for production.'
    });
  } catch (error) {
    console.error('[Login API] Error:', error);
    return res.status(500).json({ error: 'Login failed' });
  }
}
