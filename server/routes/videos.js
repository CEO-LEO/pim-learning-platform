const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { authenticateToken } = require('./auth');
const db = require('../database/init');

// Get all modules with stats and Pre-test completion
router.get('/modules', authenticateToken, (req, res) => {
  const { year_level, userId } = req.user;
  
  db.all(
    'SELECT * FROM modules WHERE year_level <= ? OR year_level IS NULL ORDER BY order_index',
    [year_level || 3],
    (err, modules) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      
      const modulesWithStats = modules.map((module) => {
        return new Promise((resolve) => {
          // Check if Pre-test is completed - use COUNT(*) to match video route logic
          db.get(
            `SELECT (SELECT COUNT(*) FROM quiz_results qr JOIN quizzes q ON qr.quiz_id = q.quiz_id WHERE q.module_id = ? AND q.order_index = 0 AND qr.user_id = ?) as pretest_done`,
            [module.module_id, userId],
            (err, result) => {
              const isPretestCompleted = result?.pretest_done > 0;

              db.all(
                `SELECT duration, url FROM videos WHERE module_id = ? AND url IS NOT NULL AND url != ''`,
                [module.module_id],
                (err, videos) => {
                  if (err) {
                    resolve({ ...module, total_duration: 0, video_count: 0, pretest_completed: isPretestCompleted });
                    return;
                  }
                  
                  const totalDuration = videos.reduce((sum, video) => sum + (video.duration || 0), 0);
                  const videoCount = videos.length;
                  
                  resolve({
                    ...module,
                    total_duration: totalDuration,
                    video_count: videoCount,
                    total_minutes: Math.floor(totalDuration / 60),
                    total_hours: Math.floor(totalDuration / 3600),
                    pretest_completed: isPretestCompleted
                  });
                }
              );
            }
          );
        });
      });
      
      Promise.all(modulesWithStats).then((result) => {
        res.json(result);
      });
    }
  );
});

// Get videos by module
router.get('/module/:moduleId', authenticateToken, (req, res) => {
  const { moduleId } = req.params;
  const { userId } = req.user;

  db.all(
    `SELECT v.*, 
            COALESCE(vp.watch_time, 0) as watch_time,
            COALESCE(vp.is_complete, 0) as is_complete
     FROM videos v
     LEFT JOIN video_progress vp ON v.video_id = vp.video_id AND vp.user_id = ?
     WHERE v.module_id = ?
     ORDER BY v.order_index`,
    [userId, moduleId],
    (err, videos) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(videos);
    }
  );
});

