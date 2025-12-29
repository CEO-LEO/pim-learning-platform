const db = require('./init');

console.log('🗑️  Removing incorrectly added videos...\n');

// List of video titles that were auto-added incorrectly
const wrongVideos = [
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
wrongVideos.forEach(title => {
  console.log(`  - ${title}`);
});
console.log('');

let removed = 0;
let notFound = 0;
let completed = 0;

wrongVideos.forEach((title) => {
  db.run(
    'DELETE FROM videos WHERE title = ?',
    [title],
    function(err) {
      completed++;
      if (err) {
        console.error(`❌ Error removing ${title}:`, err.message);
      } else {
        if (this.changes > 0) {
          console.log(`✅ Removed: ${title}`);
          removed++;
        } else {
          console.log(`⏭️  Not found: ${title}`);
          notFound++;
        }
      }

      if (completed === wrongVideos.length) {
        console.log('\n📊 Summary:');
        console.log(`   ✅ Removed: ${removed}`);
        console.log(`   ⏭️  Not found: ${notFound}`);
        console.log(`   📁 Total: ${wrongVideos.length}\n`);
        
        db.close();
      }
    }
  );
});

