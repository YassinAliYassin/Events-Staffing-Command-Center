// lib/whatsapp-intent.js — Intent Parser + Fail-Safe State Machine
// Routes parsed intents to DB execution or human triage based on confidence.
// Confidence < 0.85 → human triage queue (never writes to production DB).

import { Pool } from 'pg';
import { buildSystemPrompt } from './whatsapp-schemas.js';

const CONFIDENCE_THRESHOLD = 0.85;

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
 * Resolve relative dates to ISO 8601
 * "tomorrow" → 2026-06-24, "today" → 2026-06-23, "next friday" → 2026-06-26
 */
function resolveRelativeDate(text) {
  const lower = text.toLowerCase().trim();
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (/\btoday\b/.test(lower)) {
    return formatDate(today);
  }
  if (/\btomorrow\b/.test(lower)) {
    const t = new Date(today);
    t.setDate(t.getDate() + 1);
    return formatDate(t);
  }
  if (/\btonight\b/.test(lower)) {
    return formatDate(today);
  }
  if (/\bnext\s+monday\b/.test(lower)) {
    return formatDate(nextWeekday(today, 1));
  }
  if (/\bnext\s+tuesday\b/.test(lower)) {
    return formatDate(nextWeekday(today, 2));
  }
  if (/\bnext\s+wednesday\b/.test(lower)) {
    return formatDate(nextWeekday(today, 3));
  }
  if (/\bnext\s+thursday\b/.test(lower)) {
    return formatDate(nextWeekday(today, 4));
  }
  if (/\bnext\s+friday\b/.test(lower)) {
    return formatDate(nextWeekday(today, 5));
  }
  if (/\bnext\s+saturday\b/.test(lower)) {
    return formatDate(nextWeekday(today, 6));
  }
  if (/\bnext\s+sunday\b/.test(lower)) {
    return formatDate(nextWeekday(today, 0));
  }

  // Try to find a date pattern like "15 June" or "June 15"
  const monthPattern = /(\d{1,2})\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i;
  const match = lower.match(monthPattern);
  if (match) {
    const day = parseInt(match[1]);
    const monthStr = match[2].toLowerCase();
    const months = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 };
    const month = months[monthStr];
    if (month !== undefined) {
      const d = new Date(now.getFullYear(), month, day);
      if (d < today) d.setFullYear(d.getFullYear() + 1); // next year if past
      return formatDate(d);
    }
  }

  return null;
}

function formatDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function nextWeekday(from, targetDay) {
  const d = new Date(from);
  const currentDay = d.getDay();
  let diff = targetDay - currentDay;
  if (diff <= 0) diff += 7;
  d.setDate(d.getDate() + diff);
  return d;
}

/**
 * Extract time from text → HH:MM format
 */
function extractTime(text) {
  const patterns = [
    /(\d{1,2}):(\d{2})\s*(am|pm)?/i,
    /(\d{1,2})\s*(am|pm)/i,
    /at\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      let hours = parseInt(match[1]);
      const minutes = match[2] ? parseInt(match[2]) : 0;
      const meridiem = match[3] ? match[3].toLowerCase() : null;

      if (meridiem === 'pm' && hours < 12) hours += 12;
      if (meridiem === 'am' && hours === 12) hours = 0;

      if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
      }
    }
  }
  return null;
}

/**
 * Extract headcount from text
 */
function extractHeadcount(text) {
  const patterns = [
    /(\d+)\s*(staff|waiters|servers|people|workers|team|crew)/i,
    /need\s+(\d+)/i,
    /(\d+)\s*(?:for|at|on)/i,
    /headcount[:\s]+(\d+)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const n = parseInt(match[1]);
      if (n > 0 && n <= 1000) return n;
    }
  }
  return null;
}

/**
 * Extract venue from text (after "at", "location")
 * Stops at common delimiters to avoid grabbing date/time
 */
function extractVenue(text) {
  const patterns = [
    /(?:at|location|venue|place)[:\s]+([^,.\n]+?)(?=\s+(?:on|at|from|tomorrow|today|next|for|\d{1,2}(?::\d{2})|\d+\s*(?:staff|waiters|people))|$)/i,
    /(?:@)\s*([^,.\n]+?)(?=\s+(?:on|at|from|tomorrow|today|next|for|\d{1,2}(?::\d{2})|\d+\s*(?:staff|waiters|people))|$)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return match[1].trim();
    }
  }
  return null;
}

/**
 * Detect event type from keywords
 */
function detectEventType(text) {
  const lower = text.toLowerCase();
  if (/wedding|marriage|reception/.test(lower)) return 'WEDDING';
  if (/corporate|conference|meeting|office|business/.test(lower)) return 'CORPORATE';
  if (/party|birthday|celebration|anniversary/.test(lower)) return 'PRIVATE_PARTY';
  if (/film|movie|shoot|production|photoshoot/.test(lower)) return 'FILM_SHOOT';
  if (/catering|buffet|food service/.test(lower)) return 'CORPORATE_CATERING';
  return 'UNKNOWN';
}

/**
 * Detect staff intent from keywords
 */
