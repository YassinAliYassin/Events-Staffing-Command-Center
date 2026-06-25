// api/whatsapp/health.js — WhatsApp Middleware Health Check
export default async function handler(req, res) {
  const health = {
    status: 'ok',
    service: 'whatsapp-middleware',
    timestamp: new Date().toISOString(),
    env: {
      WHATSAPP_PHONE_ID: process.env.WHATSAPP_PHONE_ID ? 'set' : 'missing',
      WHATSAPP_ACCESS_TOKEN: process.env.WHATSAPP_ACCESS_TOKEN ? 'set' : 'missing',
      WHATSAPP_VERIFY_TOKEN: process.env.WHATSAPP_VERIFY_TOKEN ? 'set' : 'missing',
      DATABASE_URL: process.env.DATABASE_URL ? 'set' : 'missing',
    },
  };

  // Test DB connectivity
  try {
    const { Pool } = await import('pg');
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    });
    const result = await pool.query('SELECT NOW()');
    await pool.end();
    health.database = { status: 'connected', time: result.rows[0].now };
  } catch (err) {
    health.database = { status: 'error', error: err.message };
    health.status = 'degraded';
  }

  const statusCode = health.status === 'ok' ? 200 : 503;
  return res.status(statusCode).json(health);
}
