const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { authenticateToken } = require('./auth');
const db = require('../database/init');

// Get user's certificates
router.get('/my', authenticateToken, (req, res) => {
  db.all(
    `SELECT c.*, m.title as module_title, m.description as module_description,
     issuer.name as issued_by_name
     FROM certificates c
     LEFT JOIN modules m ON c.module_id = m.module_id
     LEFT JOIN users issuer ON c.issued_by = issuer.user_id
     WHERE c.user_id = ?
     ORDER BY c.issued_at DESC`,
    [req.user.userId],
    (err, certificates) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(certificates);
    }
  );
});

// Get certificate by ID
router.get('/:certificateId', authenticateToken, (req, res) => {
  const { certificateId } = req.params;
  
  db.get(
    `SELECT c.*, m.title as module_title, m.description as module_description,
     u.name as student_name, u.student_id,
     issuer.name as issued_by_name
     FROM certificates c
     LEFT JOIN modules m ON c.module_id = m.module_id
     LEFT JOIN users u ON c.user_id = u.user_id
     LEFT JOIN users issuer ON c.issued_by = issuer.user_id
     WHERE c.certificate_id = ?`,
    [certificateId],
    (err, certificate) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (!certificate) {
        return res.status(404).json({ error: 'Certificate not found' });
      }

      // Check if user has permission to view
      if (certificate.user_id !== req.user.userId && req.user.role !== 'admin' && req.user.role !== 'instructor') {
        return res.status(403).json({ error: 'Permission denied' });
      }

      res.json(certificate);
    }
  );
});

// Issue certificate (admin/instructor only)
router.post('/issue', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'instructor') {
    return res.status(403).json({ error: 'Permission denied' });
  }

  const { user_id, module_id } = req.body;
  
  if (!user_id || !module_id) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Check if certificate already exists
  db.get(
    'SELECT * FROM certificates WHERE user_id = ? AND module_id = ?',
    [user_id, module_id],
    (err, existing) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (existing) {
        return res.status(400).json({ error: 'Certificate already issued' });
      }

      const certificateId = uuidv4();
      const certificateNumber = `PIM-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      
      db.run(
        `INSERT INTO certificates (certificate_id, user_id, module_id, certificate_number, issued_by)
         VALUES (?, ?, ?, ?, ?)`,
        [certificateId, user_id, module_id, certificateNumber, req.user.userId],
        function(err) {
          if (err) {
            return res.status(500).json({ error: 'Failed to issue certificate' });
          }

          // Create notification
          const notifId = uuidv4();
          db.run(
            `INSERT INTO notifications (notification_id, user_id, title, message, type, link)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [notifId, user_id, 'ได้รับใบประกาศนียบัตร', 'คุณได้รับใบประกาศนียบัตรใหม่', 'certificate', `/certificates/${certificateId}`]
          );
          
          res.json({
            certificate_id: certificateId,
            certificate_number: certificateNumber,
            message: 'Certificate issued successfully'
          });
        }
      );
    }
  );
});

// Get all certificates (admin/instructor only)
router.get('/', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'instructor') {
    return res.status(403).json({ error: 'Permission denied' });
  }

  db.all(
    `SELECT c.*, m.title as module_title,
     u.name as student_name, u.student_id,
     issuer.name as issued_by_name
     FROM certificates c
     LEFT JOIN modules m ON c.module_id = m.module_id
     LEFT JOIN users u ON c.user_id = u.user_id
     LEFT JOIN users issuer ON c.issued_by = issuer.user_id
     ORDER BY c.issued_at DESC`,
    [],
    (err, certificates) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(certificates);
    }
  );
});

module.exports = router;

