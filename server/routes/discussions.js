const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { authenticateToken } = require('./auth');
const db = require('../database/init');

// Get all discussions for a module
router.get('/module/:moduleId', authenticateToken, (req, res) => {
  const { moduleId } = req.params;
  
  db.all(
    `SELECT d.*, u.name as created_by_name, u.student_id,
     (SELECT COUNT(*) FROM discussion_replies WHERE discussion_id = d.discussion_id) as reply_count,
     (SELECT MAX(created_at) FROM discussion_replies WHERE discussion_id = d.discussion_id) as last_reply_at
     FROM discussions d
     LEFT JOIN users u ON d.created_by = u.user_id
     WHERE d.module_id = ?
     ORDER BY d.is_pinned DESC, d.created_at DESC`,
    [moduleId],
    (err, discussions) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(discussions);
    }
  );
});

// Get single discussion with replies
router.get('/:discussionId', authenticateToken, (req, res) => {
  const { discussionId } = req.params;
  
  db.get(
    `SELECT d.*, u.name as created_by_name, u.student_id
     FROM discussions d
     LEFT JOIN users u ON d.created_by = u.user_id
     WHERE d.discussion_id = ?`,
    [discussionId],
    (err, discussion) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (!discussion) {
        return res.status(404).json({ error: 'Discussion not found' });
      }

      // Get replies
      db.all(
        `SELECT r.*, u.name as user_name, u.student_id
         FROM discussion_replies r
         LEFT JOIN users u ON r.user_id = u.user_id
         WHERE r.discussion_id = ?
         ORDER BY r.created_at ASC`,
        [discussionId],
        (err, replies) => {
          if (err) {
            return res.status(500).json({ error: 'Database error' });
          }
          res.json({ ...discussion, replies });
        }
      );
    }
  );
});

// Create discussion
router.post('/', authenticateToken, (req, res) => {
  const { module_id, title, content } = req.body;
  
  if (!module_id || !title || !content) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const discussionId = uuidv4();
  
  db.run(
    `INSERT INTO discussions (discussion_id, module_id, title, content, created_by)
     VALUES (?, ?, ?, ?, ?)`,
    [discussionId, module_id, title, content, req.user.userId],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to create discussion' });
      }
      res.json({ discussion_id: discussionId, message: 'Discussion created successfully' });
    }
  );
});

// Reply to discussion
router.post('/:discussionId/reply', authenticateToken, (req, res) => {
  const { discussionId } = req.params;
  const { content } = req.body;
  
  if (!content) {
    return res.status(400).json({ error: 'Content is required' });
  }

  const replyId = uuidv4();
  
  db.run(
    `INSERT INTO discussion_replies (reply_id, discussion_id, user_id, content)
     VALUES (?, ?, ?, ?)`,
    [replyId, discussionId, req.user.userId, content],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to post reply' });
      }
      
      // Update discussion updated_at
      db.run(
        'UPDATE discussions SET updated_at = CURRENT_TIMESTAMP WHERE discussion_id = ?',
        [discussionId]
      );
      
      res.json({ reply_id: replyId, message: 'Reply posted successfully' });
    }
  );
});

// Pin/unpin discussion (admin/instructor only)
router.post('/:discussionId/pin', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'instructor') {
    return res.status(403).json({ error: 'Permission denied' });
  }

  const { discussionId } = req.params;
  
  db.get(
    'SELECT is_pinned FROM discussions WHERE discussion_id = ?',
    [discussionId],
    (err, discussion) => {
      if (err || !discussion) {
        return res.status(500).json({ error: 'Discussion not found' });
      }

      const newPinStatus = discussion.is_pinned === 1 ? 0 : 1;
      
      db.run(
        'UPDATE discussions SET is_pinned = ? WHERE discussion_id = ?',
        [newPinStatus, discussionId],
        function(err) {
          if (err) {
            return res.status(500).json({ error: 'Failed to update pin status' });
          }
          res.json({ message: `Discussion ${newPinStatus === 1 ? 'pinned' : 'unpinned'} successfully` });
        }
      );
    }
  );
});

// Delete discussion (admin/instructor or creator)
router.delete('/:discussionId', authenticateToken, (req, res) => {
  const { discussionId } = req.params;
  
  db.get(
    'SELECT created_by FROM discussions WHERE discussion_id = ?',
    [discussionId],
    (err, discussion) => {
      if (err || !discussion) {
        return res.status(404).json({ error: 'Discussion not found' });
      }

      if (req.user.role !== 'admin' && req.user.role !== 'instructor' && discussion.created_by !== req.user.userId) {
        return res.status(403).json({ error: 'Permission denied' });
      }

      // Delete replies first
      db.run('DELETE FROM discussion_replies WHERE discussion_id = ?', [discussionId], (err) => {
        if (err) {
          return res.status(500).json({ error: 'Failed to delete replies' });
        }

        // Delete discussion
        db.run('DELETE FROM discussions WHERE discussion_id = ?', [discussionId], (err) => {
          if (err) {
            return res.status(500).json({ error: 'Failed to delete discussion' });
          }
          res.json({ message: 'Discussion deleted successfully' });
        });
      });
    }
  );
});

module.exports = router;

