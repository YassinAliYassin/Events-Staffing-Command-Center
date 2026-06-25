// api/whatsapp/webhook.js — Meta WhatsApp Business API Webhook Receiver
// Handles: GET (verification) + POST (inbound messages)
// Stateless — delegates processing to api/whatsapp/process.js

export default async function handler(req, res) {
  // ── GET: Meta Webhook Verification ──────────────────────────────
  if (req.method === 'GET') {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
      console.log('[WhatsApp] Webhook verified');
      return res.status(200).send(challenge);
    }

    console.warn('[WhatsApp] Verification failed', { mode, token });
    return res.status(403).send('Forbidden');
  }

  // ── POST: Inbound Message ──────────────────────────────────────
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const body = req.body;

  // Validate Meta payload structure
  if (!body.object || !body.entry || !Array.isArray(body.entry)) {
    return res.status(400).json({ error: 'Invalid webhook payload' });
  }

  // Extract first message from entry
  const entry = body.entry[0];
  const changes = entry?.changes?.[0];
  const value = changes?.value;
  const messages = value?.messages;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    // Acknowledge but ignore (could be status update, field change, etc.)
    return res.status(200).json({ status: 'ignored', reason: 'no_message' });
  }

  const message = messages[0];
  const from = message.from; // sender phone number (E.164, e.g. 27672961272)
  const type = message.type; // text, image, audio, etc.

  // Only process text messages for now
  if (type !== 'text' || !message.text?.body) {
    return res.status(200).json({ status: 'ignored', reason: `type_${type}` });
  }

  const text = message.text.body.trim();
  const messageId = message.id;
  const timestamp = message.timestamp;
  const profileName = value?.contacts?.[0]?.profile?.name || null;

  console.log(`[WhatsApp] Inbound from ${from}: "${text.slice(0, 80)}..."`);

  // Delegate to orchestrator (fire-and-forget for fast 200 ack)
  // We respond 200 immediately to Meta, then process async
  try {
    const { processMessage } = await import('./process.js');
    // Process after responding to avoid timeout
    setImmediate(() => {
      processMessage({
        from,
        text,
        messageId,
        timestamp,
        profileName,
      }).catch((err) => {
        console.error('[WhatsApp] Processing error:', err.message);
      });
    });
  } catch (err) {
    console.error('[WhatsApp] Import error:', err.message);
  }

  // Always return 200 quickly — Meta retries on non-200
  return res.status(200).json({ status: 'received' });
}