// Update video progress
router.post('/progress', authenticateToken, (req, res) => {
  const { video_id, watch_time, is_complete } = req.body;
  const { userId } = req.user;

  if (!video_id) {
    return res.status(400).json({ error: 'Video ID required' });
  }

  // 🛡️ Pre-test check: Must complete Pre-test (any attempt, passed or failed) before updating video progress
  db.get(
    `SELECT v.module_id, v.order_index, (SELECT COUNT(*) FROM quiz_results qr JOIN quizzes q ON qr.quiz_id = q.quiz_id WHERE q.module_id = v.module_id AND q.order_index = 0 AND qr.user_id = ?) as pretest_done
     FROM videos v WHERE v.video_id = ?`,
    [userId, video_id],
    (err, info) => {
      if (err || !info) return res.status(500).json({ error: 'Database error' });
      if (info.pretest_done === 0) {
        return res.status(403).json({ error: 'กรุณาทำแบบทดสอบก่อนเรียน (Pre-test) ให้เสร็จก่อนเข้าชมวิดีโอ', requires_pretest: true, module_id: info.module_id });
      }

      // 🛡️ Check if previous videos are completed (must watch videos in order)
      if (info.order_index > 1) {
        db.get(
          `SELECT vp.is_complete 
           FROM videos v
           LEFT JOIN video_progress vp ON v.video_id = vp.video_id AND vp.user_id = ?
           WHERE v.module_id = ? AND v.order_index < ?
           ORDER BY v.order_index DESC
           LIMIT 1`,
          [userId, info.module_id, info.order_index],
          (err, prevVideo) => {
            if (err) {
              return res.status(500).json({ error: 'Database error' });
            }
            
            // If previous video exists and is not completed, block progress update
            if (prevVideo && prevVideo.is_complete !== 1) {
              return res.status(403).json({ 
                error: `กรุณาดูวิดีโอก่อนหน้านี้ให้ครบ 100% ก่อนดูวิดีโอนี้`, 
                requires_previous_video: true,
                module_id: info.module_id 
              });
            }
            
            // Continue with normal flow
            updateProgress();
          }
        );
      } else {
        // First video, no need to check previous videos
        updateProgress();
      }

      function updateProgress() {
        // Check if progress exists
        db.get(
          'SELECT * FROM video_progress WHERE user_id = ? AND video_id = ?',
          [userId, video_id],
          (err, progress) => {
            if (err) {
              return res.status(500).json({ error: 'Database error' });
            }

            if (progress) {
              // Update existing progress
              db.run(
                'UPDATE video_progress SET watch_time = ?, is_complete = ?, last_watched = CURRENT_TIMESTAMP WHERE progress_id = ?',
                [watch_time || progress.watch_time, is_complete !== undefined ? is_complete : progress.is_complete, progress.progress_id],
                function(err) {
                  if (err) {
                    return res.status(500).json({ error: 'Failed to update progress' });
                  }
                  updateLearningHours(userId, video_id);
                  res.json({ message: 'Progress updated' });
                }
              );
            } else {
              // Create new progress
              const progressId = uuidv4();
              db.run(
                'INSERT INTO video_progress (progress_id, user_id, video_id, watch_time, is_complete) VALUES (?, ?, ?, ?, ?)',
                [progressId, userId, video_id, watch_time || 0, is_complete || 0],
                function(err) {
                  if (err) {
                    return res.status(500).json({ error: 'Failed to save progress' });
                  }
                  updateLearningHours(userId, video_id);
                  res.json({ message: 'Progress saved' });
                }
              );
            }
          }
        );
      }
    }
  );
});

