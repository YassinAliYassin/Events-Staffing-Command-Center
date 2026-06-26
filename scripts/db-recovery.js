import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config({ path: './.env.production' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkAndCreateTables() {
  console.log('=== PHASE 1: DATABASE RECOVERY ===\n');
  
  const tables = [
    {
      name: 'staff',
      createSQL: `
        CREATE TABLE IF NOT EXISTS staff (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          phone TEXT,
          role TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `
    },
    {
      name: 'events',
      createSQL: `
        CREATE TABLE IF NOT EXISTS events (
          id TEXT PRIMARY KEY,
          title TEXT,
          date TEXT,
          duration INTEGER,
          staff_assigned TEXT,
          dressCode TEXT,
          arrivalTime TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `
    },
    {
      name: 'calendar_events',
      createSQL: `
        CREATE TABLE IF NOT EXISTS calendar_events (
          uid TEXT PRIMARY KEY,
          title TEXT,
          start_at TIMESTAMPTZ,
          end_at TIMESTAMPTZ,
          timezone TEXT DEFAULT 'Africa/Johannesburg',
          attendees TEXT,
          description TEXT,
          location TEXT,
          source TEXT DEFAULT 'icloud',
          created_at TIMESTAMPTZ DEFAULT NOW()
        )
      `
    },
    {
      name: 'bookings',
      createSQL: `
        CREATE TABLE IF NOT EXISTS bookings (
          id SERIAL PRIMARY KEY,
          booking_ref TEXT UNIQUE DEFAULT 'BK-' || to_char(NOW(), 'YYYYMMDD-') || LPAD(nextval('bookings_id_seq')::text, 3, '0'),
          client_name TEXT,
          client_phone TEXT,
          venue TEXT,
          event_date TIMESTAMPTZ,
          event_time TEXT,
          staff_required INTEGER DEFAULT 0,
          status TEXT DEFAULT 'pending',
          raw_message TEXT,
          extracted_data JSONB,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        )
      `
    },
    {
      name: 'staff_confirmations',
      createSQL: `
        CREATE TABLE IF NOT EXISTS staff_confirmations (
          id SERIAL PRIMARY KEY,
          event_id TEXT REFERENCES calendar_events(uid) ON DELETE CASCADE,
          staff_name TEXT,
          staff_phone TEXT,
          status TEXT DEFAULT 'pending',
          response_message TEXT,
          responded_at TIMESTAMPTZ,
          created_at TIMESTAMPTZ DEFAULT NOW()
        )
      `
    },
    {
      name: 'event_timeline',
      createSQL: `
        CREATE TABLE IF NOT EXISTS event_timeline (
          id SERIAL PRIMARY KEY,
          event_id TEXT REFERENCES calendar_events(uid) ON DELETE CASCADE,
          event_ref TEXT,
          stage TEXT,
          status TEXT DEFAULT 'pending',
          notes TEXT,
          metadata JSONB,
          created_at TIMESTAMPTZ DEFAULT NOW()
        )
      `
    },
    {
      name: 'whatsapp_messages',
      createSQL: `
        CREATE TABLE IF NOT EXISTS whatsapp_messages (
          id SERIAL PRIMARY KEY,
          direction TEXT,
          sender_phone TEXT,
          recipient_phone TEXT,
          message_type TEXT,
          content TEXT,
          status TEXT DEFAULT 'sent',
          related_event TEXT,
          related_booking TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW()
        )
      `
    }
  ];
  
  for (const table of tables) {
    try {
      console.log(`Checking table: ${table.name}`);
      await pool.query(table.createSQL);
      console.log(`  ✓ Table ${table.name} ready`);
      
      // Get row count
      const countResult = await pool.query(`SELECT COUNT(*) as count FROM ${table.name}`);
      console.log(`  → Row count: ${countResult.rows[0].count}`);
      
      // Get schema
      const schemaResult = await pool.query(`
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = $1 
        ORDER BY ordinal_position
      `, [table.name]);
      console.log(`  → Columns: ${schemaResult.rows.map(r => r.column_name).join(', ')}`);
      console.log('');
      
    } catch (error) {
      console.error(`  ✗ Error with table ${table.name}: ${error.message}`);
    }
  }
  
  await pool.end();
  console.log('=== DATABASE RECOVERY COMPLETE ===');
}

checkAndCreateTables().catch(console.error);
