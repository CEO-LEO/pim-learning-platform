const express = require('express');
const router = express.Router();
const { authenticateToken } = require('./auth');
const db = require('../database/init');

// Get student analytics
router.get('/student', authenticateToken, (req, res) => {
  const { userId } = req.user;

  // Get learning hours by module
  db.all(
    `SELECT m.module_id, m.title, COALESCE(lh.hours, 0) as hours
     FROM modules m
     LEFT JOIN learning_hours lh ON m.module_id = lh.module_id AND lh.user_id = ?
     ORDER BY m.order_index`,
    [userId],
    (err, hoursData) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      // Get video progress
      db.all(
        `SELECT v.module_id, 
                COUNT(v.video_id) as total_videos,
                COUNT(CASE WHEN vp.is_complete = 1 THEN 1 END) as completed_videos
         FROM videos v
         LEFT JOIN video_progress vp ON v.video_id = vp.video_id AND vp.user_id = ?
         GROUP BY v.module_id`,
        [userId],
        (err, videoProgress) => {
          if (err) {
            return res.status(500).json({ error: 'Database error' });
          }

          // Get quiz results
          db.all(
            `SELECT q.module_id, 
                    COUNT(qr.result_id) as quiz_attempts,
                    AVG(qr.score) as avg_score,
                    COUNT(CASE WHEN qr.passed = 1 THEN 1 END) as passed_quizzes
             FROM quizzes q
             LEFT JOIN quiz_results qr ON q.quiz_id = qr.quiz_id AND qr.user_id = ?
             GROUP BY q.module_id`,
            [userId],
            (err, quizData) => {
              if (err) {
                return res.status(500).json({ error: 'Database error' });
              }

              // Get exam registrations
              db.all(
                `SELECT COUNT(*) as total_registrations,
                        COUNT(CASE WHEN ar.passed = 1 THEN 1 END) as passed_exams,
                        COUNT(CASE WHEN ar.passed = 0 THEN 1 END) as failed_exams
                 FROM exam_registrations er
                 LEFT JOIN assessment_results ar ON er.user_id = ar.user_id AND er.exam_id = ar.exam_id
                 WHERE er.user_id = ? AND er.status = 'registered'`,
                [userId],
                (err, examData) => {
                  if (err) {
                    return res.status(500).json({ error: 'Database error' });
                  }

                  // Calculate total hours
                  const totalHours = hoursData.reduce((sum, item) => sum + item.hours, 0);

                  res.json({
                    learning_hours: {
                      by_module: hoursData,
                      total: totalHours
                    },
                    video_progress: videoProgress,
                    quiz_results: quizData,
                    exam_statistics: examData[0] || { total_registrations: 0, passed_exams: 0, failed_exams: 0 }
                  });
                }
              );
            }
          );
        }
      );
    }
  );
});

// Get dashboard summary
router.get('/dashboard', authenticateToken, (req, res) => {
  const { userId } = req.user;

  // Total learning hours
  db.get(
    'SELECT SUM(hours) as total_hours FROM learning_hours WHERE user_id = ?',
    [userId],
    (err, hoursResult) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      // Completed modules
      db.all(
        `SELECT m.module_id, m.title,
                COUNT(v.video_id) as total_videos,
                COUNT(CASE WHEN vp.is_complete = 1 THEN 1 END) as completed_videos
         FROM modules m
         LEFT JOIN videos v ON m.module_id = v.module_id
         LEFT JOIN video_progress vp ON v.video_id = vp.video_id AND vp.user_id = ?
         GROUP BY m.module_id
         HAVING COUNT(v.video_id) > 0`,
        [userId],
        (err, modules) => {
          if (err) {
            return res.status(500).json({ error: 'Database error' });
          }

          // Upcoming exams
          db.all(
            `SELECT e.*, er.status as registration_status
             FROM exam_registrations er
             JOIN practical_exams e ON er.exam_id = e.exam_id
             WHERE er.user_id = ? AND er.status = 'registered' AND e.date >= date('now')
             ORDER BY e.date, e.start_time
             LIMIT 5`,
            [userId],
            (err, upcomingExams) => {
              if (err) {
                return res.status(500).json({ error: 'Database error' });
              }

              // Recent quiz results
              db.all(
                `SELECT qr.*, q.title as quiz_title, m.title as module_title
                 FROM quiz_results qr
                 JOIN quizzes q ON qr.quiz_id = q.quiz_id
                 JOIN modules m ON q.module_id = m.module_id
                 WHERE qr.user_id = ?
                 ORDER BY qr.completed_at DESC
                 LIMIT 5`,
                [userId],
                (err, recentQuizzes) => {
                  if (err) {
                    return res.status(500).json({ error: 'Database error' });
                  }

                  // Recent evaluations
                  db.all(
                    `SELECT e.*, m.title as module_title
                     FROM evaluations e
                     JOIN modules m ON e.module_id = m.module_id
                     WHERE e.user_id = ?
                     ORDER BY e.submitted_at DESC
                     LIMIT 5`,
                    [userId],
                    (err, recentEvaluations) => {
                      if (err) {
                        return res.status(500).json({ error: 'Database error' });
                      }

                      res.json({
                        total_hours: hoursResult.total_hours || 0,
                        modules: modules.map(m => ({
                          ...m,
                          completion_rate: m.total_videos > 0 ? (m.completed_videos / m.total_videos) * 100 : 0
                        })),
                        upcoming_exams: upcomingExams,
                        recent_quizzes: recentQuizzes,
                        recent_evaluations: recentEvaluations.map(e => ({
                          ...e,
                          answers: JSON.parse(e.answers || '{}')
                        }))
                      });
                    }
                  );
                }
              );
            }
          );
        }
      );
    }
  );
});

module.exports = router;

