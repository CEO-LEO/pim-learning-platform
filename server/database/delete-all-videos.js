const db = require('./init');

console.log('🗑️  Deleting ALL videos from database...\n');

db.run('DELETE FROM videos', [], function(err) {
  if (err) {
    console.error('❌ Error:', err.message);
    db.close();
    process.exit(1);
  }

  console.log(`✅ Deleted ${this.changes} videos from database\n`);
  
  // Also delete video progress
  db.run('DELETE FROM video_progress', [], function(err2) {
    if (err2) {
      console.error('⚠️  Error deleting video progress:', err2.message);
    } else {
      console.log(`✅ Deleted ${this.changes} video progress records\n`);
    }
    
    console.log('✅ All videos and progress records deleted successfully\n');
    db.close();
  });
});
