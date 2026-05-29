import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

export default async function handler(req, res) {
  const authHeader = req.headers.authorization;
  const adminSecret = process.env.ADMIN_SECRET;
  const cronSecret = process.env.CRON_SECRET;
  
  // Auth check (ADMIN or CRON)
  if (!adminSecret && !cronSecret) {
    return res.status(500).json({ error: 'Server misconfigured' });
  }
  
  const isCron = cronSecret && authHeader === `Bearer ${cronSecret}`;
  const isAdmin = adminSecret && authHeader === `Bearer ${adminSecret}`;
  
  if (!isCron && !isAdmin) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const checkOnly = req.query.check_only !== 'false';
  const autoRepair = req.query.auto_repair === 'true' || req.query.repair === 'true';
  const fullReport = req.query.full_report === 'true' || req.query.full === 'true';
  
  try {
    const report = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      checks: {},
      auto_repairs: [],
      warnings: []
    };
    
    // CHECK 1: FK Drift Detection
    const fkCheck = await checkFKDrift();
    report.checks.fk_drift = fkCheck;
    if (fkCheck.status === 'fail') report.status = 'degraded';
    
    // CHECK 2: Orphaned Records
    const orphanCheck = await checkOrphanedRecords();
    report.checks.orphaned_records = orphanCheck;
    if (orphanCheck.status === 'fail') report.status = 'degraded';
    
    // CHECK 3: Canonical Model Integrity
    const canonicalCheck = await checkCanonicalModel();
    report.checks.canonical_model = canonicalCheck;
    if (canonicalCheck.status === 'fail') report.status = 'broken';
    
    // AUTO-REPAIR (if requested)
    if (autoRepair && report.status !== 'healthy') {
      const repairs = await performAutoRepair(report.checks);
      report.auto_repairs = repairs.actions;
      report.status = repairs.new_status;
    }
    
    // FULL REPORT (additional diagnostics)
    if (fullReport) {
      report.diagnostics = await getFullDiagnostics();
    }
    
    // If cron job, send WhatsApp report (optional)
    if (isCron && report.status !== 'healthy') {
      await sendWhatsAppAlert(report);
    }
    
    await pool.end();
    
    return res.status(200).json(report);
    
  } catch (error) {
    console.error('[Health-DB] Error:', error);
    await pool.end();
    return res.status(500).json({ 
      error: error.message,
      status: 'broken'
    });
  }
}

// ==================== CHECK FUNCTIONS ===================

async function checkFKDrift() {
  const result = {
    status: 'pass',
    issues: [],
    repairs_needed: []
  };
  
  try {
    // Check for FKs pointing to calendar_events (FORBIDDEN)
    const forbiddenFKs = await pool.query(`
      SELECT conname, conrelid::regclass as table_name, confrelid::regclass as references_table
      FROM pg_constraint 
      WHERE confrelid = 'calendar_events'::regclass
      AND contype = 'f'
    `);
    
    if (forbiddenFKs.rows.length > 0) {
      result.status = 'fail';
      result.issues.push({
        type: 'forbidden_fk',
        message: 'Foreign keys pointing to calendar_events (FORBIDDEN)',
        details: forbiddenFKs.rows
      });
      result.repairs_needed.push('drop_fk_calendar_events');
    }
    
    // Check for missing FKs to bookings (REQUIRED)
    const requiredTables = ['staff_confirmations', 'event_timeline'];
    
    for (const tableName of requiredTables) {
      const fks = await pool.query(`
        SELECT conname, confrelid::regclass as references_table
        FROM pg_constraint 
        WHERE conrelid = $1::regclass
        AND contype = 'f'
        AND confrelid = 'bookings'::regclass
      `, [tableName]);
      
      if (fks.rows.length === 0) {
        result.status = 'fail';
        result.issues.push({
          type: 'missing_fk',
          message: `${tableName} missing FK to bookings(event_id)`,
          table: tableName
        });
        result.repairs_needed.push(`add_fk_${tableName}_to_bookings`);
      }
    }
    
    // Check bookings.event_id is PK
    const pkCheck = await pool.query(`
      SELECT conname FROM pg_constraint 
      WHERE conrelid = 'bookings'::regclass 
      AND contype = 'p'
    `);
    
    if (pkCheck.rows.length === 0) {
      result.status = 'fail';
      result.issues.push({
        type: 'missing_pk',
        message: 'bookings table missing PRIMARY KEY on event_id'
      });
      result.repairs_needed.push('add_pk_bookings_event_id');
    }
    
  } catch (error) {
    result.status = 'error';
    result.error = error.message;
  }
  
  return result;
}

