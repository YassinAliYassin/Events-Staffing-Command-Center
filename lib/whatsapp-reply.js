// lib/whatsapp-reply.js — WhatsApp Business API Response Builder
// Constructs proper Meta API payloads for sending messages back to users.
// Supports: text messages, quick-reply buttons, and interactive lists.

const WHATSAPP_API_BASE = 'https://graph.facebook.com/v22.0';

/**
 * Send a text message via WhatsApp Business API
 * @param {string} to - Recipient phone (E.164, no +)
 * @param {string} text - Message body
 * @returns {Promise<object>} - API response
 */
export async function sendTextMessage(to, text) {
  const phoneId = process.env.WHATSAPP_PHONE_ID;
  const token = process.env.WHATSAPP_ACCESS_TOKEN;

  if (!phoneId || !token) {
    console.warn('[Reply] WhatsApp API not configured. Would send to:', to, 'Message:', text.slice(0, 100));
    return { status: 'skipped', reason: 'missing_credentials' };
  }

  const url = `${WHATSAPP_API_BASE}/${phoneId}/messages`;

  const payload = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: to,
    type: 'text',
    text: {
      preview_url: false,
      body: text,
    },
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[Reply] WhatsApp API error:', data);
      return { status: 'error', error: data };
    }

    return { status: 'sent', messageId: data.messages?.[0]?.id };
  } catch (err) {
    console.error('[Reply] Send failed:', err.message);
    return { status: 'error', error: err.message };
  }
}

/**
 * Send a message with quick-reply buttons
 * @param {string} to - Recipient phone
 * @param {string} bodyText - Message body
 * @param {string[]} buttons - Button labels (max 3)
 */
export async function sendQuickReply(to, bodyText, buttons) {
  const phoneId = process.env.WHATSAPP_PHONE_ID;
  const token = process.env.WHATSAPP_ACCESS_TOKEN;

  if (!phoneId || !token) {
    return { status: 'skipped', reason: 'missing_credentials' };
  }

  const url = `${WHATSAPP_API_BASE}/${phoneId}/messages`;

  const payload = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: to,
    type: 'interactive',
    interactive: {
      type: 'button',
      body: { text: bodyText },
      action: {
        buttons: buttons.slice(0, 3).map((label, i) => ({
          type: 'reply',
          reply: {
            id: `qr_${i}_${Date.now()}`,
            title: label.slice(0, 20), // WhatsApp limit: 20 chars
          },
        })),
      },
    },
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    return { status: response.ok ? 'sent' : 'error', data };
  } catch (err) {
    return { status: 'error', error: err.message };
  }
}

/**
 * Build a clarification request for missing booking fields
 */
export function buildClarificationMessage(missingFields) {
  const fieldLabels = {
    date: 'event date',
    headcount: 'number of staff needed',
    start_time: 'start time',
    venue: 'venue/location',
  };

  const friendly = missingFields.map(f => fieldLabels[f] || f).join(', ');
  return `Thanks! To complete your booking, I need a bit more info:\n\n📋 Missing: ${friendly}\n\nPlease reply with the details and I'll get it sorted!`;
}

/**
 * Build a booking confirmation message
 */
export function buildBookingConfirmation(booking) {
  return `✅ Booking Received!\n\n📅 Date: ${booking.event_date}\n👥 Staff: ${booking.headcount}\n📍 Venue: ${booking.venue}\n⏰ Time: ${booking.start_time || 'TBD'}\n🆔 Ref: ${booking.event_id}\n\nWe'll confirm staff availability shortly.`;
}

/**
 * Build a staff confirmation acknowledgment
 */
export function buildStaffAcknowledgment(staffName, status, eventDate) {
  if (status === 'AVAILABLE') {
    return `✅ Thanks ${staffName}! Your availability for ${eventDate || 'the event'} has been noted. We'll send you the final schedule soon.`;
  }
  if (status === 'UNAVAILABLE') {
    return `👍 Got it, ${staffName}. Thanks for letting us know about ${eventDate || 'the event'}.`;
  }
  return `Thanks for your message, ${staffName}! We'll get back to you.`;
}

/**
 * Build triage notification for human operator
 */
export function buildTriageNotification({ senderPhone, role, originalText, parsed, reason }) {
  return `🔔 WhatsApp Triage Alert\n\nFrom: ${senderPhone} (${role})\nReason: ${reason}\n\nMessage: "${originalText}"\n\nParsed: ${JSON.stringify(parsed, null, 2)}\n\nPlease respond via Flow Command Center.`;
}

/**
 * Build greeting for unknown senders
 */
export function buildGreetingMessage(profileName) {
  const name = profileName ? `, ${profileName}` : '';
  return `Hi there${name}! 👋\n\nWelcome to Flow (Fresh People Command Center).\n\nI can help with:\n• 📅 New booking requests\n• ✅ Staff availability confirmations\n• 📋 Booking status checks\n\nHow can I help you today?`;
}
