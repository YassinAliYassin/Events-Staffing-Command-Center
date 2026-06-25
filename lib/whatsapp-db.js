// lib/whatsapp-db.js — Database Service Layer
// Atomic CRUD operations on bookings, staff_confirmations, interaction_logs, interaction_triage
// All queries use parameterized SQL — zero string interpolation.

import { Pool } from 'pg';

let _pool = null;
function getPool() {
  if (!_pool) {
    _pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: 10,
    });
  }
  return _pool;
}

// ── Ensure tables exist (idempotent) ────────────────────────────
export async function ensureSchema() {
  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // bookings table
    await client.query(`
      CREATE TABLE IF NOT EXISTS bookings (
        event_id TEXT PRIMARY KEY DEFAULT 'BK-' || to_char(NOW(), 'YYYYMMDD-') || LPAD(nextval('bookings_seq')::text, 3, '0'),
        client_id TEXT,
        client_name TEXT,
        client_phone TEXT,
        venue TEXT,
        event_date DATE,
        start_time TEXT,
        headcount INTEGER DEFAULT 0,
        event_type TEXT DEFAULT 'UNKNOWN',
        status TEXT DEFAULT 'pending',
        notes TEXT,
        source TEXT DEFAULT 'whatsapp',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // Sequence for bookings (separate to avoid conflicts)
    await client.query(`CREATE SEQUENCE IF NOT EXISTS bookings_seq START 1;`);

    // staff_confirmations table
    await client.query(`
      CREATE TABLE IF NOT EXISTS staff_confirmations (
        id SERIAL PRIMARY KEY,
        event_id TEXT REFERENCES bookings(event_id) ON DELETE CASCADE,
        staff_name TEXT NOT NULL,
        staff_phone TEXT,
        status TEXT DEFAULT 'pending',
        response_message TEXT,
        responded_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // interaction_logs table
    await client.query(`
      CREATE TABLE IF NOT EXISTS interaction_logs (
        id SERIAL PRIMARY KEY,
        sender_phone TEXT NOT NULL,
        role TEXT,
        intent TEXT NOT NULL,
        extracted_data JSONB DEFAULT '{}',
        confidence NUMERIC(3,2) DEFAULT 0,
        action_taken TEXT,
        message_id TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // interaction_triage queue (for low-confidence messages)
    await client.query(`
      CREATE TABLE IF NOT EXISTS interaction_triage (
        id SERIAL PRIMARY KEY,
        sender_phone TEXT NOT NULL,
        role TEXT,
        original_message TEXT,
        parsed_data JSONB DEFAULT '{}',
        reason TEXT,
        status TEXT DEFAULT 'pending',
        assigned_to TEXT,
        resolved_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // Index for common queries
    await client.query(`CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(event_date);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_interaction_logs_phone ON interaction_logs(sender_phone);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_triage_status ON interaction_triage(status);`);

    await client.query('COMMIT');
    console.log('[DB] Schema ensured');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// ── Bookings CRUD ────────────────────────────────────────────────

export async function createBooking({ clientId, clientName, clientPhone, venue, eventDate, startTime, headcount, eventType, notes }) {
  const pool = getPool();
  const eventId = `BK-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(Math.floor(Math.random() * 999)).padStart(3, '0')}`;

  const result = await pool.query(
    `INSERT INTO bookings (event_id, client_id, client_name, client_phone, venue, event_date, start_time, headcount, event_type, notes, source)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'whatsapp')
     RETURNING *`,
    [eventId, clientId || null, clientName, clientPhone, venue, eventDate, startTime, headcount, eventType, notes]
  );

  return result.rows[0];
}

export async function getBooking(eventId) {
  const pool = getPool();
  const result = await pool.query(`SELECT * FROM bookings WHERE event_id = $1`, [eventId]);
  return result.rows[0] || null;
}

export async function listBookings({ status, limit = 20 } = {}) {
  const pool = getPool();
  let query = `SELECT * FROM bookings`;
  const params = [];

  if (status) {
    params.push(status);
    query += ` WHERE status = $${params.length}`;
  }

  query += ` ORDER BY event_date ASC`;
  params.push(limit);
  query += ` LIMIT $${params.length}`;

  const result = await pool.query(query, params);
  return result.rows;
}

export async function updateBooking(eventId, updates) {
  const pool = getPool();
  const allowed = ['venue', 'event_date', 'start_time', 'headcount', 'status', 'notes', 'event_type'];
  const setClauses = [];
  const params = [];

  for (const [key, value] of Object.entries(updates)) {
    if (allowed.includes(key) && value !== undefined) {
      params.push(value);
      setClauses.push(`${key} = $${params.length}`);
    }
  }

  if (setClauses.length === 0) return null;

  params.push(eventId);
  const result = await pool.query(
    `UPDATE bookings SET ${setClauses.join(', ')}, updated_at = NOW() WHERE event_id = $${params.length} RETURNING *`,
    params
  );

  return result.rows[0];
}

// ── Staff Confirmations ──────────────────────────────────────────

export async function upsertStaffConfirmation({ eventId, staffName, staffPhone, status, responseMessage }) {
  const pool = getPool();

  // Check if already exists
  const existing = await pool.query(
    `SELECT id FROM staff_confirmations WHERE event_id = $1 AND staff_phone = $2`,
    [eventId, staffPhone]
  );

  if (existing.rows.length > 0) {
    const result = await pool.query(
      `UPDATE staff_confirmations
       SET status = $1, response_message = $2, responded_at = NOW()
       WHERE event_id = $3 AND staff_phone = $4
       RETURNING *`,
      [status, responseMessage, eventId, staffPhone]
    );
    return result.rows[0];
  }

  const result = await pool.query(
    `INSERT INTO staff_confirmations (event_id, staff_name, staff_phone, status, response_message, responded_at)
     VALUES ($1, $2, $3, $4, $5, NOW())
     RETURNING *`,
    [eventId, staffName, staffPhone, status, responseMessage]
  );

  return result.rows[0];
}

export async function getStaffConfirmations(eventId) {
  const pool = getPool();
  const result = await pool.query(
    `SELECT * FROM staff_confirmations WHERE event_id = $1 ORDER BY created_at ASC`,
    [eventId]
  );
  return result.rows;
}

// ── Interaction Logs ─────────────────────────────────────────────

export async function logInteraction({ senderPhone, role, intent, extractedData, confidence, action, messageId }) {
  const pool = getPool();
  try {
    await pool.query(
      `INSERT INTO interaction_logs (sender_phone, role, intent, extracted_data, confidence, action_taken, message_id, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
      [senderPhone, role, intent, JSON.stringify(extractedData), confidence, action, messageId]
    );
  } catch (err) {
    console.error('[DB] Failed to log interaction:', err.message);
  }
}

// ── Triage Queue ─────────────────────────────────────────────────

export async function queueTriage({ senderPhone, role, originalMessage, parsedData, reason }) {
  const pool = getPool();
  try {
    const result = await pool.query(
      `INSERT INTO interaction_triage (sender_phone, role, original_message, parsed_data, reason, status, created_at)
       VALUES ($1, $2, $3, $4, $5, 'pending', NOW())
       RETURNING id`,
      [senderPhone, role, originalMessage, JSON.stringify(parsedData), reason]
    );
    return result.rows[0].id;
  } catch (err) {
    console.error('[DB] Failed to queue triage:', err.message);
    return null;
  }
}

export async function getPendingTriage(limit = 10) {
  const pool = getPool();
  const result = await pool.query(
    `SELECT * FROM interaction_triage WHERE status = 'pending' ORDER BY created_at ASC LIMIT $1`,
    [limit]
  );
  return result.rows;
}

export async function resolveTriage(triageId, assignedTo) {
  const pool = getPool();
  await pool.query(
    `UPDATE interaction_triage SET status = 'resolved', assigned_to = $1, resolved_at = NOW() WHERE id = $2`,
    [assignedTo, triageId]
  );
}

// ── Utility ──────────────────────────────────────────────────────

export async function getBookingCount() {
  const pool = getPool();
  const result = await pool.query(`SELECT COUNT(*) as count FROM bookings`);
  return parseInt(result.rows[0].count);
}

export async function closePool() {
  if (_pool) {
    await _pool.end();
    _pool = null;
  }
}
