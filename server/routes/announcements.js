const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { authenticateToken } = require('./auth');
const db = require('../database/init');

// Get all announcements
router.get('/', authenticateToken, (req, res) => {
  const { module_id, target_audience } = req.query;
  
  let query = `SELECT a.*, u.name as created_by_name
               FROM announcements a
               LEFT JOIN users u ON a.created_by = u.user_id
               WHERE (expires_at IS NULL OR expires_at > datetime('now'))`;
  const params = [];

  if (module_id) {
    query += ' AND (a.module_id = ? OR a.module_id IS NULL)';
    params.push(module_id);
  }

  if (target_audience) {
    query += ' AND (a.target_audience = ? OR a.target_audience = "all")';
    params.push(target_audience);
  } else {
    // For students, show all or student-specific
    if (req.user.role === 'student') {
      query += ' AND (a.target_audience = "all" OR a.target_audience = "student")';
    }
  }

  query += ' ORDER BY a.is_important DESC, a.created_at DESC';

  db.all(query, params, (err, announcements) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(announcements);
  });
});

// Get single announcement
router.get('/:announcementId', authenticateToken, (req, res) => {
  const { announcementId } = req.params;
  
  db.get(
    `SELECT a.*, u.name as created_by_name
     FROM announcements a
     LEFT JOIN users u ON a.created_by = u.user_id
     WHERE a.announcement_id = ?`,
    [announcementId],
    (err, announcement) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (!announcement) {
        return res.status(404).json({ error: 'Announcement not found' });
      }
      res.json(announcement);
    }
  );
});

// Create announcement (admin/instructor only)
router.post('/', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'instructor') {
    return res.status(403).json({ error: 'Permission denied' });
  }

  const { title, content, target_audience, module_id, expires_at, is_important } = req.body;
  
  if (!title || !content) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const announcementId = uuidv4();
  
  db.run(
    `INSERT INTO announcements (announcement_id, title, content, target_audience, module_id, expires_at, is_important, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      announcementId,
      title,
      content,
      target_audience || 'all',
      module_id || null,
      expires_at || null,
      is_important ? 1 : 0,
      req.user.userId
    ],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to create announcement' });
      }

      // Create notifications for target audience
      let userQuery = 'SELECT user_id FROM users WHERE 1=1';
      const userParams = [];
      
      if (target_audience && target_audience !== 'all') {
        userQuery += ' AND role = ?';
        userParams.push(target_audience);
      }

      db.all(userQuery, userParams, (err, users) => {
        if (!err && users) {
          users.forEach(user => {
            const notifId = uuidv4();
            db.run(
              `INSERT INTO notifications (notification_id, user_id, title, message, type, link)
               VALUES (?, ?, ?, ?, ?, ?)`,
              [notifId, user.user_id, 'ประกาศใหม่', title, 'announcement', `/announcements/${announcementId}`]
            );
          });
        }
      });
      
      res.json({ announcement_id: announcementId, message: 'Announcement created successfully' });
    }
  );
});

// Update announcement (admin/instructor only)
router.put('/:announcementId', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'instructor') {
    return res.status(403).json({ error: 'Permission denied' });
  }

  const { announcementId } = req.params;
  const { title, content, target_audience, module_id, expires_at, is_important } = req.body;
  
  db.run(
    `UPDATE announcements 
     SET title = ?, content = ?, target_audience = ?, module_id = ?, expires_at = ?, is_important = ?
     WHERE announcement_id = ?`,
    [
      title,
      content,
      target_audience || 'all',
      module_id || null,
      expires_at || null,
      is_important ? 1 : 0,
      announcementId
    ],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to update announcement' });
      }
      res.json({ message: 'Announcement updated successfully' });
    }
  );
});

// Delete announcement (admin/instructor only)
router.delete('/:announcementId', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'instructor') {
    return res.status(403).json({ error: 'Permission denied' });
  }

  const { announcementId } = req.params;
  
  db.run('DELETE FROM announcements WHERE announcement_id = ?', [announcementId], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Failed to delete announcement' });
    }
    res.json({ message: 'Announcement deleted successfully' });
  });
});

module.exports = router;

