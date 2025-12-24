const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { authenticateToken } = require('./auth');
const db = require('../database/init');

// Get all rooms
router.get('/list', authenticateToken, (req, res) => {
  db.all('SELECT * FROM rooms WHERE status = "available"', (err, rooms) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json(rooms);
  });
});

// Get room bookings for a specific date
router.get('/bookings/:roomId/:date', authenticateToken, (req, res) => {
  const { roomId, date } = req.params;
  db.all(
    'SELECT * FROM room_bookings WHERE room_id = ? AND booking_date = ? AND status != "cancelled"',
    [roomId, date],
    (err, bookings) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      res.json(bookings);
    }
  );
});

// Book a room
router.post('/book', authenticateToken, (req, res) => {
  const { userId } = req.user;
  const { room_id, booking_date, start_time, end_time } = req.body;

  if (!room_id || !booking_date || !start_time || !end_time) {
    return res.status(400).json({ error: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
  }

  // Check for overlap
  const checkQuery = `
    SELECT * FROM room_bookings 
    WHERE room_id = ? AND booking_date = ? AND status != "cancelled"
    AND (
      (start_time < ? AND end_time > ?) OR
      (start_time < ? AND end_time > ?) OR
      (start_time >= ? AND end_time <= ?)
    )
  `;

  db.get(checkQuery, [room_id, booking_date, end_time, start_time, end_time, start_time, start_time, end_time], (err, overlap) => {
    if (overlap) return res.status(400).json({ error: 'ช่วงเวลานี้ถูกจองแล้ว' });

    const bookingId = uuidv4();
    db.run(
      'INSERT INTO room_bookings (booking_id, room_id, user_id, booking_date, start_time, end_time) VALUES (?, ?, ?, ?, ?, ?)',
      [bookingId, room_id, userId, booking_date, start_time, end_time],
      function(err) {
        if (err) return res.status(500).json({ error: 'Failed to book room' });
        res.json({ message: 'จองห้องสำเร็จ', booking_id: bookingId });
      }
    );
  });
});

// Get user's room bookings
router.get('/my-bookings', authenticateToken, (req, res) => {
  const { userId } = req.user;
  const query = `
    SELECT rb.*, r.name as room_name 
    FROM room_bookings rb
    JOIN rooms r ON rb.room_id = r.room_id
    WHERE rb.user_id = ?
    ORDER BY rb.booking_date DESC, rb.start_time DESC
  `;
  db.all(query, [userId], (err, bookings) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json(bookings);
  });
});

// Cancel room booking
router.post('/cancel', authenticateToken, (req, res) => {
  const { userId } = req.user;
  const { booking_id } = req.body;
  db.run(
    'UPDATE room_bookings SET status = "cancelled" WHERE booking_id = ? AND user_id = ?',
    [booking_id, userId],
    function(err) {
      if (err) return res.status(500).json({ error: 'Failed to cancel booking' });
      res.json({ message: 'ยกเลิกการจองสำเร็จ' });
    }
  );
});

module.exports = router;