async function checkOrphanedRecords() {
  const result = {
    status: 'pass',
    count: 0,
    samples: [],
    details: {}
  };
  
  try {
    // Check staff_confirmations
    const scOrphans = await pool.query(`
      SELECT sc.event_id, sc.staff_phone, sc.status
      FROM staff_confirmations sc
      LEFT JOIN bookings b ON sc.event_id = b.event_id
      WHERE b.event_id IS NULL
      LIMIT 10
    `);
    
    if (scOrphans.rows.length > 0) {
      result.status = 'fail';
      result.count += scOrphans.rows.length;
      result.samples.push(...scOrphans.rows.map(r => ({
        table: 'staff_confirmations',
        event_id: r.event_id,
        details: `staff_phone=${r.staff_phone}, status=${r.status}`
      })));
    }
    
    // Check event_timeline
    const etOrphans = await pool.query(`
      SELECT et.event_id, et.stage
      FROM event_timeline et
      LEFT JOIN bookings b ON et.event_id = b.event_id
      WHERE b.event_id IS NULL
      LIMIT 10
    `);
    
    if (etOrphans.rows.length > 0) {
      result.status = 'fail';
      result.count += etOrphans.rows.length;
      result.samples.push(...etOrphans.rows.map(r => ({
        table: 'event_timeline',
        event_id: r.event_id,
        details: `stage=${r.stage}`
      })));
    }
    
    // Check whatsapp_messages (nullable, so just warn)
    const wmOrphans = await pool.query(`
      SELECT wm.related_event, wm.direction
      FROM whatsapp_messages wm
      LEFT JOIN bookings b ON wm.related_event = b.event_id
      WHERE wm.related_event IS NOT NULL AND b.event_id IS NULL
      LIMIT 10
    `);
    
    if (wmOrphans.rows.length > 0) {
      result.status = 'fail';
      result.count += wmOrphans.rows.length;
      result.samples.push(...wmOrphans.rows.map(r => ({
        table: 'whatsapp_messages',
        event_id: r.related_event,
        details: `direction=${r.direction}`
      })));
    }
    
    result.details = {
      staff_confirmations_orphans: scOrphans.rows.length,
      event_timeline_orphans: etOrphans.rows.length,
      whatsapp_messages_orphans: wmOrphans.rows.length
    };
    
  } catch (error) {
    result.status = 'error';
    result.error = error.message;
  }
  
  return result;
}

async function checkCanonicalModel() {
  const result = {
    status: 'pass',
    issues: []
  };
  
  try {
    // Check bookings.event_id is not NULL
    const nullEventId = await pool.query(`
      SELECT COUNT(*) as count FROM bookings WHERE event_id IS NULL
    `);
    
    if (parseInt(nullEventId.rows[0].count) > 0) {
      result.status = 'fail';
      result.issues.push({
        type: 'null_event_id',
        message: `${nullEventId.rows[0].count} bookings have NULL event_id`,
        repair: 'backfill_event_id'
      });
    }
    
    // Check for duplicate event IDs
    const duplicates = await pool.query(`
      SELECT event_id, COUNT(*) as cnt 
      FROM bookings 
      GROUP BY event_id 
      HAVING COUNT(*) > 1
    `);
    
    if (duplicates.rows.length > 0) {
      result.status = 'fail';
      result.issues.push({
        type: 'duplicate_event_id',
        message: `${duplicates.rows.length} duplicate event_ids found`,
        samples: duplicates.rows.slice(0, 5)
      });
    }
    
    // Check calendar_events has NO FK dependencies
    const calendarFKs = await pool.query(`
      SELECT conname FROM pg_constraint 
      WHERE confrelid = 'calendar_events'::regclass
    `);
    
    if (calendarFKs.rows.length > 0) {
      result.status = 'fail';
      result.issues.push({
        type: 'calendar_events_has_fk',
        message: 'calendar_events still has inbound foreign keys',
        details: calendarFKs.rows
      });
    }
    
  } catch (error) {
    result.status = 'error';
    result.error = error.message;
  }
  
  return result;
}

// ==================== REPAIR FUNCTIONS ===================

