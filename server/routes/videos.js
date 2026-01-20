const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { authenticateToken } = require('./auth');
const db = require('../database/init');

// Get all modules with stats and Pre-test completion
router.get('/modules', authenticateToken, (req, res) => {
  const { year_level, userId } = req.user;
  
  if (!userId) {
    return res.status(401).json({ error: 'ไม่พบข้อมูลผู้ใช้ กรุณาเข้าสู่ระบบใหม่อีกครั้ง' });
  }

  const userYearLevel = year_level || 4; // Default to year 4 to show all modules
  
  db.all(
    'SELECT * FROM modules WHERE year_level <= ? OR year_level IS NULL ORDER BY order_index ASC',
    [userYearLevel],
    (err, modules) => {
      if (err) {
        console.error('[Modules] Database error:', err);
        return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการโหลดข้อมูลหลักสูตร' });
      }

      if (!modules || modules.length === 0) {
        return res.json([]);
      }
      
      const modulesWithStats = modules.map((module) => {
        return new Promise((resolve) => {
          // Check if Pre-test is completed
          db.get(
            `SELECT COUNT(*) as pretest_done FROM quiz_results qr 
             JOIN quizzes q ON qr.quiz_id = q.quiz_id 
             WHERE q.module_id = ? AND q.order_index = 0 AND qr.user_id = ?`,
            [module.module_id, userId],
            (err, result) => {
              if (err) {
                console.error('[Modules] Error checking pretest:', err);
                resolve({ ...module, total_duration: 0, video_count: 0, pretest_completed: false, error: true });
                return;
              }

              const isPretestCompleted = result?.pretest_done > 0;

              // Get videos for this module
              db.all(
                `SELECT video_id, duration, url FROM videos WHERE module_id = ?`,
                [module.module_id],
                (err, videos) => {
                  if (err) {
                    console.error('[Modules] Error fetching videos:', err);
                    resolve({ ...module, total_duration: 0, video_count: 0, pretest_completed: isPretestCompleted, error: true });
                    return;
                  }
                  
                  // Filter only videos with valid URLs
                  const validVideos = videos.filter(v => v.url && v.url.trim() !== '');
                  const totalDuration = validVideos.reduce((sum, video) => sum + (video.duration || 0), 0);
                  
                  resolve({
                    ...module,
                    total_duration: totalDuration,
                    video_count: validVideos.length,
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
      
      Promise.all(modulesWithStats)
        .then((result) => {
          res.json(result);
        })
        .catch((error) => {
          console.error('[Modules] Promise error:', error);
          res.status(500).json({ error: 'เกิดข้อผิดพลาดในการประมวลผลข้อมูล' });
        });
    }
  );
});

// Get videos by module
router.get('/module/:moduleId', authenticateToken, (req, res) => {
  const { moduleId } = req.params;
  const { userId } = req.user;

  if (!moduleId || moduleId.trim() === '') {
    return res.status(400).json({ error: 'ไม่พบรหัสหลักสูตร' });
  }

  if (!userId) {
    return res.status(401).json({ error: 'ไม่พบข้อมูลผู้ใช้ กรุณาเข้าสู่ระบบใหม่อีกครั้ง' });
  }

  // Check if module exists
  db.get('SELECT module_id, title FROM modules WHERE module_id = ?', [moduleId], (err, module) => {
    if (err) {
      console.error('[Videos] Database error checking module:', err);
      return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการตรวจสอบข้อมูลหลักสูตร' });
    }

    if (!module) {
      return res.status(404).json({ error: 'ไม่พบหลักสูตรที่ระบุ' });
    }

    // Get videos with progress
    db.all(
      `SELECT v.*, 
              COALESCE(vp.watch_time, 0) as watch_time,
              COALESCE(vp.is_complete, 0) as is_complete,
              vp.last_watched
       FROM videos v
       LEFT JOIN video_progress vp ON v.video_id = vp.video_id AND vp.user_id = ?
       WHERE v.module_id = ?
       ORDER BY v.order_index ASC`,
      [userId, moduleId],
      (err, videos) => {
        if (err) {
          console.error('[Videos] Database error fetching videos:', err);
          return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการโหลดรายการวิดีโอ' });
        }

        // Calculate watch progress for each video
        const videosWithProgress = videos.map(video => {
          const watchTime = video.watch_time || 0;
          const duration = video.duration || 0;
          const watchProgress = duration > 0 ? Math.min(100, Math.floor((watchTime / duration) * 100)) : 0;
          
          return {
            ...video,
            watch_progress: watchProgress,
            has_url: !!(video.url && video.url.trim() !== '')
          };
        });

        res.json(videosWithProgress);
      }
    );
  });
});

// Update video progress
router.post('/progress', authenticateToken, (req, res) => {
  const { video_id, watch_time, is_complete } = req.body;
  const { userId } = req.user;

  // Validation
  if (!video_id || video_id.trim() === '') {
    return res.status(400).json({ error: 'กรุณาระบุรหัสวิดีโอ' });
  }

  if (!userId) {
    return res.status(401).json({ error: 'ไม่พบข้อมูลผู้ใช้ กรุณาเข้าสู่ระบบใหม่อีกครั้ง' });
  }

  if (watch_time !== undefined && watch_time !== null) {
    const time = parseInt(watch_time);
    if (isNaN(time) || time < 0) {
      return res.status(400).json({ error: 'เวลาที่ดูต้องเป็นตัวเลขที่มากกว่าหรือเท่ากับ 0' });
    }
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
              console.error('[Progress] Database error checking progress:', err);
              return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการตรวจสอบความคืบหน้า' });
            }

            const newWatchTime = watch_time !== undefined ? watch_time : (progress ? progress.watch_time : 0);
            const newIsComplete = is_complete !== undefined ? is_complete : (progress ? progress.is_complete : 0);

            if (progress) {
              // Update existing progress
              db.run(
                'UPDATE video_progress SET watch_time = ?, is_complete = ?, last_watched = CURRENT_TIMESTAMP WHERE progress_id = ?',
                [newWatchTime, newIsComplete, progress.progress_id],
                function(err) {
                  if (err) {
                    console.error('[Progress] Error updating progress:', err);
                    return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการบันทึกความคืบหน้า' });
                  }
                  
                  // Only update learning hours if video is completed
                  if (newIsComplete === 1 && progress.is_complete !== 1) {
                    updateLearningHours(userId, video_id);
                  }
                  
                  res.json({ 
                    message: 'บันทึกความคืบหน้าสำเร็จ',
                    watch_time: newWatchTime,
                    is_complete: newIsComplete,
                    success: true
                  });
                }
              );
            } else {
              // Create new progress
              const progressId = uuidv4();
              db.run(
                'INSERT INTO video_progress (progress_id, user_id, video_id, watch_time, is_complete, last_watched) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)',
                [progressId, userId, video_id, newWatchTime, newIsComplete],
                function(err) {
                  if (err) {
                    console.error('[Progress] Error creating progress:', err);
                    return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการสร้างข้อมูลความคืบหน้า' });
                  }
                  
                  // Only update learning hours if video is completed
                  if (newIsComplete === 1) {
                    updateLearningHours(userId, video_id);
                  }
                  
                  res.json({ 
                    message: 'เริ่มบันทึกความคืบหน้าสำเร็จ',
                    watch_time: newWatchTime,
                    is_complete: newIsComplete,
                    success: true
                  });
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
  const { videoId } = req.params;
  const { userId } = req.user;

  // 🛡️ Pre-test check: Must complete Pre-test (any attempt, passed or failed) before fetching video details
  db.get(
    `SELECT v.*, (SELECT COUNT(*) FROM quiz_results qr JOIN quizzes q ON qr.quiz_id = q.quiz_id WHERE q.module_id = v.module_id AND q.order_index = 0 AND qr.user_id = ?) as pretest_done
     FROM videos v WHERE v.video_id = ?`,
    [userId, videoId],
    (err, video) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      if (!video) return res.status(404).json({ error: 'Video not found' });
      
      if (video.pretest_done === 0) {
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
              title: video.title,
              url: video.url,
              urlType: typeof video.url,
              urlLength: video.url?.length,
              hasUrl: !!video.url,
              urlIsEmpty: !video.url || video.url.trim() === ''
            });
            
            // Warn if video URL is missing or empty
            if (!video.url || video.url.trim() === '') {
              console.warn('[Videos] ⚠️ Video has no URL:', {
                video_id: video.video_id,
                title: video.title,
                module_id: video.module_id
              });
            }
            
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
  if (!userId || !videoId) {
    console.warn('[Learning Hours] Missing userId or videoId');
    return;
  }

  db.get('SELECT module_id, duration FROM videos WHERE video_id = ?', [videoId], (err, video) => {
    if (err) {
      console.error('[Learning Hours] Error fetching video:', err);
      return;
    }
    
    if (!video) {
      console.warn('[Learning Hours] Video not found:', videoId);
      return;
    }

    if (!video.duration || video.duration <= 0) {
      console.warn('[Learning Hours] Video has no valid duration:', videoId);
      return;
    }

    const hours = video.duration / 3600; // Convert seconds to hours

    db.get(
      'SELECT hours_id, hours FROM learning_hours WHERE user_id = ? AND module_id = ?',
      [userId, video.module_id],
      (err, existing) => {
        if (err) {
          console.error('[Learning Hours] Error checking existing hours:', err);
          return;
        }

        if (existing) {
          // Update existing learning hours
          db.run(
            'UPDATE learning_hours SET hours = hours + ?, updated_at = CURRENT_TIMESTAMP WHERE hours_id = ?',
            [hours, existing.hours_id],
            (err) => {
              if (err) {
                console.error('[Learning Hours] Error updating hours:', err);
              } else {
                console.log(`[Learning Hours] Updated: +${hours.toFixed(2)}h for user ${userId} in module ${video.module_id}`);
              }
            }
          );
        } else {
          // Create new learning hours record
          const hoursId = uuidv4();
          db.run(
            'INSERT INTO learning_hours (hours_id, user_id, module_id, hours, updated_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)',
            [hoursId, userId, video.module_id, hours],
            (err) => {
              if (err) {
                console.error('[Learning Hours] Error creating hours:', err);
              } else {
                console.log(`[Learning Hours] Created: ${hours.toFixed(2)}h for user ${userId} in module ${video.module_id}`);
              }
            }
          );
        }
      }
    );
  });
}

// Update video duration (admin only or when video metadata loads)
router.post('/duration', authenticateToken, (req, res) => {
  const { video_id, duration } = req.body;
  
  // Validation
  if (!video_id || video_id.trim() === '') {
    return res.status(400).json({ error: 'กรุณาระบุรหัสวิดีโอ' });
  }

  if (duration === undefined || duration === null) {
    return res.status(400).json({ error: 'กรุณาระบุระยะเวลาวิดีโอ' });
  }

  const durationInt = parseInt(duration);
  if (isNaN(durationInt) || durationInt < 0) {
    return res.status(400).json({ error: 'ระยะเวลาต้องเป็นตัวเลขที่มากกว่าหรือเท่ากับ 0' });
  }

  if (durationInt > 36000) { // Max 10 hours
    return res.status(400).json({ error: 'ระยะเวลาวิดีโอต้องไม่เกิน 10 ชั่วโมง' });
  }

  // Check if video exists
  db.get('SELECT video_id, title FROM videos WHERE video_id = ?', [video_id], (err, video) => {
    if (err) {
      console.error('[Duration] Database error:', err);
      return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการตรวจสอบวิดีโอ' });
    }

    if (!video) {
      return res.status(404).json({ error: 'ไม่พบวิดีโอที่ระบุ' });
    }

    db.run(
      'UPDATE videos SET duration = ? WHERE video_id = ?',
      [durationInt, video_id],
      function(err) {
        if (err) {
          console.error('[Duration] Error updating duration:', err);
          return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการอัพเดตระยะเวลา' });
        }
        
        res.json({ 
          message: 'อัพเดตระยะเวลาวิดีโอสำเร็จ', 
          duration: durationInt,
          duration_minutes: Math.floor(durationInt / 60),
          success: true
        });
      }
    );
  });
});

module.exports = router;
