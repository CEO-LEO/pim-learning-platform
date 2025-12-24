const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { authenticateToken } = require('./auth');
const db = require('../database/init');

// Get all available exams
router.get('/available', authenticateToken, (req, res) => {
  db.all(
    `SELECT e.*, 
            COUNT(CASE WHEN er.status = 'registered' THEN 1 END) as registered_count,
            (e.limit_count - COUNT(CASE WHEN er.status = 'registered' THEN 1 END)) as remaining,
            CASE WHEN EXISTS(SELECT 1 FROM exam_registrations er2 WHERE er2.exam_id = e.exam_id AND er2.user_id = ? AND er2.status = 'registered') THEN 1 ELSE 0 END as is_registered
     FROM practical_exams e
     LEFT JOIN exam_registrations er ON e.exam_id = er.exam_id AND er.status = 'registered'
     WHERE e.status = 'open' AND e.date >= date('now')
     GROUP BY e.exam_id
     ORDER BY e.date, e.start_time`,
    [req.user.userId],
    (err, exams) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      // Ensure remaining is calculated correctly and is a number
      const normalizedExams = exams.map(exam => ({
        ...exam,
        limit: exam.limit_count || 0,
        remaining: Math.max(0, exam.remaining || 0),
        registered_count: exam.registered_count || 0
      }));
      res.json(normalizedExams);
    }
  );
});

// Register for exam
router.post('/register', authenticateToken, (req, res) => {
  const { exam_id } = req.body;
  const { userId } = req.user;

  if (!exam_id) {
    return res.status(400).json({ error: 'Exam ID required' });
  }

  // Check if exam exists and has slots
  db.get('SELECT * FROM practical_exams WHERE exam_id = ?', [exam_id], (err, exam) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!exam) {
      return res.status(404).json({ error: 'Exam not found' });
    }

    // Check if already registered (only check active registrations)
    db.get(
      'SELECT * FROM exam_registrations WHERE user_id = ? AND exam_id = ? AND status = ?',
      [userId, exam_id, 'registered'],
      (err, existing) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }
        if (existing) {
          return res.status(400).json({ error: 'Already registered for this exam' });
        }

        // Check available slots (only count active registrations)
        db.get(
          'SELECT COUNT(*) as count FROM exam_registrations WHERE exam_id = ? AND status = ?',
          [exam_id, 'registered'],
          (err, result) => {
            if (err) {
              return res.status(500).json({ error: 'Database error' });
            }

            const registeredCount = result.count || 0;
            if (registeredCount >= exam.limit_count) {
              return res.status(400).json({ error: 'Exam is full' });
            }

            // Register
            const registrationId = uuidv4();
            db.run(
              'INSERT INTO exam_registrations (registration_id, user_id, exam_id, status) VALUES (?, ?, ?, ?)',
              [registrationId, userId, exam_id, 'registered'],
              function(err) {
                if (err) {
                  return res.status(500).json({ error: 'Failed to register' });
                }

                res.json({
                  registration_id: registrationId,
                  message: 'Successfully registered for exam'
                });
              }
            );
          }
        );
      }
    );
  });
});

// Get user's exam registrations
router.get('/my-registrations', authenticateToken, (req, res) => {
  const { userId } = req.user;

  db.all(
    `SELECT er.*, er.status, e.date, e.start_time, e.end_time, e.status as exam_status,
            ar.score, ar.passed, ar.feedback
     FROM exam_registrations er
     JOIN practical_exams e ON er.exam_id = e.exam_id
     LEFT JOIN assessment_results ar ON er.user_id = ar.user_id AND er.exam_id = ar.exam_id
     WHERE er.user_id = ?
     ORDER BY e.date, e.start_time`,
    [userId],
    (err, registrations) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      // Ensure status field is present (use er.status as primary)
      const normalizedRegistrations = registrations.map(reg => ({
        ...reg,
        status: reg.status || reg.exam_status || 'unknown'
      }));
      res.json(normalizedRegistrations);
    }
  );
});

// Cancel registration
router.post('/cancel/:registrationId', authenticateToken, (req, res) => {
  const { registrationId } = req.params;
  const { userId } = req.user;

  db.get(
    'SELECT * FROM exam_registrations WHERE registration_id = ? AND user_id = ?',
    [registrationId, userId],
    (err, registration) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (!registration) {
        return res.status(404).json({ error: 'Registration not found' });
      }

      // Only allow cancellation of active registrations
      if (registration.status !== 'registered') {
        return res.status(400).json({ error: 'Cannot cancel a registration that is not active' });
      }

      db.run(
        'UPDATE exam_registrations SET status = ? WHERE registration_id = ?',
        ['cancelled', registrationId],
        function(err) {
          if (err) {
            return res.status(500).json({ error: 'Failed to cancel' });
          }

          res.json({ message: 'Registration cancelled' });
        }
      );
    }
  );
});

module.exports = router;