async function performAutoRepair(checks) {
  const actions = [];
  let newStatus = 'healthy';
  
  try {
    // REPAIR 1: Drop forbidden FKs to calendar_events
    if (checks.fk_drift.repairs_needed.includes('drop_fk_calendar_events')) {
      await pool.query(`ALTER TABLE staff_confirmations DROP CONSTRAINT IF EXISTS staff_confirmations_event_id_fkey`);
      await pool.query(`ALTER TABLE event_timeline DROP CONSTRAINT IF EXISTS event_timeline_event_id_fkey`);
      actions.push({
        action: 'drop_fk_calendar_events',
        status: 'success',
        message: 'Dropped FKs pointing to calendar_events'
      });
    }
    
    // REPAIR 2: Add missing FKs to bookings
    if (checks.fk_drift.repairs_needed.includes('add_fk_staff_confirmations_to_bookings')) {
      await pool.query(`
        ALTER TABLE staff_confirmations 
        ADD CONSTRAINT staff_confirmations_event_id_fkey 
        FOREIGN KEY (event_id) REFERENCES bookings(event_id) 
        ON DELETE CASCADE
      `);
      actions.push({
        action: 'add_fk_staff_confirmations_to_bookings',
        status: 'success'
      });
    }
    
    if (checks.fk_drift.repairs_needed.includes('add_fk_event_timeline_to_bookings')) {
      await pool.query(`
        ALTER TABLE event_timeline 
        ADD CONSTRAINT event_timeline_event_id_fkey 
        FOREIGN KEY (event_id) REFERENCES bookings(event_id) 
        ON DELETE CASCADE
      `);
      actions.push({
        action: 'add_fk_event_timeline_to_bookings',
        status: 'success'
      });
    }
    
    // REPAIR 3: Add PK to bookings if missing
    if (checks.fk_drift.repairs_needed.includes('add_pk_bookings_event_id')) {
      await pool.query(`ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_pkey`);
      await pool.query(`ALTER TABLE bookings ADD CONSTRAINT bookings_pkey PRIMARY KEY (event_id)`);
      actions.push({
        action: 'add_pk_bookings_event_id',
        status: 'success'
      });
    }
    
    // REPAIR 4: Backfill NULL event_id in bookings
    if (checks.canonical_model.issues.some(i => i.repair === 'backfill_event_id')) {
      await pool.query(`
        UPDATE bookings 
        SET event_id = COALESCE(event_id, booking_ref) 
        WHERE event_id IS NULL
      `);
      actions.push({
        action: 'backfill_event_id',
        status: 'success',
        message: 'Backfilled NULL event_id values'
      });
    }
    
    // REPAIR 5: Set NULL on orphaned whatsapp_messages (safe)
    const wmOrphans = await pool.query(`
      SELECT wm.id FROM whatsapp_messages wm
      LEFT JOIN bookings b ON wm.related_event = b.event_id
      WHERE wm.related_event IS NOT NULL AND b.event_id IS NULL
    `);
    
    if (wmOrphans.rows.length > 0) {
      await pool.query(`
        UPDATE whatsapp_messages 
        SET related_event = NULL 
        WHERE id IN (${wmOrphans.rows.map((r, i) => `$${i+1}`).join(',')})
      `, wmOrphans.rows.map(r => r.id));
      actions.push({
        action: 'nullify_orphaned_whatsapp_messages',
        status: 'success',
        count: wmOrphans.rows.length
      });
    }
    
    newStatus = 'healthy';
    
  } catch (error) {
    actions.push({
      action: 'repair_error',
      status: 'error',
      error: error.message
    });
    newStatus = 'broken';
  }
  
  return { actions, newStatus };
}

// ==================== DIAGNOSTICS ===================

async function getFullDiagnostics() {
  try {
    const diagnostics = {};
    
    // Table sizes
    const tableSizes = await pool.query(`
      SELECT 
        relname as table_name,
        n_live_tup as row_count
      FROM pg_stat_user_tables 
      WHERE relname IN ('bookings', 'staff_confirmations', 'event_timeline', 'whatsapp_messages', 'calendar_events', 'events')
      ORDER BY n_live_tup DESC
    `);
    diagnostics.table_sizes = tableSizes.rows;
    
    // Constraint details
    const constraints = await pool.query(`
      SELECT 
        conname,
        conrelid::regclass as table_name,
        confrelid::regclass as references_table,
        contype
      FROM pg_constraint 
      WHERE conrelid IN (
        SELECT oid FROM pg_class 
        WHERE relname IN ('bookings', 'staff_confirmations', 'event_timeline', 'whatsapp_messages')
      )
      ORDER BY conrelid::regclass
    `);
    diagnostics.constraints = constraints.rows;
    
    // Recent errors (from whatsapp_messages if any)
    const recentErrors = await pool.query(`
      SELECT * FROM whatsapp_messages 
      WHERE content LIKE '%error%' OR content LIKE '%fail%' 
      ORDER BY created_at DESC 
      LIMIT 5
    `);
    diagnostics.recent_errors = recentErrors.rows;
    
    return diagnostics;
    
  } catch (error) {
    return { error: error.message };
  }
}

// ==================== WHATSAPP ALERT ===================

async function sendWhatsAppAlert(report) {
  try {
    const yassinPhone = process.env.YASSIN_PHONE || '+276****1272';
    const token = process.env.WHATSAPP_TOKEN;
    const phoneId = process.env.WHATSAPP_PHONE_ID;
    
    if (!token || !phoneId) return;
    
    const message = `🏥 DB HEALTH ALERT\n\nStatus: ${report.status.toUpperCase()}\n\nFK Issues: ${report.checks.fk_drift.issues.length}\nOrphans: ${report.checks.orphaned_records.count}\n\nRun: /db-health for details.`;
    
    await fetch(`https://graph.facebook.com/v18.0/${phoneId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: yassinPhone,
        text: { body: message }
      })
    });
    
  } catch (error) {
    console.error('[Health-DB] WhatsApp alert failed:', error.message);
  }
}
