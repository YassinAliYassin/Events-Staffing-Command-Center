import { checkAuth } from '../../lib/auth.js';

export default async function handler(req, res) {
  // Basic input validation
  const body = req.body || {};
  if (['POST', 'PATCH', 'DELETE'].includes(req.method)) {
    if (req.method === 'POST' && !body.name) {
      return res.status(400).json({ error: 'name is required for new staff' });
    }
    if (req.method === 'PATCH' && (!body.id || !body.name)) {
      return res.status(400).json({ error: 'id and name required for update' });
    }
    if (req.method === 'DELETE' && !body.id) {
      return res.status(400).json({ error: 'id required for delete' });
    }
  }

  try {
    const { Pool } = await import('pg');
    
    if (!process.env.DATABASE_URL) {
      return res.status(500).json({ error: 'DATABASE_URL not set' });
    }
    
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: 1,
      idleTimeoutMillis: 100
    });
    
    // Create table if not exists (original schema only)
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS staff (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          phone TEXT DEFAULT '',
          role TEXT DEFAULT '',
          total_hours INTEGER DEFAULT 0
        )
      `);
      // Add total_hours column if not exists (for existing tables)
      await pool.query(`ALTER TABLE staff ADD COLUMN IF NOT EXISTS total_hours INTEGER DEFAULT 0`).catch(e => {});
    } catch (e) {
      console.log('Table creation note:', e.message);
    }
    
    if (req.method === 'GET') {
      const { rows } = await pool.query('SELECT id, name, phone, role, total_hours FROM staff ORDER BY name ASC');
      await pool.end();
      return res.json({ staff: rows });
    }
    
    // Protect all writes with auth (shared secret / JWT)
    if (['POST', 'PATCH', 'DELETE'].includes(req.method)) {
      const authed = checkAuth(req, res);
      if (!authed) {
        await pool.end();
        return; // response already sent
      }
    }
    
    if (req.method === 'POST') {
      const { name, phone, role } = req.body;
      const { rows } = await pool.query(
        'INSERT INTO staff (name, phone, role) VALUES ($1, $2, $3) RETURNING *',
        [name || '', phone || '', role || '']
      );
      await pool.end();
      return res.json({ staff: rows[0], message: 'Staff added successfully' });
    }
    
    if (req.method === 'PATCH') {
      const { id, name, phone, role } = req.body;
      await pool.query(
        'UPDATE staff SET name=$1, phone=$2, role=$3 WHERE id=$4',
        [name, phone, role, id]
      );
      await pool.end();
      return res.json({ message: 'Staff updated successfully' });
    }
    
    if (req.method === 'DELETE') {
      const { id } = req.body;
      await pool.query('DELETE FROM staff WHERE id=$1', [id]);
      await pool.end();
      return res.json({ message: 'Staff deleted successfully' });
    }
    
    await pool.end();
    return res.status(405).json({ error: 'Method not allowed' });
    
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: error.message || 'Server error' });
  }
}
