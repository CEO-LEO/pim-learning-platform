const express = require('express');
const router = express.Router();
const { authenticateToken } = require('./auth');
const db = require('../database/init');

// Get user's notifications
router.get('/', authenticateToken, (req, res) => {
  const { unread_only } = req.query;
  
  let query = `SELECT * FROM notifications WHERE user_id = ?`;
  const params = [req.user.userId];

  if (unread_only === 'true') {
    query += ' AND is_read = 0';
  }

  query += ' ORDER BY created_at DESC LIMIT 50';

  db.all(query, params, (err, notifications) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(notifications);
  });
});

// Mark notification as read
router.put('/:notificationId/read', authenticateToken, (req, res) => {
  const { notificationId } = req.params;
  
  db.run(
    'UPDATE notifications SET is_read = 1 WHERE notification_id = ? AND user_id = ?',
    [notificationId, req.user.userId],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json({ message: 'Notification marked as read' });
    }
  );
});

// Mark all notifications as read
router.put('/read-all', authenticateToken, (req, res) => {
  db.run(
    'UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0',
    [req.user.userId],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json({ message: 'All notifications marked as read' });
    }
  );
});

// Get unread count
router.get('/unread-count', authenticateToken, (req, res) => {
  db.get(
    'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0',
    [req.user.userId],
    (err, result) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json({ count: result.count || 0 });
    }
  );
});

// Delete notification
router.delete('/:notificationId', authenticateToken, (req, res) => {
  const { notificationId } = req.params;
  
  db.run(
    'DELETE FROM notifications WHERE notification_id = ? AND user_id = ?',
    [notificationId, req.user.userId],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json({ message: 'Notification deleted' });
    }
  );
});

module.exports = router;

