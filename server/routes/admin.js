const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { authenticateToken } = require('./auth');
const db = require('../database/init');

// Middleware to check admin role
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin' && req.user.role !== 'instructor') {
    return res.status(403).json({ error: 'Admin or Instructor access required' });
  }
  next();
};

// Get all users (admin only)
router.get('/users', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  db.all(
    'SELECT user_id, student_id, name, email, year_level, role, created_at FROM users ORDER BY created_at DESC',
    [],
    (err, users) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(users);
    }
  );
});

// Get all modules
router.get('/modules', authenticateToken, requireAdmin, (req, res) => {
  db.all(
    'SELECT * FROM modules ORDER BY order_index ASC',
    [],
    (err, modules) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(modules);
    }
  );
});

// Create module
router.post('/modules', authenticateToken, requireAdmin, (req, res) => {
  const { title, description, year_level, order_index } = req.body;

  if (!title) {
    return res.status(400).json({ error: 'Title required' });
  }

  const moduleId = uuidv4();
  db.run(
    'INSERT INTO modules (module_id, title, description, year_level, order_index) VALUES (?, ?, ?, ?, ?)',
    [moduleId, title, description || '', year_level || null, order_index || 0],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to create module' });
      }
      res.json({ module_id: moduleId, message: 'Module created successfully' });
    }
  );
});

// Update module
router.put('/modules/:moduleId', authenticateToken, requireAdmin, (req, res) => {
  const { moduleId } = req.params;
  const { title, description, year_level, order_index } = req.body;

  db.run(
    'UPDATE modules SET title = ?, description = ?, year_level = ?, order_index = ? WHERE module_id = ?',
    [title, description || '', year_level || null, order_index || 0, moduleId],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to update module' });
      }
      res.json({ message: 'Module updated successfully' });
    }
  );
});

// Delete module
router.delete('/modules/:moduleId', authenticateToken, requireAdmin, (req, res) => {
  const { moduleId } = req.params;

  db.run('DELETE FROM modules WHERE module_id = ?', [moduleId], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Failed to delete module' });
    }
    res.json({ message: 'Module deleted successfully' });
  });
});

// Create video
router.post('/videos', authenticateToken, requireAdmin, (req, res) => {
  const { module_id, title, url, duration, order_index } = req.body;

  if (!module_id || !title) {
    return res.status(400).json({ error: 'Module ID and title required' });
  }

  const videoId = uuidv4();
  db.run(
    'INSERT INTO videos (video_id, module_id, title, url, duration, order_index) VALUES (?, ?, ?, ?, ?, ?)',
    [videoId, module_id, title, url || '', duration || 0, order_index || 0],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to create video' });
      }
      res.json({ video_id: videoId, message: 'Video created successfully' });
    }
  );
});

// Create quiz
router.post('/quizzes', authenticateToken, requireAdmin, (req, res) => {
  const { module_id, title, time_limit, passing_score, allow_retake, questions } = req.body;

  if (!module_id || !title) {
    return res.status(400).json({ error: 'Module ID and title required' });
  }

  const quizId = uuidv4();
  db.run(
    'INSERT INTO quizzes (quiz_id, module_id, title, time_limit, passing_score, allow_retake) VALUES (?, ?, ?, ?, ?, ?)',
    [quizId, module_id, title, time_limit || 30, passing_score || 70, allow_retake !== undefined ? allow_retake : 1],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to create quiz' });
      }

      // Add questions if provided
      if (questions && Array.isArray(questions)) {
        questions.forEach((q, index) => {
          const questionId = uuidv4();
          db.run(
            'INSERT INTO quiz_questions (question_id, quiz_id, question, type, options, correct_answer, order_index) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [
              questionId,
              quizId,
              q.question,
              q.type || 'multiple_choice',
              JSON.stringify(q.options || []),
              q.correct_answer,
              index + 1,
            ]
          );
        });
      }

      res.json({ quiz_id: quizId, message: 'Quiz created successfully' });
    }
  );
});

