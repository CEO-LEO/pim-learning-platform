const db = require('./init');

console.log('🗑️  Deleting ALL videos from database...');
console.log('⚠️  WARNING: This will delete all videos and video progress!');

// Delete in order: video_progress -> videos
// 1. Delete video progress first (foreign key constraint)
db.run('DELETE FROM video_progress', function(err) {
  if (err) {
    console.error('❌ Error deleting video progress:', err.message);
    db.close();
    process.exit(1);
  } else {
    console.log(`✅ Deleted ${this.changes} video progress records`);

    // 2. Delete all videos
    db.run('DELETE FROM videos', function(err) {
      if (err) {
        console.error('❌ Error deleting videos:', err.message);
        db.close();
        process.exit(1);
      } else {
        console.log(`✅ Deleted ${this.changes} videos`);
        console.log('\n🎉 All videos and video progress deleted successfully!');
        console.log('💡 You can now add new videos to the system.');
        db.close();
        process.exit(0);
      }
    });
  }
});

