const express = require('express');
const router = express.Router();
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');
const { authenticateToken, isAdmin } = require('./auth');
const db = require('../database/init');

// Export all student data to Excel
router.get('/export-students', authenticateToken, isAdmin, (req, res) => {
  const query = `
    SELECT 
      u.student_id as 'รหัสนักศึกษา',
      u.full_name as 'ชื่อ-นามสกุล',
      u.year_level as 'ชั้นปี',
      m.title as 'ชื่อหลักสูตร',
      (SELECT MAX(qr.score) FROM quiz_results qr JOIN quizzes q ON qr.quiz_id = q.quiz_id WHERE qr.user_id = u.user_id AND q.module_id = m.module_id) as 'คะแนนสูงสุด',
      CASE 
        WHEN c.certificate_id IS NOT NULL THEN 'จบหลักสูตร'
        ELSE 'ยังไม่จบ'
      END as 'สถานะการเรียน',
      c.issued_at as 'วันที่เรียนจบ'
    FROM users u
    CROSS JOIN modules m
    LEFT JOIN certificates c ON u.user_id = c.user_id AND m.module_id = c.module_id
    WHERE u.role = 'student'
    ORDER BY u.student_id, m.order_index
  `;

  db.all(query, [], (err, rows) => {
    if (err) {
      console.error('Export error:', err);
      return res.status(500).json({ error: 'Database error during export' });
    }

    try {
      // Create a new workbook and worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(rows);

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, 'รายงานนักศึกษา');

      // Generate buffer
      const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

      // Set headers and send file
      res.setHeader('Content-Disposition', 'attachment; filename=Student_Report.xlsx');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.send(buf);
    } catch (error) {
      console.error('XLSX error:', error);
      res.status(500).json({ error: 'Failed to generate Excel file' });
    }
  });
});

module.exports = router;