// Create practical exam
router.post('/exams', authenticateToken, requireAdmin, (req, res) => {
  const { date, start_time, end_time, limit_count } = req.body;

  if (!date || !start_time || !end_time || !limit_count) {
    return res.status(400).json({ error: 'All exam fields required' });
  }

  const examId = uuidv4();
  db.run(
    'INSERT INTO practical_exams (exam_id, date, start_time, end_time, limit_count, remaining_count, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [examId, date, start_time, end_time, limit_count, limit_count, 'open'],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to create exam' });
      }
      res.json({ exam_id: examId, message: 'Exam created successfully' });
    }
  );
});

// Generate weekly practical exam slots (Monday-Friday)
router.post('/practical/generate-weekly', authenticateToken, requireAdmin, (req, res) => {
  const { weeks = 12, start_time = '09:00', end_time = '12:00', afternoon_start = '13:00', afternoon_end = '16:00', limit_count = 100 } = req.body;

  const today = new Date();
  const slots = [];
  const timeSlots = [
    { start: start_time, end: end_time },
    { start: afternoon_start, end: afternoon_end }
  ];
  
  // Start from next Monday
  const daysUntilMonday = (8 - today.getDay()) % 7 || 7;
  const startDate = new Date(today);
  startDate.setDate(today.getDate() + daysUntilMonday);
  
  // Generate slots for specified weeks
  for (let week = 0; week < weeks; week++) {
    for (let day = 0; day < 5; day++) { // Monday (0) to Friday (4)
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + (week * 7) + day);
      
      // Skip if date is in the past
      if (currentDate < today) continue;
      
      const dateStr = currentDate.toISOString().split('T')[0];
      
      // Create slots for each time slot
      timeSlots.forEach((timeSlot) => {
        slots.push({
          date: dateStr,
          start: timeSlot.start,
          end: timeSlot.end
        });
      });
    }
  }

  let created = 0;
  let skipped = 0;
  let errors = 0;

  db.serialize(() => {
    db.run('BEGIN TRANSACTION');
    
    slots.forEach((exam, index) => {
      // Check if slot already exists
      db.get(
        'SELECT exam_id FROM practical_exams WHERE date = ? AND start_time = ? AND end_time = ?',
        [exam.date, exam.start, exam.end],
        (err, existing) => {
          if (err) {
            errors++;
            return;
          }

          if (existing) {
            skipped++;
          } else {
            const examId = uuidv4();
            db.run(
              'INSERT INTO practical_exams (exam_id, date, start_time, end_time, limit_count, remaining_count, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
              [examId, exam.date, exam.start, exam.end, limit_count, limit_count, 'open'],
              function(insertErr) {
                if (insertErr) {
                  errors++;
                } else {
                  created++;
                }
              }
            );
          }

          // Commit transaction when all slots are processed
          if (index === slots.length - 1) {
            setTimeout(() => {
              db.run('COMMIT', (commitErr) => {
                if (commitErr) {
                  console.error('Transaction commit error:', commitErr);
                  db.run('ROLLBACK');
                  return res.status(500).json({ error: 'Failed to create slots' });
                }
                res.json({
                  message: 'สร้างรอบการจองสำเร็จ',
                  created,
                  skipped,
                  errors,
                  total: slots.length
                });
              });
            }, 100);
          }
        }
      );
    });
  });
});

// Submit assessment result
router.post('/assessments', authenticateToken, requireAdmin, (req, res) => {
  const { user_id, exam_id, score, passed, feedback } = req.body;

  if (!user_id || !exam_id || score === undefined || passed === undefined) {
    return res.status(400).json({ error: 'All assessment fields required' });
  }

  const assessmentId = uuidv4();
  db.run(
    'INSERT INTO assessment_results (assessment_id, user_id, exam_id, score, passed, feedback, assessed_by) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [assessmentId, user_id, exam_id, score, passed ? 1 : 0, feedback || '', req.user.userId],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to create assessment' });
      }
      res.json({ assessment_id: assessmentId, message: 'Assessment submitted successfully' });
    }
  );
});

module.exports = router;

