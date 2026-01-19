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

// Helper function to notify admins about new booking
function notifyAdminsAboutBooking(bookingData) {
  // Get all admin users
  db.all(
    'SELECT user_id FROM users WHERE role IN ("admin", "instructor")',
    [],
    (err, admins) => {
      if (err || !admins) return;
      
      // Create notification for each admin
      admins.forEach(admin => {
        const notificationId = uuidv4();
        db.run(
          `INSERT INTO notifications (notification_id, user_id, title, message, type, link) 
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            notificationId,
            admin.user_id,
            '🔔 มีการจองห้องใหม่',
            `${bookingData.userName} (${bookingData.studentId}) จองห้อง ${bookingData.roomName} วันที่ ${bookingData.date} เวลา ${bookingData.startTime}-${bookingData.endTime}`,
            'room_booking',
            `/admin/room-bookings`
          ],
          (notifyErr) => {
            if (notifyErr) console.error('Failed to create notification:', notifyErr);
          }
        );
      });
    }
  );
}

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
        
        // Get user and room details for notification
        db.get(
          `SELECT u.name as user_name, u.student_id, r.name as room_name
           FROM users u, rooms r
           WHERE u.user_id = ? AND r.room_id = ?`,
          [userId, room_id],
          (err, details) => {
            if (!err && details) {
              // Notify all admins about the new booking
              notifyAdminsAboutBooking({
                userName: details.user_name,
                studentId: details.student_id,
                roomName: details.room_name,
                date: booking_date,
                startTime: start_time,
                endTime: end_time
              });
            }
          }
        );
        
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

