import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = process.env.NODE_ENV === 'production' ? '/tmp/events.db' : path.join(__dirname, '..', '..', 'events.db');

function getDB() {
  return new sqlite3.Database(dbPath, (err) => {
    if (err) console.error('DB open error:', err);
  });
}

export default async function handler(req, res) {
  const { id } = req.query;
  
  if (!id) {
    return res.status(400).json({ error: 'Event ID is required' });
  }
  
  const db = getDB();
  
  if (req.method === 'PATCH' || req.method === 'PUT') {
    const updates = req.body;
    
    // Build dynamic UPDATE query
    const fields = [];
    const values = [];
    
    Object.keys(updates).forEach(key => {
      fields.push(`${key} = ?`);
      values.push(updates[key]);
    });
    
    if (fields.length === 0) {
      db.close();
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    values.push(id); // For WHERE clause
    
    db.run(`UPDATE events SET ${fields.join(', ')} WHERE id = ?`, values, function(err) {
      db.close();
      if (err) return res.status(500).json({ error: err.message });
      res.json({ updated: this.changes, message: 'Event updated successfully' });
    });
  } else if (req.method === 'DELETE') {
    db.run('DELETE FROM events WHERE id = ?', [id], function(err) {
      db.close();
      if (err) return res.status(500).json({ error: err.message });
      res.json({ deleted: this.changes, message: 'Event deleted successfully' });
    });
  } else {
    db.close();
    res.status(405).json({ error: 'Method not allowed' });
  }
}
