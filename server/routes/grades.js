const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { authenticateToken } = require('./auth');
const db = require('../database/init');

// Get user's grades
router.get('/my', authenticateToken, (req, res) => {
  db.all(
    `SELECT g.*, 
     m.title as module_title,
     a.title as assignment_title,
     q.title as quiz_title,
     grader.name as graded_by_name
     FROM grades g
     LEFT JOIN modules m ON g.module_id = m.module_id
     LEFT JOIN assignments a ON g.assignment_id = a.assignment_id
     LEFT JOIN quizzes q ON g.quiz_id = q.quiz_id
     LEFT JOIN users grader ON g.graded_by = grader.user_id
     WHERE g.user_id = ?
     ORDER BY g.graded_at DESC`,
    [req.user.userId],
    (err, grades) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(grades);
    }
  );
});

// Get grades for a module
router.get('/module/:moduleId', authenticateToken, (req, res) => {
  const { moduleId } = req.params;
  
  db.all(
    `SELECT g.*, 
     u.name as student_name, u.student_id,
     a.title as assignment_title,
     q.title as quiz_title,
     grader.name as graded_by_name
     FROM grades g
     LEFT JOIN users u ON g.user_id = u.user_id
     LEFT JOIN assignments a ON g.assignment_id = a.assignment_id
     LEFT JOIN quizzes q ON g.quiz_id = q.quiz_id
     LEFT JOIN users grader ON g.graded_by = grader.user_id
     WHERE g.module_id = ?
     ORDER BY u.name, g.graded_at DESC`,
    [moduleId],
    (err, grades) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(grades);
    }
  );
});

// Create/Update grade (admin/instructor only)
router.post('/', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'instructor') {
    return res.status(403).json({ error: 'Permission denied' });
  }

  const { user_id, module_id, assignment_id, quiz_id, exam_id, score, max_score, feedback } = req.body;
  
  if (!user_id || !score || !max_score) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Calculate grade letter
  const percentage = (score / max_score) * 100;
  let gradeLetter = 'F';
  if (percentage >= 90) gradeLetter = 'A';
  else if (percentage >= 80) gradeLetter = 'B';
  else if (percentage >= 70) gradeLetter = 'C';
  else if (percentage >= 60) gradeLetter = 'D';

  // Check if grade already exists
  let checkQuery = 'SELECT grade_id FROM grades WHERE user_id = ?';
  const checkParams = [user_id];
  
  if (assignment_id) {
    checkQuery += ' AND assignment_id = ?';
    checkParams.push(assignment_id);
  } else if (quiz_id) {
    checkQuery += ' AND quiz_id = ?';
    checkParams.push(quiz_id);
  } else if (exam_id) {
    checkQuery += ' AND exam_id = ?';
    checkParams.push(exam_id);
  }

  db.get(checkQuery, checkParams, (err, existing) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (existing) {
      // Update existing grade
      db.run(
        `UPDATE grades 
         SET score = ?, max_score = ?, grade_letter = ?, feedback = ?, graded_by = ?, graded_at = CURRENT_TIMESTAMP
         WHERE grade_id = ?`,
        [score, max_score, gradeLetter, feedback || '', req.user.userId, existing.grade_id],
        function(err) {
          if (err) {
            return res.status(500).json({ error: 'Failed to update grade' });
          }
          res.json({ message: 'Grade updated successfully' });
        }
      );
    } else {
      // Create new grade
      const gradeId = uuidv4();
      
      db.run(
        `INSERT INTO grades (grade_id, user_id, module_id, assignment_id, quiz_id, exam_id, score, max_score, grade_letter, feedback, graded_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [gradeId, user_id, module_id || null, assignment_id || null, quiz_id || null, exam_id || null, score, max_score, gradeLetter, feedback || '', req.user.userId],
        function(err) {
          if (err) {
            return res.status(500).json({ error: 'Failed to create grade' });
          }

          // Create notification
          const notifId = uuidv4();
          db.run(
            `INSERT INTO notifications (notification_id, user_id, title, message, type, link)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [notifId, user_id, 'คะแนนใหม่', `คุณได้รับคะแนนใหม่: ${score}/${max_score} (${gradeLetter})`, 'grade', `/grades`]
          );
          
          res.json({ grade_id: gradeId, message: 'Grade created successfully' });
        }
      );
    }
  });
});

// Get grade summary for user
router.get('/summary/:userId', authenticateToken, (req, res) => {
  const { userId } = req.params;
  
  // Check permission
  if (req.user.userId !== userId && req.user.role !== 'admin' && req.user.role !== 'instructor') {
    return res.status(403).json({ error: 'Permission denied' });
  }

  db.all(
    `SELECT 
       module_id,
       AVG(score * 100.0 / max_score) as average_score,
       COUNT(*) as total_grades
     FROM grades
     WHERE user_id = ?
     GROUP BY module_id`,
    [userId],
    (err, summary) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(summary);
    }
  );
});

module.exports = router;

