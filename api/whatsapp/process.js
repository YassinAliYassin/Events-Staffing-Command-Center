// api/whatsapp/process.js — Orchestrator Entry Point
// Wires: Router → Intent Parser → Confidence Gate → DB/Reply
// This is the single processing pipeline invoked by the webhook handler.

import { routeMessage } from '../../lib/whatsapp-router.js';
import { parseClientBooking, parseStaffIntent, evaluateConfidence, logInteraction as logIntentInteraction, queueTriage } from '../../lib/whatsapp-intent.js';
import { ensureSchema, createBooking, upsertStaffConfirmation, logInteraction as logDBInteraction, queueTriage as queueDBTriage } from '../../lib/whatsapp-db.js';
import {
  sendTextMessage,
  sendQuickReply,
  buildClarificationMessage,
  buildBookingConfirmation,
  buildStaffAcknowledgment,
  buildGreetingMessage,
} from '../../lib/whatsapp-reply.js';

let _schemaEnsured = false;

async function ensureDBSchema() {
  if (_schemaEnsured) return;
  try {
    await ensureSchema();
    _schemaEnsured = true;
  } catch (err) {
    console.error('[Process] Schema ensure failed:', err.message);
  }
}

/**
 * Main processing pipeline
 * @param {object} params - { from, text, messageId, timestamp, profileName }
 */
export async function processMessage({ from, text, messageId, timestamp, profileName }) {
  await ensureDBSchema();

  const result = {
    status: 'processed',
    from,
    actions: [],
  };

  try {
    // ── Step 1: Route — identify sender ─────────────────────────
    const session = await routeMessage(from, profileName);
    const { role } = session;
    result.role = role;
    result.session = session;

    console.log(`[Process] Routed ${from} as ${role}`);

    // ── Step 2: Parse intent based on role ──────────────────────
    let parsed;
    if (role === 'staff') {
      parsed = parseStaffIntent(text);
    } else if (role === 'client') {
      parsed = parseClientBooking(text);
    } else {
      // Unknown — try both, pick higher confidence
      const clientParsed = parseClientBooking(text);
      const staffParsed = parseStaffIntent(text);
      parsed = clientParsed.confidence >= staffParsed.confidence ? clientParsed : staffParsed;
    }

    result.parsed = parsed;
    console.log(`[Process] Intent: ${parsed.intent} (confidence: ${parsed.confidence.toFixed(2)})`);

    // ── Step 3: Confidence gate ─────────────────────────────────
    const decision = evaluateConfidence(parsed, role);
    result.decision = decision;
    console.log(`[Process] Decision: ${decision.action} — ${decision.reason}`);

    // ── Step 4: Execute action ──────────────────────────────────
    switch (decision.action) {
      case 'execute': {
        // Log interaction
        await logDBInteraction({ senderPhone: from, role, intent: parsed.intent, extractedData: parsed, confidence: parsed.confidence, action: 'execute', messageId });
        await logIntentInteraction({ senderPhone: from, role, intent: parsed.intent, extractedData: parsed, confidence: parsed.confidence, action: 'execute', messageId });

        if (role === 'client' && parsed.intent === 'NEW_BOOKING') {
          // Create booking
          const booking = await createBooking({
            clientName: parsed.client_name,
            clientPhone: from,
            venue: parsed.venue,
            eventDate: parsed.date,
            startTime: parsed.start_time,
            headcount: parsed.headcount,
            eventType: parsed.event_type,
            notes: parsed.notes,
          });
          result.booking = booking;

          // Send confirmation
          const confirmMsg = buildBookingConfirmation(booking);
          await sendTextMessage(from, confirmMsg);
          result.reply = { type: 'confirmation', sent: true };
        }
        else if (role === 'staff' && (parsed.intent === 'AVAILABLE' || parsed.intent === 'UNAVAILABLE')) {
          // Update staff confirmation (need event_id from context)
          // For now, log the intent — actual confirmation linking happens
          // when the operator assigns the staff to a booking
          const ackMsg = buildStaffAcknowledgment(session.staff?.name || 'there', parsed.intent, parsed.target_date);
          await sendTextMessage(from, ackMsg);
          result.reply = { type: 'acknowledgment', sent: true };
        }
        else if (role === 'unknown') {
          // Greet unknown senders
          const greeting = buildGreetingMessage(profileName);
          await sendTextMessage(from, greeting);
          result.reply = { type: 'greeting', sent: true };
        }
        else {
          // Generic acknowledgment
          await sendTextMessage(from, 'Thanks for your message! We\'ll get back to you shortly.');
          result.reply = { type: 'generic', sent: true };
        }

        result.actions.push('executed');
        break;
      }

      case 'clarify': {
        // Log interaction
        await logDBInteraction({ senderPhone: from, role, intent: parsed.intent, extractedData: parsed, confidence: parsed.confidence, action: 'clarify', messageId });
        await logIntentInteraction({ senderPhone: from, role, intent: parsed.intent, extractedData: parsed, confidence: parsed.confidence, action: 'clarify', messageId });

        // Send clarification request
        const clarifyMsg = buildClarificationMessage(parsed.missing_fields || []);
        await sendTextMessage(from, clarifyMsg);
        result.reply = { type: 'clarification', sent: true };
        result.actions.push('clarify_sent');
        break;
      }

      case 'triage': {
        // Log interaction
        await logDBInteraction({ senderPhone: from, role, intent: parsed.intent, extractedData: parsed, confidence: parsed.confidence, action: 'triage', messageId });
        await logIntentInteraction({ senderPhone: from, role, intent: parsed.intent, extractedData: parsed, confidence: parsed.confidence, action: 'triage', messageId });

        // Queue for human
        const triageId = await queueDBTriage({ senderPhone: from, role, originalMessage: text, parsedData: parsed, reason: decision.reason });
        result.triageId = triageId;

        // Inform user
        await sendTextMessage(from, 'Your message has been forwarded to our team. We\'ll get back to you shortly!');
        result.reply = { type: 'triage', sent: true };
        result.actions.push('triaged');
        break;
      }

      default:
        console.error(`[Process] Unknown action: ${decision.action}`);
        result.actions.push('unknown_action');
    }
  } catch (err) {
    console.error('[Process] Error processing message:', err);
    result.status = 'error';
    result.error = err.message;

    // Try to notify user of error (don't fail if this also errors)
    try {
      await sendTextMessage(from, 'Sorry, we encountered an error processing your message. Please try again or contact us directly.');
    } catch (_) { /* swallow */ }
  }

  return result;
}

/**
 * Health check endpoint
 */
export async function healthCheck() {
  try {
    await ensureDBSchema();
    return { status: 'healthy', whatsapp: true, timestamp: new Date().toISOString() };
  } catch (err) {
    return { status: 'unhealthy', error: err.message };
  }
}
