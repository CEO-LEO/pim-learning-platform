const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { authenticateToken } = require('./auth');
const db = require('../database/init');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/assignments/',
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

// Get all assignments for a module
router.get('/module/:moduleId', authenticateToken, (req, res) => {
  const { moduleId } = req.params;
  
  db.all(
    `SELECT a.*, u.name as created_by_name,
     (SELECT COUNT(*) FROM assignment_submissions WHERE assignment_id = a.assignment_id AND user_id = ?) as submitted
     FROM assignments a
     LEFT JOIN users u ON a.created_by = u.user_id
     WHERE a.module_id = ?
     ORDER BY a.created_at DESC`,
    [req.user.userId, moduleId],
    (err, assignments) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(assignments);
    }
  );
});

// Get single assignment
router.get('/:assignmentId', authenticateToken, (req, res) => {
  const { assignmentId } = req.params;
  
  db.get(
    `SELECT a.*, u.name as created_by_name
     FROM assignments a
     LEFT JOIN users u ON a.created_by = u.user_id
     WHERE a.assignment_id = ?`,
    [assignmentId],
    (err, assignment) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (!assignment) {
        return res.status(404).json({ error: 'Assignment not found' });
      }
      res.json(assignment);
    }
  );
});

// Create assignment (admin/instructor only)
router.post('/', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'instructor') {
    return res.status(403).json({ error: 'Permission denied' });
  }

  const { module_id, title, description, due_date, max_score } = req.body;
  
  if (!module_id || !title) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const assignmentId = uuidv4();
  
  db.run(
    `INSERT INTO assignments (assignment_id, module_id, title, description, due_date, max_score, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [assignmentId, module_id, title, description || '', due_date || null, max_score || 100, req.user.userId],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to create assignment' });
      }
      
      // Create notification for students
      db.all('SELECT user_id FROM users WHERE role = "student"', [], (err, students) => {
        if (!err && students) {
          students.forEach(student => {
            const notifId = uuidv4();
            db.run(
              `INSERT INTO notifications (notification_id, user_id, title, message, type, link)
               VALUES (?, ?, ?, ?, ?, ?)`,
              [notifId, student.user_id, 'งานใหม่', `มีงานใหม่: ${title}`, 'assignment', `/assignments/${assignmentId}`]
            );
          });
        }
      });
      
      res.json({ assignment_id: assignmentId, message: 'Assignment created successfully' });
    }
  );
});

// Submit assignment
router.post('/:assignmentId/submit', authenticateToken, upload.single('file'), (req, res) => {
  const { assignmentId } = req.params;
  const { content } = req.body;
  const filePath = req.file ? req.file.path : null;

  // Check if already submitted
  db.get(
    'SELECT * FROM assignment_submissions WHERE assignment_id = ? AND user_id = ?',
    [assignmentId, req.user.userId],
    (err, existing) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      const submissionId = uuidv4();
      
      if (existing) {
        // Update existing submission
        db.run(
          `UPDATE assignment_submissions 
           SET content = ?, file_path = ?, submitted_at = CURRENT_TIMESTAMP, status = 'submitted'
           WHERE submission_id = ?`,
          [content || '', filePath, existing.submission_id],
          function(err) {
            if (err) {
              return res.status(500).json({ error: 'Failed to update submission' });
            }
            res.json({ message: 'Submission updated successfully' });
          }
        );
      } else {
        // Create new submission
        db.run(
          `INSERT INTO assignment_submissions (submission_id, assignment_id, user_id, content, file_path, status)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [submissionId, assignmentId, req.user.userId, content || '', filePath, 'submitted'],
          function(err) {
            if (err) {
              return res.status(500).json({ error: 'Failed to submit assignment' });
            }
            res.json({ message: 'Assignment submitted successfully' });
          }
        );
      }
    }
  );
});

// Get submissions for an assignment (instructor/admin only)
router.get('/:assignmentId/submissions', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'instructor') {
    return res.status(403).json({ error: 'Permission denied' });
  }

  db.all(
    `SELECT s.*, u.name as student_name, u.student_id
     FROM assignment_submissions s
     JOIN users u ON s.user_id = u.user_id
     WHERE s.assignment_id = ?
     ORDER BY s.submitted_at DESC`,
    [req.params.assignmentId],
    (err, submissions) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(submissions);
    }
  );
});

// Grade assignment (instructor/admin only)
router.post('/:assignmentId/grade/:submissionId', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'instructor') {
    return res.status(403).json({ error: 'Permission denied' });
  }

  const { score, feedback } = req.body;
  
  db.run(
    `UPDATE assignment_submissions 
     SET score = ?, feedback = ?, graded_by = ?, graded_at = CURRENT_TIMESTAMP, status = 'graded'
     WHERE submission_id = ?`,
    [score, feedback || '', req.user.userId, req.params.submissionId],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to grade assignment' });
      }
      
      // Get submission details for notification
      db.get(
        'SELECT user_id, assignment_id FROM assignment_submissions WHERE submission_id = ?',
        [req.params.submissionId],
        (err, submission) => {
          if (!err && submission) {
            const notifId = uuidv4();
            db.run(
              `INSERT INTO notifications (notification_id, user_id, title, message, type, link)
               VALUES (?, ?, ?, ?, ?, ?)`,
              [notifId, submission.user_id, 'งานได้รับการตรวจแล้ว', `งานของคุณได้รับการตรวจแล้ว`, 'grade', `/assignments/${submission.assignment_id}`]
            );
          }
        }
      );
      
      res.json({ message: 'Assignment graded successfully' });
    }
  );
});

// Get user's submissions
router.get('/my/submissions', authenticateToken, (req, res) => {
  db.all(
    `SELECT s.*, a.title as assignment_title, a.due_date, a.max_score
     FROM assignment_submissions s
     JOIN assignments a ON s.assignment_id = a.assignment_id
     WHERE s.user_id = ?
     ORDER BY s.submitted_at DESC`,
    [req.user.userId],
    (err, submissions) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(submissions);
    }
  );
});

module.exports = router;

