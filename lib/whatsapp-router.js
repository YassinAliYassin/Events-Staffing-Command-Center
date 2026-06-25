// lib/whatsapp-router.js — Deterministic Routing Engine
// Cross-references sender phone against Staff + Client records
// to establish session context before invoking LLM parsing.

import { Pool } from 'pg';

let _pool = null;
function getPool() {
  if (!_pool) {
    _pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: 5,
    });
  }
  return _pool;
}

/**
 * Normalize phone number to E.164 without '+' prefix
 * "27 67 296 1272" → "27672961272"
 * "+27672961272" → "27672961272"
 * "whatsapp:+27672961272" → "27672961272"
 */
function normalizePhone(phone) {
  if (!phone) return '';
  return String(phone)
    .replace(/^whatsapp:/, '')
    .replace(/^\+/, '')
    .replace(/[\s\-()]/g, '');
}

/**
 * Route an inbound message to a session context.
 * Returns one of:
 *   { role: 'staff',   staff: { id, name, phone, ... } }
 *   { role: 'client',  client: { id, name, phone, ... } }
 *   { role: 'unknown', sender_phone: string }
 *
 * Also includes recent interaction history for context.
 */
export async function routeMessage(senderPhone, profileName = null) {
  const phone = normalizePhone(senderPhone);
  if (!phone) {
    return { role: 'unknown', sender_phone: '', reason: 'no_phone' };
  }

  const pool = getPool();

  // ── 1. Check Staff table ──────────────────────────────────────
  const staffRes = await pool.query(
    `SELECT id, name, phone, role, status, created_at
     FROM staff
     WHERE phone = $1 OR phone = $2
     LIMIT 1`,
    [phone, `+${phone}`]
  );

  if (staffRes.rows.length > 0) {
    const staff = staffRes.rows[0];
    // Get recent interaction logs for this staff
    const recentLogs = await pool.query(
      `SELECT intent, created_at, extracted_data
       FROM interaction_logs
       WHERE sender_phone = $1
       ORDER BY created_at DESC
       LIMIT 5`,
      [phone]
    );

    return {
      role: 'staff',
      staff: {
        id: staff.id,
        name: staff.name,
        phone: staff.phone || phone,
        role: staff.role,
        status: staff.status,
      },
      recent_context: recentLogs.rows,
    };
  }

  // ── 2. Check Clients table ────────────────────────────────────
  const clientRes = await pool.query(
    `SELECT id, name, phone, email, company, created_at
     FROM clients
     WHERE phone = $1 OR phone = $2
     LIMIT 1`,
    [phone, `+${phone}`]
  );

  if (clientRes.rows.length > 0) {
    const client = clientRes.rows[0];
    // Get recent bookings for context
    const recentBookings = await pool.query(
      `SELECT event_id, event_date, status, headcount
       FROM bookings
       WHERE client_id = $1
       ORDER BY event_date DESC
       LIMIT 3`,
      [client.id]
    );

    return {
      role: 'client',
      client: {
        id: client.id,
        name: client.name,
        phone: client.phone || phone,
        email: client.email,
        company: client.company,
      },
      recent_context: recentBookings.rows,
    };
  }

  // ── 3. Unknown sender ─────────────────────────────────────────
  // Check if there's a prior interaction log with this phone
  const unknownLogs = await pool.query(
    `SELECT intent, extracted_data, created_at
     FROM interaction_logs
     WHERE sender_phone = $1
     ORDER BY created_at DESC
     LIMIT 3`,
    [phone]
  );

  return {
    role: 'unknown',
    sender_phone: phone,
    profile_name: profileName,
    recent_context: unknownLogs.rows,
  };
}

/**
 * Close pool (for testing / graceful shutdown)
 */
export async function closePool() {
  if (_pool) {
    await _pool.end();
    _pool = null;
  }
}
