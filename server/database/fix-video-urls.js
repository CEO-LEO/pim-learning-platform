const db = require('./init');

console.log('Updating video URLs to match available files...\n');

// Map: module -> available video file
const videoMap = {
    'module_1': ['store-model-101-video2.mp4', 'store-model-101-video3.mp4'],
    'module_2': ['store-model-101-video4.mp4'],
    'module_3': ['store-model-101-video5.mp4'],
    'module_4': []
};

db.serialize(() => {
    // Get all videos
    db.all('SELECT video_id, module_id, title, url, order_index FROM videos ORDER BY module_id, order_index', [], (err, videos) => {
        if (err) {
            console.error('Error:', err);
            db.close();
            return;
        }

        console.log(`Found ${videos.length} videos\n`);

        let updated = 0;
        videos.forEach((video, idx) => {
            const moduleVideos = videoMap[video.module_id] || [];
            const newFilename = moduleVideos[video.order_index - 1];

            if (newFilename) {
                const newUrl = `https://pim-learning-platform-production.up.railway.app/api/videos/stream/${newFilename}`;
                
                db.run('UPDATE videos SET url = ? WHERE video_id = ?', [newUrl, video.video_id], (err) => {
                    if (err) {
                        console.error(`Error updating ${video.title}:`, err);
                    } else {
                        console.log(`✓ ${video.title}`);
                        console.log(`  → ${newFilename}\n`);
                        updated++;
                    }

                    // Close after last update
                    if (idx === videos.length - 1) {
                        setTimeout(() => {
                            console.log(`\nUpdated ${updated}/${videos.length} videos`);
                            db.close();
                        }, 1000);
                    }
                });
            } else {
                console.log(`⚠ ${video.title} - No file available`);
                
                if (idx === videos.length - 1) {
                    setTimeout(() => {
                        console.log(`\nUpdated ${updated}/${videos.length} videos`);
                        db.close();
                    }, 1000);
                }
            }
        });
    });
});

