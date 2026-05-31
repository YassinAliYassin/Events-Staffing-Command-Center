export default async function handler(req, res) {
  try {
    return res.status(200).json({ 
      message: 'API is working',
      method: req.method,
      env: {
        hasDbUrl: !!process.env.DATABASE_URL,
        hasWhatsAppToken: !!process.env.WHATSAPP_ACCESS_TOKEN,
        hasPhoneId: !!process.env.WHATSAPP_PHONE_NUMBER_ID
      }
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
