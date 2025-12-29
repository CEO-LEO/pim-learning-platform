const db = require('./init');

console.log('⚠️  WARNING: This will remove ALL videos from the database!\n');

const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('Type "DELETE ALL" to confirm: ', (answer) => {
  if (answer !== 'DELETE ALL') {
    console.log('❌ Cancelled');
    rl.close();
    db.close();
    process.exit(0);
  }

  db.run('DELETE FROM videos', [], function(err) {
    if (err) {
      console.error('❌ Error:', err.message);
      rl.close();
      db.close();
      process.exit(1);
    }

    console.log(`✅ Removed ${this.changes} videos from database\n`);
    rl.close();
    db.close();
  });
});

