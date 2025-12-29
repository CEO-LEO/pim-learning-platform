const db = require('./init');

console.log('🗑️  Removing auto-added videos from database...\n');

// List of video titles that were auto-added (can be customized)
const autoAddedTitles = [
  'store model 101',
  'store model 101 video2',
  'store model 101 video3',
  'store model 101 video4',
  'store model 101 video5',
  'store model 101 video6',
  'store model 101 video7',
  'store model 101 video8'
];

console.log('Videos to remove:');
autoAddedTitles.forEach(title => {
  console.log(`  - ${title}`);
});
console.log('');

// Ask for confirmation
const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('Do you want to remove these videos? (yes/no): ', (answer) => {
  if (answer.toLowerCase() !== 'yes' && answer.toLowerCase() !== 'y') {
    console.log('❌ Cancelled');
    rl.close();
    db.close();
    process.exit(0);
  }

  let removed = 0;
  let errors = 0;

  autoAddedTitles.forEach((title, index) => {
    db.run(
      'DELETE FROM videos WHERE title = ?',
      [title],
      function(err) {
        if (err) {
          console.error(`❌ Error removing ${title}:`, err.message);
          errors++;
        } else {
          if (this.changes > 0) {
            console.log(`✅ Removed: ${title}`);
            removed++;
          } else {
            console.log(`⏭️  Not found: ${title}`);
          }
        }

        if (index === autoAddedTitles.length - 1) {
          console.log('\n📊 Summary:');
          console.log(`   ✅ Removed: ${removed}`);
          console.log(`   ❌ Errors: ${errors}`);
          console.log(`   📁 Total: ${autoAddedTitles.length}\n`);
          
          rl.close();
          db.close();
        }
      }
    );
  });
});

