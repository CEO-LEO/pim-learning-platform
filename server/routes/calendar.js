const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { authenticateToken } = require('./auth');
const db = require('../database/init');

// Get all events
router.get('/', authenticateToken, (req, res) => {
  const { start_date, end_date, module_id } = req.query;
  
  let query = `SELECT e.*, u.name as created_by_name, m.title as module_title
               FROM calendar_events e
               LEFT JOIN users u ON e.created_by = u.user_id
               LEFT JOIN modules m ON e.module_id = m.module_id
               WHERE 1=1`;
  const params = [];

  if (start_date) {
    query += ' AND e.event_date >= ?';
    params.push(start_date);
  }

  if (end_date) {
    query += ' AND e.event_date <= ?';
    params.push(end_date);
  }

  if (module_id) {
    query += ' AND (e.module_id = ? OR e.module_id IS NULL)';
    params.push(module_id);
  }

  query += ' ORDER BY e.event_date ASC';

  db.all(query, params, (err, events) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(events);
  });
});

// Get single event
router.get('/:eventId', authenticateToken, (req, res) => {
  const { eventId } = req.params;
  
  db.get(
    `SELECT e.*, u.name as created_by_name, m.title as module_title
     FROM calendar_events e
     LEFT JOIN users u ON e.created_by = u.user_id
     LEFT JOIN modules m ON e.module_id = m.module_id
     WHERE e.event_id = ?`,
    [eventId],
    (err, event) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (!event) {
        return res.status(404).json({ error: 'Event not found' });
      }
      res.json(event);
    }
  );
});

// Create event (admin/instructor only)
router.post('/', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'instructor') {
    return res.status(403).json({ error: 'Permission denied' });
  }

  const { title, description, event_date, end_date, event_type, module_id } = req.body;
  
  if (!title || !event_date) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const eventId = uuidv4();
  
  db.run(
    `INSERT INTO calendar_events (event_id, title, description, event_date, end_date, event_type, module_id, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      eventId,
      title,
      description || '',
      event_date,
      end_date || event_date,
      event_type || 'general',
      module_id || null,
      req.user.userId
    ],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to create event' });
      }

      // Create notifications for students
      db.all('SELECT user_id FROM users WHERE role = "student"', [], (err, students) => {
        if (!err && students) {
          students.forEach(student => {
            const notifId = uuidv4();
            db.run(
              `INSERT INTO notifications (notification_id, user_id, title, message, type, link)
               VALUES (?, ?, ?, ?, ?, ?)`,
              [notifId, student.user_id, 'กิจกรรมใหม่', `มีกิจกรรมใหม่: ${title}`, 'calendar', `/calendar`]
            );
          });
        }
      });
      
      res.json({ event_id: eventId, message: 'Event created successfully' });
    }
  );
});

// Update event (admin/instructor only)
router.put('/:eventId', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'instructor') {
    return res.status(403).json({ error: 'Permission denied' });
  }

  const { eventId } = req.params;
  const { title, description, event_date, end_date, event_type, module_id } = req.body;
  
  db.run(
    `UPDATE calendar_events 
     SET title = ?, description = ?, event_date = ?, end_date = ?, event_type = ?, module_id = ?
     WHERE event_id = ?`,
    [
      title,
      description || '',
      event_date,
      end_date || event_date,
      event_type || 'general',
      module_id || null,
      eventId
    ],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to update event' });
      }
      res.json({ message: 'Event updated successfully' });
    }
  );
});

// Delete event (admin/instructor only)
router.delete('/:eventId', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'instructor') {
    return res.status(403).json({ error: 'Permission denied' });
  }

  const { eventId } = req.params;
  
  db.run('DELETE FROM calendar_events WHERE event_id = ?', [eventId], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Failed to delete event' });
    }
    res.json({ message: 'Event deleted successfully' });
  });
});

module.exports = router;

