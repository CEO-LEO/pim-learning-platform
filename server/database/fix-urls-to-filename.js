const db = require('./init');

console.log('Converting full URLs to filenames...\n');

db.serialize(() => {
    db.all('SELECT video_id, title, url FROM videos', [], (err, videos) => {
        if (err) {
            console.error(err);
            db.close();
            return;
        }

        videos.forEach((video, idx) => {
            if (video.url && video.url.includes('/')) {
                const filename = video.url.split('/').pop().split('?')[0];
                const newUrl = `/uploads/videos/${filename}`;
                
                db.run('UPDATE videos SET url = ? WHERE video_id = ?', [newUrl, video.video_id], (err) => {
                    if (err) {
                        console.error(`Error: ${video.title}`, err);
                    } else {
                        console.log(`✓ ${video.title}`);
                        console.log(`  ${video.url}`);
                        console.log(`  → ${newUrl}\n`);
                    }

                    if (idx === videos.length - 1) {
                        setTimeout(() => {
                            console.log('Done!');
                            db.close();
                        }, 500);
                    }
                });
            }
        });
    });
});

