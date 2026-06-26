const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./events.db');

console.log('🧹 Cleaning up duplicate events...\n');

// Remove duplicate events (keep lowest ID for each title + date)
db.all(`SELECT title, date, GROUP_CONCAT(id) as ids, COUNT(*) as cnt 
        FROM events 
        GROUP BY title, date 
        HAVING cnt > 1`, (err, dupEvents) => {
  if (err) { console.error('Error finding duplicate events:', err); return; }
  
  if (dupEvents.length === 0) {
    console.log('✓ No duplicate events found');
    showFinalCounts();
    return;
  }
  
  dupEvents.forEach(event => {
    const ids = event.ids.split(',').map(Number);
    const keepId = Math.min(...ids);
    const deleteIds = ids.filter(id => id !== keepId);
    
    if (deleteIds.length > 0) {
      console.log(`Event "${event.title}" on ${event.date}: keeping ID ${keepId}, deleting IDs ${deleteIds.join(', ')}`);
      
      // Update staff_assignments to point to kept event ID
      db.run(`UPDATE staff_assignments SET eventId = ? WHERE eventId IN (${deleteIds.join(',')})`, [keepId], function(err) {
        if (err) console.error('Error updating assignments:', err);
      });
      
      // Delete duplicate events
      db.run(`DELETE FROM events WHERE id IN (${deleteIds.join(',')})`, [], function(err) {
        if (err) console.error('Error deleting events:', err);
        else console.log(`  ✓ Deleted ${this.changes} duplicate event(s)`);
      });
    }
  });
  
  setTimeout(() => {
    showFinalCounts();
  }, 1000);
});

function showFinalCounts() {
  // Show final counts
  db.get('SELECT COUNT(*) as count FROM clients', (err, row) => {
    console.log(`\n📊 Final counts:`);
    console.log(`   Clients: ${row.count}`);
    
    db.get('SELECT COUNT(*) as count FROM events', (err, row) => {
      console.log(`   Events: ${row.count}`);
      
      db.get('SELECT COUNT(*) as count FROM staff_assignments', (err, row) => {
        console.log(`   Assignments: ${row.count}`);
        console.log('\n✅ Cleanup complete!');
        db.close();
      });
    });
  });
}
