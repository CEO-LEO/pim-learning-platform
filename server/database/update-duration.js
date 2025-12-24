const db = require('./init');

const videoId1 = '165473f7-0c89-4d8a-b07f-33ec50bb4f88';
const duration1 = 49; // seconds

const videoId2 = '78b20ee2-27bd-4edc-a483-a964a2c52dcb';
const duration2 = 72; // seconds

// Update video 1
db.run(
  'UPDATE videos SET duration = ? WHERE video_id = ?',
  [duration1, videoId1],
  function(err) {
    if (err) {
      console.error('❌ Error updating video 1:', err.message);
    } else {
      console.log(`✅ Updated video 1 duration to ${duration1} seconds (${Math.floor(duration1/60)} min ${duration1%60} sec)`);
    }
    
    // Update video 2
    db.run(
      'UPDATE videos SET duration = ? WHERE video_id = ?',
      [duration2, videoId2],
      function(err2) {
        if (err2) {
          console.error('❌ Error updating video 2:', err2.message);
        } else {
          console.log(`✅ Updated video 2 duration to ${duration2} seconds (${Math.floor(duration2/60)} min ${duration2%60} sec)`);
        }
        
        db.close();
        process.exit(0);
      }
    );
  }
);

