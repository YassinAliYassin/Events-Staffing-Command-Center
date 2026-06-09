// Simple JWT-based auth helper for FPCC internal APIs
// Used for protecting write-sensitive routes (staff, events, dispatch).
// Practical for small internal ops team: bootstrap via /api/login with admin password from env.

import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.FPCC_JWT_SECRET || process.env.JWT_SECRET || 'fpcc-dev-secret-change-in-prod';
const TOKEN_EXPIRY = '8h';

export function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
}

export function verifyToken(token) {
  if (!token) return null;
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (e) {
    return null;
  }
}

export function requireAuth(req, res, nextOrReturn) {
  // Works for both express (with next) and vercel handlers (returns user or sends error)
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : (req.headers['x-admin-token'] || req.query?.token);
  
  const user = verifyToken(token);
  
  if (!user) {
    const errRes = { error: 'Unauthorized - valid admin token required. Obtain via POST /api/login' };
    if (typeof nextOrReturn === 'function') {
      // express style? but for vercel mostly return
      res.status(401).json(errRes);
      return null;
    }
    res.status(401).json(errRes);
    return null;
  }
  
  req.user = user; // attach for handlers
  if (typeof nextOrReturn === 'function') nextOrReturn();
  return user;
}

// For inline use in vercel serverless handlers (no next)
export function checkAuth(req, res) {
  return requireAuth(req, res, null);
}

export const ADMIN_ROLE = 'admin';