// Get video by ID
router.get('/:videoId', authenticateToken, (req, res) => {
  const fs = require('fs');
  const { videoId } = req.params;
  const { userId } = req.user;
  // #region agent log
  const logData = {location:'videos.js:152',message:'GET /:videoId entry',data:{videoId,userId,hasUser:!!req.user},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D,E'};
  try{fs.appendFileSync('c:\\PIMX\\.cursor\\debug.log',JSON.stringify(logData)+'\n');}catch(e){}
  // #endregion

  // 🛡️ Pre-test check: Must complete Pre-test (any attempt, passed or failed) before fetching video details
  db.get(
    `SELECT v.*, (SELECT COUNT(*) FROM quiz_results qr JOIN quizzes q ON qr.quiz_id = q.quiz_id WHERE q.module_id = v.module_id AND q.order_index = 0 AND qr.user_id = ?) as pretest_done
     FROM videos v WHERE v.video_id = ?`,
    [userId, videoId],
    (err, video) => {
      // #region agent log
      const logData2 = {location:'videos.js:161',message:'Database query result',data:{hasError:!!err,errorMsg:err?.message,hasVideo:!!video,pretestDone:video?.pretest_done,moduleId:video?.module_id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D,E'};
      try{fs.appendFileSync('c:\\PIMX\\.cursor\\debug.log',JSON.stringify(logData2)+'\n');}catch(e){}
      // #endregion
      if (err) return res.status(500).json({ error: 'Database error' });
      if (!video) return res.status(404).json({ error: 'Video not found' });
      
      if (video.pretest_done === 0) {
        // #region agent log
        const logData3 = {location:'videos.js:165',message:'Pre-test check failed',data:{pretestDone:video.pretest_done,moduleId:video.module_id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'};
        try{fs.appendFileSync('c:\\PIMX\\.cursor\\debug.log',JSON.stringify(logData3)+'\n');}catch(e){}
        // #endregion
        return res.status(403).json({ error: 'กรุณาทำแบบทดสอบก่อนเรียน (Pre-test) ให้เสร็จก่อนเข้าชมวิดีโอ', requires_pretest: true, module_id: video.module_id });
      }

      // 🛡️ Check if previous videos are completed (must watch videos in order)
      if (video.order_index > 1) {
        db.get(
          `SELECT vp.is_complete 
           FROM videos v
           LEFT JOIN video_progress vp ON v.video_id = vp.video_id AND vp.user_id = ?
           WHERE v.module_id = ? AND v.order_index < ?
           ORDER BY v.order_index DESC
           LIMIT 1`,
          [userId, video.module_id, video.order_index],
          (err, prevVideo) => {
            if (err) {
              return res.status(500).json({ error: 'Database error' });
            }
            
            // If previous video exists and is not completed, block access
            if (prevVideo && prevVideo.is_complete !== 1) {
              return res.status(403).json({ 
                error: `กรุณาดูวิดีโอก่อนหน้านี้ให้ครบ 100% ก่อนดูวิดีโอนี้`, 
                requires_previous_video: true,
                module_id: video.module_id 
              });
            }
            
            // Continue with normal flow
            fetchVideoProgress();
          }
        );
      } else {
        // First video, no need to check previous videos
        fetchVideoProgress();
      }

      function fetchVideoProgress() {
        db.get(
          `SELECT watch_time, is_complete FROM video_progress WHERE user_id = ? AND video_id = ?`,
          [userId, videoId],
          (err, progress) => {
            if (err) {
              return res.status(500).json({ error: 'Database error' });
            }
            
            // Calculate watch progress percentage
            const watchTime = progress?.watch_time || 0;
            const isComplete = progress?.is_complete || 0;
            const duration = video.duration || 0;
            const watchProgress = duration > 0 ? Math.min(100, Math.floor((watchTime / duration) * 100)) : 0;
            
            // Log video URL for debugging
            console.log('[Videos] Returning video data:', {
              video_id: video.video_id,
              url: video.url,
              urlType: typeof video.url,
              urlLength: video.url?.length,
              hasUrl: !!video.url
            });
            
            // #region agent log
            const fs = require('fs');
            const path = require('path');
            const logPath = path.join(process.cwd(), '.cursor', 'debug.log');
            const logData = {location:'videos.js:263',message:'Returning video data',data:{video_id:video.video_id,url:video.url,urlType:typeof video.url,urlLength:video.url?.length,hasUrl:!!video.url},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'};
            console.log('[DEBUG]', JSON.stringify(logData));
            try{const logDir = path.dirname(logPath); if(!fs.existsSync(logDir))fs.mkdirSync(logDir,{recursive:true}); fs.appendFileSync(logPath,JSON.stringify(logData)+'\n');}catch(e){console.error('[DEBUG] Log write error:',e.message);}
            // #endregion
            
            res.json({
              ...video,
              watch_time: watchTime,
              is_complete: isComplete,
              watch_progress: watchProgress
            });
          }
        );
      }
    }
  );
});

// Helper function to update learning hours
function updateLearningHours(userId, videoId) {
  db.get('SELECT module_id, duration FROM videos WHERE video_id = ?', [videoId], (err, video) => {
    if (err || !video) return;

    const hours = video.duration / 3600; // Convert seconds to hours

    db.get(
      'SELECT * FROM learning_hours WHERE user_id = ? AND module_id = ?',
      [userId, video.module_id],
      (err, existing) => {
        if (err) return;

        if (existing) {
          db.run(
            'UPDATE learning_hours SET hours = hours + ?, updated_at = CURRENT_TIMESTAMP WHERE hours_id = ?',
            [hours, existing.hours_id]
          );
        } else {
          const hoursId = uuidv4();
          db.run(
            'INSERT INTO learning_hours (hours_id, user_id, module_id, hours) VALUES (?, ?, ?, ?)',
            [hoursId, userId, video.module_id, hours]
          );
        }
      }
    );
  });
}

// Update video duration (admin only or when video metadata loads)
router.post('/duration', authenticateToken, (req, res) => {
  const { video_id, duration } = req.body;
  
  if (!video_id || !duration) {
    return res.status(400).json({ error: 'Video ID and duration required' });
  }

  db.run(
    'UPDATE videos SET duration = ? WHERE video_id = ?',
    [Math.floor(duration), video_id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to update duration' });
      }
      res.json({ message: 'Duration updated', duration: Math.floor(duration) });
    }
  );
});

module.exports = router;

