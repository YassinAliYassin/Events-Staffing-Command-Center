import sqlite3 from 'sqlite3';
const Database = sqlite3.Database;
const db = new Database('events.db');

db.serialize(() => {
  // Create staff table
  db.run(`CREATE TABLE IF NOT EXISTS staff (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    phone TEXT,
    role TEXT
  )`, (err) => {
    if (err) console.error('Error creating staff table:', err);
    else console.log('✓ Staff table ready');
  });

  // Create event_staff association table
  db.run(`CREATE TABLE IF NOT EXISTS event_staff (
    event_id INTEGER,
    staff_id INTEGER,
    FOREIGN KEY(event_id) REFERENCES events(id),
    FOREIGN KEY(staff_id) REFERENCES staff(id)
  )`, (err) => {
    if (err) console.error('Error creating event_staff table:', err);
    else console.log('✓ Event_staff table ready');
  });
});

db.close();
