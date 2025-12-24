const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { authenticateToken } = require('./auth');
const db = require('../database/init');

// Get user's conversations (inbox)
router.get('/inbox', authenticateToken, (req, res) => {
  // Get distinct conversations
  db.all(
    `SELECT DISTINCT 
       CASE 
         WHEN sender_id = ? THEN receiver_id 
         ELSE sender_id 
       END as other_user_id,
       MAX(created_at) as last_message_at,
       (SELECT content FROM messages 
        WHERE (sender_id = ? AND receiver_id = other_user_id) 
           OR (sender_id = other_user_id AND receiver_id = ?)
        ORDER BY created_at DESC LIMIT 1) as last_message,
       (SELECT COUNT(*) FROM messages 
        WHERE receiver_id = ? AND sender_id = other_user_id AND is_read = 0) as unread_count
     FROM messages
     WHERE sender_id = ? OR receiver_id = ?
     GROUP BY other_user_id
     ORDER BY last_message_at DESC`,
    [req.user.userId, req.user.userId, req.user.userId, req.user.userId, req.user.userId, req.user.userId],
    (err, conversations) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      // Get user details for each conversation
      const promises = conversations.map(conv => {
        return new Promise((resolve) => {
          db.get(
            'SELECT user_id, name, student_id, email FROM users WHERE user_id = ?',
            [conv.other_user_id],
            (err, user) => {
              if (!err && user) {
                resolve({ ...conv, other_user: user });
              } else {
                resolve(conv);
              }
            }
          );
        });
      });

      Promise.all(promises).then(results => {
        res.json(results);
      });
    }
  );
});

// Get messages with a specific user
router.get('/conversation/:userId', authenticateToken, (req, res) => {
  const { userId } = req.params;
  
  db.all(
    `SELECT m.*, 
       sender.name as sender_name, sender.student_id as sender_student_id,
       receiver.name as receiver_name, receiver.student_id as receiver_student_id
     FROM messages m
     LEFT JOIN users sender ON m.sender_id = sender.user_id
     LEFT JOIN users receiver ON m.receiver_id = receiver.user_id
     WHERE (m.sender_id = ? AND m.receiver_id = ?) OR (m.sender_id = ? AND m.receiver_id = ?)
     ORDER BY m.created_at ASC`,
    [req.user.userId, userId, userId, req.user.userId],
    (err, messages) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      // Mark messages as read
      db.run(
        'UPDATE messages SET is_read = 1 WHERE receiver_id = ? AND sender_id = ? AND is_read = 0',
        [req.user.userId, userId]
      );

      res.json(messages);
    }
  );
});

// Send message
router.post('/', authenticateToken, (req, res) => {
  const { receiver_id, subject, content } = req.body;
  
  if (!receiver_id || !content) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const messageId = uuidv4();
  
  db.run(
    `INSERT INTO messages (message_id, sender_id, receiver_id, subject, content)
     VALUES (?, ?, ?, ?, ?)`,
    [messageId, req.user.userId, receiver_id, subject || '', content],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to send message' });
      }

      // Create notification for receiver
      const notifId = uuidv4();
      db.run(
        `INSERT INTO notifications (notification_id, user_id, title, message, type, link)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [notifId, receiver_id, 'ข้อความใหม่', subject || 'ข้อความใหม่', 'message', `/messages/conversation/${req.user.userId}`]
      );
      
      res.json({ message_id: messageId, message: 'Message sent successfully' });
    }
  );
});

// Get unread message count
router.get('/unread-count', authenticateToken, (req, res) => {
  db.get(
    'SELECT COUNT(*) as count FROM messages WHERE receiver_id = ? AND is_read = 0',
    [req.user.userId],
    (err, result) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json({ count: result.count || 0 });
    }
  );
});

// Get all users (for messaging)
router.get('/users', authenticateToken, (req, res) => {
  db.all(
    'SELECT user_id, name, student_id, email, role FROM users WHERE user_id != ? ORDER BY name',
    [req.user.userId],
    (err, users) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(users);
    }
  );
});

module.exports = router;

