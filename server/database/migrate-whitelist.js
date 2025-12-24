const db = require('./init');

console.log('🔄 Migrating database to add whitelist support...');

// Add is_whitelisted column if it doesn't exist
db.run('ALTER TABLE users ADD COLUMN is_whitelisted INTEGER DEFAULT 1', (err) => {
  if (err && !err.message.includes('duplicate column')) {
    console.error('Error adding is_whitelisted column:', err.message);
  } else {
    console.log('✅ Added is_whitelisted column');
  }
  
  // Add phone column if it doesn't exist
  db.run('ALTER TABLE users ADD COLUMN phone TEXT', (err2) => {
    if (err2 && !err2.message.includes('duplicate column')) {
      console.error('Error adding phone column:', err2.message);
    } else {
      console.log('✅ Added phone column');
    }
    
    // Update existing students to be whitelisted
    db.run('UPDATE users SET is_whitelisted = 1 WHERE role = ? AND is_whitelisted IS NULL', ['student'], (err3) => {
      if (err3) {
        console.error('Error updating existing students:', err3.message);
      } else {
        console.log('✅ Updated existing students to be whitelisted');
      }
      
      console.log('✅ Migration completed!');
      db.close();
    });
  });
});

