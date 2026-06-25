// lib/whatsapp-schemas.js — Strict JSON Schemas for LLM Function Calling
// These define the exact extraction contract for the local LLM.
// The agent MUST return ONLY structured JSON matching these schemas —
// never free-form text that flows to the database layer.

/**
 * Client Booking Request Schema
 * Extracts structured booking data from unstructured client messages.
 * 
 * Example input: "We need 8 waiters at Sandton Convention Centre tomorrow at 2pm. 
 *                  Client is Sarah. Event is a wedding."
 */
export const CLIENT_BOOKING_SCHEMA = {
  name: "extract_client_booking",
  description: "Extract booking details from a client WhatsApp message. Return all fields — use null for missing information.",
  parameters: {
    type: "object",
    properties: {
      intent: {
        type: "string",
        enum: ["NEW_BOOKING", "UPDATE_BOOKING", "CHECK_STATUS", "GREETING", "OTHER"],
        description: "Detected intent of the message",
      },
      venue: {
        type: "string",
        description: "Venue name or location. null if not mentioned",
      },
      date: {
        type: "string",
        format: "date",
        description: "ISO 8601 date (YYYY-MM-DD). Resolve relative dates like 'tomorrow', 'next Friday'. null if not mentioned",
      },
      start_time: {
        type: "string",
        format: "time",
        description: "24h time HH:MM format. null if not mentioned",
      },
      headcount: {
        type: "integer",
        minimum: 1,
        description: "Number of staff required. null if not mentioned",
      },
      client_name: {
        type: "string",
        description: "Client name if mentioned. null if not mentioned",
      },
      client_phone: {
        type: "string",
        description: "Client phone if mentioned. null if not mentioned",
      },
      event_type: {
        type: "string",
        enum: ["WEDDING", "CORPORATE", "PRIVATE_PARTY", "FILM_SHOOT", "CORPORATE_CATERING", "OTHER", "UNKNOWN"],
        description: "Type of event. Default UNKNOWN if unclear",
      },
      notes: {
        type: "string",
        description: "Any additional notes, dress code, or special requirements. null if none",
      },
      confidence: {
        type: "number",
        minimum: 0,
        maximum: 1,
        description: "Confidence score 0.0-1.0 that this is a valid booking request",
      },
      missing_fields: {
        type: "array",
        items: { type: "string" },
        description: "List of required fields that are missing (e.g. ['date', 'headcount']). Empty if complete.",
      },
    },
    required: ["intent", "venue", "date", "start_time", "headcount", "confidence", "missing_fields"],
  },
};

/**
 * Staff Intent Schema
 * Extracts structured intent from staff messages.
 * 
 * Example input: "Yes I'm available for the 15th June event" 
 *              or "I can't make it on Friday"
 */
export const STAFF_INTENT_SCHEMA = {
  name: "extract_staff_intent",
  description: "Extract staff availability or shift response from a WhatsApp message. Return all fields — use null for missing information.",
  parameters: {
    type: "object",
    properties: {
      intent: {
        type: "string",
        enum: ["AVAILABLE", "UNAVAILABLE", "SHIFT_CONFIRM", "SHIFT_DECLINE", "AVAILABILITY_QUERY", "GREETING", "OTHER"],
        description: "Detected staff intent",
      },
      target_date: {
        type: "string",
        format: "date",
        description: "ISO 8601 date the staff is referring to. null if not mentioned",
      },
      shift_id: {
        type: "string",
        description: "Specific shift/event ID if mentioned. null if not mentioned",
      },
      staff_name: {
        type: "string",
        description: "Staff name if they identify themselves. null if not mentioned",
      },
      confidence: {
        type: "number",
        minimum: 0,
        maximum: 1,
        description: "Confidence score 0.0-1.0 that the intent is correctly parsed",
      },
      raw_intent_note: {
        type: "string",
        description: "Brief human-readable note about what the person meant",
      },
    },
    required: ["intent", "confidence"],
  },
};

/**
 * Combined schema set for LLM function calling
 */
export const WHATSAPP_FUNCTION_SCHEMAS = [
  CLIENT_BOOKING_SCHEMA,
  STAFF_INTENT_SCHEMA,
];

/**
 * Build the system prompt for the LLM based on sender context
 */
export function buildSystemPrompt(sessionContext) {
  const { role } = sessionContext;

  if (role === 'staff') {
    const { staff } = sessionContext;
    return `You are the Flow WhatsApp assistant. A STAFF member (${staff.name}) is messaging you.
Their phone: ${staff.phone}. Their role: ${staff.role || 'staff'}.
Recent context: ${JSON.stringify(sessionContext.recent_context)}

Parse their message using the extract_staff_intent function.
They typically respond with availability confirmations or shift accept/decline.
Be concise and direct.`;
  }

  if (role === 'client') {
    const { client } = sessionContext;
    return `You are the Flow WhatsApp assistant. A CLIENT (${client.name}) is messaging you.
Their phone: ${client.phone}. ${client.company ? `Company: ${client.company}.` : ''}
Recent bookings: ${JSON.stringify(sessionContext.recent_context)}

Parse their message using the extract_client_booking function.
They typically request events, check booking status, or provide event details.
Be professional and helpful.`;
  }

  // Unknown sender
  return `You are the Flow WhatsApp assistant. An UNKNOWN person is messaging from ${sessionContext.sender_phone}.
${sessionContext.profile_name ? `Their WhatsApp name: ${sessionContext.profile_name}.` : ''}
Recent context: ${JSON.stringify(sessionContext.recent_context)}

If this is a booking request, use extract_client_booking.
If this is a staff member not in our system, use extract_staff_intent.
Be helpful but cautious — verify their identity before sharing booking details.`;
}