function detectStaffIntent(text) {
  const lower = text.toLowerCase();
  if (/yes|confirm|available|i'?m in|i am in|count me|accepted/.test(lower)) {
    return 'AVAILABLE';
  }
  if (/no|cannot|can'?t|unavailable|decline|reject|sorry/.test(lower)) {
    return 'UNAVAILABLE';
  }
  if (/what|when|where|which|schedule|shift|roster/.test(lower)) {
    return 'AVAILABILITY_QUERY';
  }
  if (/hi|hello|hey|good (morning|afternoon|evening)/.test(lower)) {
    return 'GREETING';
  }
  return 'OTHER';
}

/**
 * Parse client booking intent using regex heuristics + date/time extraction
 * Returns structured result with confidence score
 */
export function parseClientBooking(text) {
  const lower = text.toLowerCase();
  const isGreetingOnly = /^(hi|hello|hey|good (morning|afternoon|evening)|howdy|yo|sup|hey there|hi there)[!.?\s]*$/i.test(text.trim());
  const intent = isGreetingOnly ? 'GREETING'
    : /update|change|modify|reschedule/.test(lower) ? 'UPDATE_BOOKING'
    : /status|check|track/.test(lower) ? 'CHECK_STATUS'
    : /need|want|book|require|looking for|hire/.test(lower) ? 'NEW_BOOKING'
    : 'OTHER';

  const date = resolveRelativeDate(text);
  const start_time = extractTime(text);
  const headcount = extractHeadcount(text);
  const venue = extractVenue(text);
  const event_type = detectEventType(text);

  // Calculate confidence based on what we found
  let confidence = 1.0;
  const missing_fields = [];

  if (intent === 'NEW_BOOKING') {
    if (!date) { confidence -= 0.3; missing_fields.push('date'); }
    if (!headcount) { confidence -= 0.3; missing_fields.push('headcount'); }
    if (!venue) { confidence -= 0.15; missing_fields.push('venue'); }
    if (!start_time) { confidence -= 0.1; missing_fields.push('start_time'); }
  } else {
    // Non-booking intents have lower bar for completeness
    confidence = 0.9;
  }

  confidence = Math.max(0, Math.min(1, confidence));

  return {
    intent,
    venue,
    date,
    start_time,
    headcount,
    event_type,
    confidence,
    missing_fields,
  };
}

/**
 * Parse staff intent using regex heuristics
 */
export function parseStaffIntent(text) {
  const intent = detectStaffIntent(text);
  const target_date = resolveRelativeDate(text);
  const confidence = intent === 'OTHER' ? 0.5 : 0.9;

  return {
    intent,
    target_date,
    confidence,
  };
}

/**
 * State machine: decide what to do with parsed result
 * Returns: { action: 'execute' | 'clarify' | 'triage', reason: string }
 */
export function evaluateConfidence(parsed, role) {
  // Booking requests need high confidence
  if (role === 'client' && parsed.intent === 'NEW_BOOKING') {
    if (parsed.confidence < CONFIDENCE_THRESHOLD) {
      if (parsed.missing_fields?.length > 0) {
        return { action: 'clarify', reason: `Missing: ${parsed.missing_fields.join(', ')}` };
      }
      return { action: 'triage', reason: `Low confidence (${parsed.confidence.toFixed(2)})` };
    }
    return { action: 'execute', reason: 'High confidence booking' };
  }

  // Staff confirmations — lower bar
  if (role === 'staff' && (parsed.intent === 'AVAILABLE' || parsed.intent === 'UNAVAILABLE')) {
    if (parsed.confidence < 0.7) {
      return { action: 'clarify', reason: 'Ambiguous staff response' };
    }
    return { action: 'execute', reason: 'Clear staff intent' };
  }

  // Unknown senders — always triage unless very clear
  if (role === 'unknown') {
    if (parsed.confidence < 0.9) {
      return { action: 'triage', reason: 'Unknown sender, needs verification' };
    }
    return { action: 'execute', reason: 'Clear intent from unknown sender' };
  }

  return { action: 'execute', reason: 'Default execution' };
}

/**
 * Log interaction to database (always, regardless of confidence)
 */
export async function logInteraction({ senderPhone, role, intent, extractedData, confidence, action, messageId }) {
  const pool = getPool();
  try {
    await pool.query(
      `INSERT INTO interaction_logs (sender_phone, role, intent, extracted_data, confidence, action_taken, message_id, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
      [senderPhone, role, intent, JSON.stringify(extractedData), confidence, action, messageId]
    );
  } catch (err) {
    console.error('[Intent] Failed to log interaction:', err.message);
  }
}

/**
 * Queue a message for human triage
 */
export async function queueTriage({ senderPhone, role, originalText, parsed, reason }) {
  const pool = getPool();
  try {
    await pool.query(
      `INSERT INTO interaction_triage (sender_phone, role, original_message, parsed_data, reason, status, created_at)
       VALUES ($1, $2, $3, $4, $5, 'pending', NOW())`,
      [senderPhone, role, originalText, JSON.stringify(parsed), reason]
    );
  } catch (err) {
    console.error('[Intent] Failed to queue triage:', err.message);
  }
}

export async function closePool() {
  if (_pool) {
    await _pool.end();
    _pool = null;
  }
}
