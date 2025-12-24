const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { authenticateToken } = require('./auth');
const db = require('../database/init');

// Get all available practical exam slots
router.get('/slots', authenticateToken, (req, res) => {
  const { userId } = req.user;

  db.all(`
    SELECT 
      e.*,
      COUNT(CASE WHEN er.status = 'registered' THEN 1 END) as registered_count,
      (e.limit_count - COUNT(CASE WHEN er.status = 'registered' THEN 1 END)) as remaining_count
    FROM practical_exams e
    LEFT JOIN exam_registrations er ON e.exam_id = er.exam_id AND er.status = 'registered'
    WHERE e.status = 'open' AND e.date >= date('now')
    GROUP BY e.exam_id
    HAVING remaining_count > 0
    ORDER BY e.date, e.start_time
  `, (err, slots) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    // Ensure remaining_count is non-negative
    const normalizedSlots = slots.map(slot => ({
      ...slot,
      remaining_count: Math.max(0, slot.remaining_count || 0),
      registered_count: slot.registered_count || 0
    }));

    // Check if user already has a registration
    db.get('SELECT * FROM exam_registrations WHERE user_id = ? AND status = ?', [userId, 'registered'], (err, registration) => {
      if (err) {
        console.error('Registration check error:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      
      res.json({
        slots: normalizedSlots,
        userRegistration: registration || null
      });
    });
  });
});

// Book a slot
router.post('/book', authenticateToken, (req, res) => {
  const { userId } = req.user;
  const { exam_id } = req.body;

  if (!exam_id) return res.status(400).json({ error: 'Exam ID required' });

  db.serialize(() => {
    // 1. Check if user already has a booking
    db.get('SELECT * FROM exam_registrations WHERE user_id = ? AND status != "cancelled"', [userId], (err, existing) => {
      if (existing) return res.status(400).json({ error: 'คุณมีการจองรอบฝึกปฏิบัติอยู่แล้ว' });

      // 2. Check if slot has space (calculate from registrations)
      db.get(`
        SELECT 
          e.*,
          COUNT(CASE WHEN er.status = 'registered' THEN 1 END) as registered_count,
          (e.limit_count - COUNT(CASE WHEN er.status = 'registered' THEN 1 END)) as remaining_count
        FROM practical_exams e
        LEFT JOIN exam_registrations er ON e.exam_id = er.exam_id AND er.status = 'registered'
        WHERE e.exam_id = ?
        GROUP BY e.exam_id
      `, [exam_id], (err, exam) => {
        if (err) {
          console.error('Exam check error:', err);
          return res.status(500).json({ error: 'Database error' });
        }
        if (!exam) return res.status(404).json({ error: 'ไม่พบรอบการจอง' });
        
        const remaining = Math.max(0, exam.remaining_count || 0);
        if (remaining <= 0) return res.status(400).json({ error: 'รอบนี้เต็มแล้ว' });

        // 3. Register user
        const registrationId = uuidv4();
        
        db.run(
          'INSERT INTO exam_registrations (registration_id, user_id, exam_id, status) VALUES (?, ?, ?, ?)',
          [registrationId, userId, exam_id, 'registered'],
          function(err) {
            if (err) {
              console.error('Registration insert error:', err);
              return res.status(500).json({ error: 'Failed to book' });
            }

            res.json({ message: 'จองรอบฝึกปฏิบัติสำเร็จ', registration_id: registrationId });
          }
        );
      });
    });
  });
});

// Cancel booking
router.post('/cancel', authenticateToken, (req, res) => {
  const { userId } = req.user;
  const { registration_id } = req.body;

  db.get('SELECT * FROM exam_registrations WHERE registration_id = ? AND user_id = ? AND status = ?', [registration_id, userId, 'registered'], (err, reg) => {
    if (err) {
      console.error('Registration check error:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    if (!reg) return res.status(404).json({ error: 'ไม่พบการจองของคุณ' });

    db.run('BEGIN TRANSACTION');
    db.run('UPDATE exam_registrations SET status = ? WHERE registration_id = ?', ['cancelled', registration_id], (err) => {
      if (err) {
        db.run('ROLLBACK');
        console.error('Cancel error:', err);
        return res.status(500).json({ error: 'Failed to cancel' });
      }

      db.run('COMMIT');
      res.json({ message: 'ยกเลิกการจองสำเร็จ' });
    });
  });
});

// Get registrations for a specific exam (Admin/Instructor only)
router.get('/registrations/:examId', authenticateToken, (req, res) => {
  const { examId } = req.params;
  const { role } = req.user;

  // Check if user is admin or instructor
  if (role !== 'admin' && role !== 'instructor') {
    return res.status(403).json({ error: 'Admin or Instructor access required' });
  }

  db.all(`
    SELECT 
      er.registration_id,
      er.status as registration_status,
      er.created_at as registered_at,
      u.user_id,
      u.student_id,
      u.name,
      u.email,
      u.phone,
      u.year_level,
      e.date,
      e.start_time,
      e.end_time
    FROM exam_registrations er
    JOIN users u ON er.user_id = u.user_id
    JOIN practical_exams e ON er.exam_id = e.exam_id
    WHERE er.exam_id = ? AND er.status = 'registered'
    ORDER BY er.created_at ASC
  `, [examId], (err, registrations) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    res.json(registrations);
  });
});

// Get all exam slots with registration counts (Admin/Instructor only)
router.get('/all-slots', authenticateToken, (req, res) => {
  const { role } = req.user;

  // Check if user is admin or instructor
  if (role !== 'admin' && role !== 'instructor') {
    return res.status(403).json({ error: 'Admin or Instructor access required' });
  }

  db.all(`
    SELECT 
      e.*,
      COUNT(CASE WHEN er.status = 'registered' THEN 1 END) as registered_count,
      (e.limit_count - COUNT(CASE WHEN er.status = 'registered' THEN 1 END)) as remaining_count
    FROM practical_exams e
    LEFT JOIN exam_registrations er ON e.exam_id = er.exam_id AND er.status = 'registered'
    WHERE e.date >= date('now')
    GROUP BY e.exam_id
    ORDER BY e.date, e.start_time
  `, (err, slots) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    const normalizedSlots = slots.map(slot => ({
      ...slot,
      remaining_count: Math.max(0, slot.remaining_count || 0),
      registered_count: slot.registered_count || 0
    }));

    res.json(normalizedSlots);
  });
});

module.exports = router;

