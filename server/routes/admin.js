const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { authenticateToken } = require('./auth');
const db = require('../database/init');

// Middleware to check admin role
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin' && req.user.role !== 'instructor') {
    return res.status(403).json({ error: 'Admin or Instructor access required' });
  }
  next();
};

// Get all users (admin only)
router.get('/users', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  db.all(
    'SELECT user_id, student_id, name, email, year_level, role, created_at FROM users ORDER BY created_at DESC',
    [],
    (err, users) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(users);
    }
  );
});

// Get all modules
router.get('/modules', authenticateToken, requireAdmin, (req, res) => {
  db.all(
    'SELECT * FROM modules ORDER BY order_index ASC',
    [],
    (err, modules) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(modules);
    }
  );
});

// Create module
router.post('/modules', authenticateToken, requireAdmin, (req, res) => {
  const { title, description, objectives, year_level, order_index } = req.body;

  // Validation
  if (!title || title.trim() === '') {
    return res.status(400).json({ error: 'กรุณาระบุชื่อหลักสูตร' });
  }

  if (title.length > 200) {
    return res.status(400).json({ error: 'ชื่อหลักสูตรต้องไม่เกิน 200 ตัวอักษร' });
  }

  if (description && description.length > 1000) {
    return res.status(400).json({ error: 'คำอธิบายต้องไม่เกิน 1,000 ตัวอักษร' });
  }

  if (year_level !== null && year_level !== undefined) {
    const year = parseInt(year_level);
    if (isNaN(year) || year < 1 || year > 4) {
      return res.status(400).json({ error: 'ชั้นปีต้องอยู่ระหว่าง 1-4' });
    }
  }

  if (order_index !== null && order_index !== undefined) {
    const order = parseInt(order_index);
    if (isNaN(order) || order < 0) {
      return res.status(400).json({ error: 'ลำดับต้องเป็นตัวเลขที่มากกว่าหรือเท่ากับ 0' });
    }
  }

  // Check for duplicate title
  db.get('SELECT module_id FROM modules WHERE title = ?', [title.trim()], (err, existing) => {
    if (err) {
      return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการตรวจสอบข้อมูล' });
    }
    
    if (existing) {
      return res.status(400).json({ error: 'มีหลักสูตรชื่อนี้อยู่แล้ว กรุณาใช้ชื่ออื่น' });
    }

    const moduleId = uuidv4();
    db.run(
      'INSERT INTO modules (module_id, title, description, objectives, year_level, order_index) VALUES (?, ?, ?, ?, ?, ?)',
      [moduleId, title.trim(), description ? description.trim() : '', objectives ? objectives.trim() : '', year_level || null, order_index || 0],
      function(err) {
        if (err) {
          console.error('Error creating module:', err);
          return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการสร้างหลักสูตร' });
        }
        
        res.json({ 
          module_id: moduleId, 
          message: 'สร้างหลักสูตรสำเร็จ',
          success: true
        });
      }
    );
  });
});

// Update module
router.put('/modules/:moduleId', authenticateToken, requireAdmin, (req, res) => {
  const { moduleId } = req.params;
  const { title, description, objectives, year_level, order_index } = req.body;

  // Validation
  if (!title || title.trim() === '') {
    return res.status(400).json({ error: 'กรุณาระบุชื่อหลักสูตร' });
  }

  if (title.length > 200) {
    return res.status(400).json({ error: 'ชื่อหลักสูตรต้องไม่เกิน 200 ตัวอักษร' });
  }

  if (description && description.length > 1000) {
    return res.status(400).json({ error: 'คำอธิบายต้องไม่เกิน 1,000 ตัวอักษร' });
  }

  if (year_level !== null && year_level !== undefined) {
    const year = parseInt(year_level);
    if (isNaN(year) || year < 1 || year > 4) {
      return res.status(400).json({ error: 'ชั้นปีต้องอยู่ระหว่าง 1-4' });
    }
  }

  if (order_index !== null && order_index !== undefined) {
    const order = parseInt(order_index);
    if (isNaN(order) || order < 0) {
      return res.status(400).json({ error: 'ลำดับต้องเป็นตัวเลขที่มากกว่าหรือเท่ากับ 0' });
    }
  }

  // Check if module exists
  db.get('SELECT module_id FROM modules WHERE module_id = ?', [moduleId], (err, module) => {
    if (err) {
      return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการตรวจสอบข้อมูล' });
    }
    
    if (!module) {
      return res.status(404).json({ error: 'ไม่พบหลักสูตรที่ต้องการแก้ไข' });
    }

    // Update module
    db.run(
      'UPDATE modules SET title = ?, description = ?, objectives = ?, year_level = ?, order_index = ? WHERE module_id = ?',
      [title.trim(), description ? description.trim() : '', objectives ? objectives.trim() : '', year_level || null, order_index || 0, moduleId],
      function(err) {
        if (err) {
          console.error('Error updating module:', err);
          return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการอัพเดตหลักสูตร' });
        }
        
        if (this.changes === 0) {
          return res.status(404).json({ error: 'ไม่พบหลักสูตรที่ต้องการแก้ไข' });
        }
        
        res.json({ 
          message: 'บันทึกการแก้ไขหลักสูตรสำเร็จ',
          module_id: moduleId,
          success: true
        });
      }
    );
  });
});

// Delete module
router.delete('/modules/:moduleId', authenticateToken, requireAdmin, (req, res) => {
  const { moduleId } = req.params;

  // Check if module has videos
  db.get('SELECT COUNT(*) as count FROM videos WHERE module_id = ?', [moduleId], (err, result) => {
    if (err) {
      return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการตรวจสอบข้อมูล' });
    }

    if (result.count > 0) {
      return res.status(400).json({ 
        error: `ไม่สามารถลบหลักสูตรได้ เนื่องจากมีวิดีโอ ${result.count} รายการ กรุณาลบวิดีโอทั้งหมดก่อน` 
      });
    }

    // Check if module has quizzes
    db.get('SELECT COUNT(*) as count FROM quizzes WHERE module_id = ?', [moduleId], (err, result) => {
      if (err) {
        return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการตรวจสอบข้อมูล' });
      }

      if (result.count > 0) {
        return res.status(400).json({ 
          error: `ไม่สามารถลบหลักสูตรได้ เนื่องจากมีแบบทดสอบ ${result.count} รายการ กรุณาลบแบบทดสอบทั้งหมดก่อน` 
        });
      }

      // Delete module
      db.run('DELETE FROM modules WHERE module_id = ?', [moduleId], function(err) {
        if (err) {
          console.error('Error deleting module:', err);
          return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการลบหลักสูตร' });
        }
        
        if (this.changes === 0) {
          return res.status(404).json({ error: 'ไม่พบหลักสูตรที่ต้องการลบ' });
        }
        
        res.json({ 
          message: 'ลบหลักสูตรสำเร็จ',
          success: true
        });
      });
    });
  });
});

// Create video
router.post('/videos', authenticateToken, requireAdmin, (req, res) => {
  const { module_id, title, url, duration, order_index } = req.body;

  // Validation
  if (!module_id || module_id.trim() === '') {
    return res.status(400).json({ error: 'กรุณาระบุหลักสูตร' });
  }

  if (!title || title.trim() === '') {
    return res.status(400).json({ error: 'กรุณาระบุชื่อวิดีโอ' });
  }

  if (title.length > 300) {
    return res.status(400).json({ error: 'ชื่อวิดีโอต้องไม่เกิน 300 ตัวอักษร' });
  }

  if (duration !== null && duration !== undefined) {
    const dur = parseInt(duration);
    if (isNaN(dur) || dur < 0) {
      return res.status(400).json({ error: 'ระยะเวลาต้องเป็นตัวเลขที่มากกว่าหรือเท่ากับ 0' });
    }
  }

  // Check if module exists
  db.get('SELECT module_id FROM modules WHERE module_id = ?', [module_id], (err, module) => {
    if (err) {
      return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการตรวจสอบข้อมูล' });
    }
    
    if (!module) {
      return res.status(404).json({ error: 'ไม่พบหลักสูตรที่ระบุ' });
    }

    const videoId = uuidv4();
    db.run(
      'INSERT INTO videos (video_id, module_id, title, url, duration, order_index) VALUES (?, ?, ?, ?, ?, ?)',
      [videoId, module_id, title.trim(), url || '', duration || 0, order_index || 0],
      function(err) {
        if (err) {
          console.error('Error creating video:', err);
          return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการสร้างวิดีโอ' });
        }
        
        res.json({ 
          video_id: videoId, 
          message: 'เพิ่มวิดีโอสำเร็จ',
          success: true
        });
      }
    );
  });
});

// Update video
router.put('/videos/:videoId', authenticateToken, requireAdmin, (req, res) => {
  const { videoId } = req.params;
  const { title, url, duration, order_index } = req.body;

  // Validation
  if (!title || title.trim() === '') {
    return res.status(400).json({ error: 'กรุณาระบุชื่อวิดีโอ' });
  }

  if (title.length > 300) {
    return res.status(400).json({ error: 'ชื่อวิดีโอต้องไม่เกิน 300 ตัวอักษร' });
  }

  if (duration !== null && duration !== undefined) {
    const dur = parseInt(duration);
    if (isNaN(dur) || dur < 0) {
      return res.status(400).json({ error: 'ระยะเวลาต้องเป็นตัวเลขที่มากกว่าหรือเท่ากับ 0' });
    }
  }

  // Check if video exists
  db.get('SELECT video_id FROM videos WHERE video_id = ?', [videoId], (err, video) => {
    if (err) {
      return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการตรวจสอบข้อมูล' });
    }
    
    if (!video) {
      return res.status(404).json({ error: 'ไม่พบวิดีโอที่ต้องการแก้ไข' });
    }

    db.run(
      'UPDATE videos SET title = ?, url = ?, duration = ?, order_index = ? WHERE video_id = ?',
      [title.trim(), url, duration || 0, order_index || 0, videoId],
      function(err) {
        if (err) {
          console.error('Error updating video:', err);
          return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการอัพเดตวิดีโอ' });
        }
        
        if (this.changes === 0) {
          return res.status(404).json({ error: 'ไม่พบวิดีโอที่ต้องการแก้ไข' });
        }
        
        res.json({ 
          message: 'บันทึกการแก้ไขวิดีโอสำเร็จ',
          success: true
        });
      }
    );
  });
});

// Delete video
router.delete('/videos/:videoId', authenticateToken, requireAdmin, (req, res) => {
  const { videoId } = req.params;

  // Check if video has progress records
  db.get('SELECT COUNT(*) as count FROM video_progress WHERE video_id = ?', [videoId], (err, result) => {
    if (err) {
      return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการตรวจสอบข้อมูล' });
    }

    // Delete video (cascade delete progress if exists)
    if (result.count > 0) {
      // Delete progress records first
      db.run('DELETE FROM video_progress WHERE video_id = ?', [videoId], (err) => {
        if (err) {
          console.error('Error deleting video progress:', err);
          return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการลบข้อมูลความคืบหน้า' });
        }

        // Then delete video
        deleteVideo();
      });
    } else {
      deleteVideo();
    }

    function deleteVideo() {
      db.run('DELETE FROM videos WHERE video_id = ?', [videoId], function(err) {
        if (err) {
          console.error('Error deleting video:', err);
          return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการลบวิดีโอ' });
        }
        
        if (this.changes === 0) {
          return res.status(404).json({ error: 'ไม่พบวิดีโอที่ต้องการลบ' });
        }
        
        res.json({ 
          message: 'ลบวิดีโอสำเร็จ',
          success: true
        });
      });
    }
  });
});

// Create quiz
router.post('/quizzes', authenticateToken, requireAdmin, (req, res) => {
  const { module_id, title, time_limit, passing_score, allow_retake, order_index, questions } = req.body;

  // Validation
  if (!module_id || module_id.trim() === '') {
    return res.status(400).json({ error: 'กรุณาระบุหลักสูตร' });
  }

  if (!title || title.trim() === '') {
    return res.status(400).json({ error: 'กรุณาระบุชื่อแบบทดสอบ' });
  }

  if (title.length > 300) {
    return res.status(400).json({ error: 'ชื่อแบบทดสอบต้องไม่เกิน 300 ตัวอักษร' });
  }

  const timeLimit = parseInt(time_limit);
  if (isNaN(timeLimit) || timeLimit < 1 || timeLimit > 180) {
    return res.status(400).json({ error: 'เวลาในการทำแบบทดสอบต้องอยู่ระหว่าง 1-180 นาที' });
  }

  const passingScore = parseInt(passing_score);
  if (isNaN(passingScore) || passingScore < 0 || passingScore > 100) {
    return res.status(400).json({ error: 'คะแนนผ่านต้องอยู่ระหว่าง 0-100' });
  }

  // Check if module exists
  db.get('SELECT module_id FROM modules WHERE module_id = ?', [module_id], (err, module) => {
    if (err) {
      return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการตรวจสอบข้อมูล' });
    }
    
    if (!module) {
      return res.status(404).json({ error: 'ไม่พบหลักสูตรที่ระบุ' });
    }

    const quizId = uuidv4();
    db.run(
      'INSERT INTO quizzes (quiz_id, module_id, title, time_limit, passing_score, allow_retake, order_index) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [quizId, module_id, title.trim(), timeLimit, passingScore, allow_retake !== undefined ? allow_retake : 1, order_index || 1],
      function(err) {
        if (err) {
          console.error('Error creating quiz:', err);
          return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการสร้างแบบทดสอบ' });
        }

        // Add questions if provided
        if (questions && Array.isArray(questions) && questions.length > 0) {
          let questionCount = 0;
          let questionErrors = 0;

          questions.forEach((q, index) => {
            if (!q.question || !q.correct_answer) {
              questionErrors++;
              return;
            }

            const questionId = uuidv4();
            db.run(
              'INSERT INTO quiz_questions (question_id, quiz_id, question, type, options, correct_answer, order_index) VALUES (?, ?, ?, ?, ?, ?, ?)',
              [
                questionId,
                quizId,
                q.question,
                q.type || 'multiple_choice',
                JSON.stringify(q.options || []),
                q.correct_answer,
                index + 1,
              ],
              (err) => {
                if (!err) questionCount++;
              }
            );
          });

          setTimeout(() => {
            res.json({ 
              quiz_id: quizId, 
              message: `สร้างแบบทดสอบสำเร็จ${questionCount > 0 ? ` พร้อมคำถาม ${questionCount} ข้อ` : ''}`,
              success: true,
              question_count: questionCount
            });
          }, 100);
        } else {
          res.json({ 
            quiz_id: quizId, 
            message: 'สร้างแบบทดสอบสำเร็จ (ยังไม่มีคำถาม กรุณาเพิ่มคำถามในภายหลัง)',
            success: true,
            question_count: 0
          });
        }
      }
    );
  });
});

// Update quiz
router.put('/quizzes/:quizId', authenticateToken, requireAdmin, (req, res) => {
  const { quizId } = req.params;
  const { title, time_limit, passing_score, allow_retake, order_index } = req.body;

  // Validation
  if (!title || title.trim() === '') {
    return res.status(400).json({ error: 'กรุณาระบุชื่อแบบทดสอบ' });
  }

  if (title.length > 300) {
    return res.status(400).json({ error: 'ชื่อแบบทดสอบต้องไม่เกิน 300 ตัวอักษร' });
  }

  const timeLimit = parseInt(time_limit);
  if (isNaN(timeLimit) || timeLimit < 1 || timeLimit > 180) {
    return res.status(400).json({ error: 'เวลาในการทำแบบทดสอบต้องอยู่ระหว่าง 1-180 นาที' });
  }

  const passingScore = parseInt(passing_score);
  if (isNaN(passingScore) || passingScore < 0 || passingScore > 100) {
    return res.status(400).json({ error: 'คะแนนผ่านต้องอยู่ระหว่าง 0-100' });
  }

  // Check if quiz exists
  db.get('SELECT quiz_id FROM quizzes WHERE quiz_id = ?', [quizId], (err, quiz) => {
    if (err) {
      return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการตรวจสอบข้อมูล' });
    }
    
    if (!quiz) {
      return res.status(404).json({ error: 'ไม่พบแบบทดสอบที่ต้องการแก้ไข' });
    }

    db.run(
      'UPDATE quizzes SET title = ?, time_limit = ?, passing_score = ?, allow_retake = ?, order_index = ? WHERE quiz_id = ?',
      [title.trim(), timeLimit, passingScore, allow_retake !== undefined ? allow_retake : 1, order_index || 0, quizId],
      function(err) {
        if (err) {
          console.error('Error updating quiz:', err);
          return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการอัพเดตแบบทดสอบ' });
        }
        
        if (this.changes === 0) {
          return res.status(404).json({ error: 'ไม่พบแบบทดสอบที่ต้องการแก้ไข' });
        }
        
        res.json({ 
          message: 'บันทึกการแก้ไขแบบทดสอบสำเร็จ',
          success: true
        });
      }
    );
  });
});

// Delete quiz
router.delete('/quizzes/:quizId', authenticateToken, requireAdmin, (req, res) => {
  const { quizId } = req.params;

  // Check if quiz has results
  db.get('SELECT COUNT(*) as count FROM quiz_results WHERE quiz_id = ?', [quizId], (err, result) => {
    if (err) {
      return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการตรวจสอบข้อมูล' });
    }

    if (result.count > 0) {
      return res.status(400).json({ 
        error: `ไม่สามารถลบแบบทดสอบได้ เนื่องจากมีนักศึกษา ${result.count} คนทำแบบทดสอบนี้แล้ว`,
        hint: 'หากต้องการลบจริงๆ กรุณาลบผลการทดสอบทั้งหมดก่อน'
      });
    }

    // Delete quiz questions first
    db.run('DELETE FROM quiz_questions WHERE quiz_id = ?', [quizId], (err) => {
      if (err) {
        console.error('Error deleting quiz questions:', err);
        return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการลบคำถาม' });
      }
      
      // Then delete quiz
      db.run('DELETE FROM quizzes WHERE quiz_id = ?', [quizId], function(err) {
        if (err) {
          console.error('Error deleting quiz:', err);
          return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการลบแบบทดสอบ' });
        }
        
        if (this.changes === 0) {
          return res.status(404).json({ error: 'ไม่พบแบบทดสอบที่ต้องการลบ' });
        }
        
        res.json({ 
          message: 'ลบแบบทดสอบสำเร็จ',
          success: true
        });
      });
    });
  });
});

// Create practical exam
router.post('/exams', authenticateToken, requireAdmin, (req, res) => {
  const { date, start_time, end_time, limit_count } = req.body;

  if (!date || !start_time || !end_time || !limit_count) {
    return res.status(400).json({ error: 'All exam fields required' });
  }

  const examId = uuidv4();
  db.run(
    'INSERT INTO practical_exams (exam_id, date, start_time, end_time, limit_count, remaining_count, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [examId, date, start_time, end_time, limit_count, limit_count, 'open'],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to create exam' });
      }
      res.json({ exam_id: examId, message: 'Exam created successfully' });
    }
  );
});

// Generate weekly practical exam slots (Monday-Friday)
router.post('/practical/generate-weekly', authenticateToken, requireAdmin, (req, res) => {
  const { weeks = 12, start_time = '09:00', end_time = '12:00', afternoon_start = '13:00', afternoon_end = '16:00', limit_count = 100 } = req.body;

  const today = new Date();
  const slots = [];
  const timeSlots = [
    { start: start_time, end: end_time },
    { start: afternoon_start, end: afternoon_end }
  ];
  
  // Start from next Monday
  const daysUntilMonday = (8 - today.getDay()) % 7 || 7;
  const startDate = new Date(today);
  startDate.setDate(today.getDate() + daysUntilMonday);
  
  // Generate slots for specified weeks
  for (let week = 0; week < weeks; week++) {
    for (let day = 0; day < 5; day++) { // Monday (0) to Friday (4)
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + (week * 7) + day);
      
      // Skip if date is in the past
      if (currentDate < today) continue;
      
      const dateStr = currentDate.toISOString().split('T')[0];
      
      // Create slots for each time slot
      timeSlots.forEach((timeSlot) => {
        slots.push({
          date: dateStr,
          start: timeSlot.start,
          end: timeSlot.end
        });
      });
    }
  }

  let created = 0;
  let skipped = 0;
  let errors = 0;

  db.serialize(() => {
    db.run('BEGIN TRANSACTION');
    
    slots.forEach((exam, index) => {
      // Check if slot already exists
      db.get(
        'SELECT exam_id FROM practical_exams WHERE date = ? AND start_time = ? AND end_time = ?',
        [exam.date, exam.start, exam.end],
        (err, existing) => {
          if (err) {
            errors++;
            return;
          }

          if (existing) {
            skipped++;
          } else {
            const examId = uuidv4();
            db.run(
              'INSERT INTO practical_exams (exam_id, date, start_time, end_time, limit_count, remaining_count, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
              [examId, exam.date, exam.start, exam.end, limit_count, limit_count, 'open'],
              function(insertErr) {
                if (insertErr) {
                  errors++;
                } else {
                  created++;
                }
              }
            );
          }

          // Commit transaction when all slots are processed
          if (index === slots.length - 1) {
            setTimeout(() => {
              db.run('COMMIT', (commitErr) => {
                if (commitErr) {
                  console.error('Transaction commit error:', commitErr);
                  db.run('ROLLBACK');
                  return res.status(500).json({ error: 'Failed to create slots' });
                }
                res.json({
                  message: 'สร้างรอบการจองสำเร็จ',
                  created,
                  skipped,
                  errors,
                  total: slots.length
                });
              });
            }, 100);
          }
        }
      );
    });
  });
});

// Submit assessment result
router.post('/assessments', authenticateToken, requireAdmin, (req, res) => {
  const { user_id, exam_id, score, passed, feedback } = req.body;

  if (!user_id || !exam_id || score === undefined || passed === undefined) {
    return res.status(400).json({ error: 'All assessment fields required' });
  }

  const assessmentId = uuidv4();
  db.run(
    'INSERT INTO assessment_results (assessment_id, user_id, exam_id, score, passed, feedback, assessed_by) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [assessmentId, user_id, exam_id, score, passed ? 1 : 0, feedback || '', req.user.userId],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to create assessment' });
      }
      res.json({ assessment_id: assessmentId, message: 'Assessment submitted successfully' });
    }
  );
});

// Check video storage status (Volume/filesystem)
router.get('/storage/status', authenticateToken, requireAdmin, (req, res) => {
  const fs = require('fs');
  const path = require('path');
  
  const videosPath = path.join(__dirname, '..', 'uploads', 'videos');
  const directoryExists = fs.existsSync(videosPath);
  
  let stats = {
    directoryExists,
    directoryPath: videosPath,
    files: [],
    realFiles: [],
    lfsPointers: [],
    totalSize: 0,
    totalSizeMB: 0
  };
  
  if (directoryExists) {
    try {
      const files = fs.readdirSync(videosPath);
      const videoFiles = files.filter(f => 
        f.endsWith('.mp4') || f.endsWith('.webm') || f.endsWith('.mov')
      );
      
      videoFiles.forEach(filename => {
        const filePath = path.join(videosPath, filename);
        try {
          const fileStats = fs.statSync(filePath);
          const size = fileStats.size;
          const sizeMB = (size / (1024 * 1024)).toFixed(2);
          
          if (size < 200) {
            // Check if LFS pointer
            const content = fs.readFileSync(filePath, 'utf8');
            if (content.includes('version https://git-lfs.github.com/spec/v1')) {
              stats.lfsPointers.push({
                filename,
                size,
                sizeMB: '0.00'
              });
            }
          } else {
            stats.realFiles.push({
              filename,
              size,
              sizeMB
            });
            stats.totalSize += size;
          }
          
          stats.files.push({
            filename,
            size,
            sizeMB,
            isLfsPointer: size < 200
          });
        } catch (err) {
          // Ignore errors
        }
      });
      
      stats.totalSizeMB = (stats.totalSize / (1024 * 1024)).toFixed(2);
      stats.realFileCount = stats.realFiles.length;
      stats.lfsPointerCount = stats.lfsPointers.length;
      stats.totalFileCount = stats.files.length;
      
      // Check if volume is mounted (Railway volumes are typically at /app)
      const isVolumeMounted = videosPath.includes('/app') || process.env.RAILWAY_VOLUME_MOUNT_PATH;
      
      res.json({
        ...stats,
        isVolumeMounted,
        volumePath: process.env.RAILWAY_VOLUME_MOUNT_PATH || 'Not set',
        recommendations: stats.lfsPointerCount > 0 ? [
          'Some files are LFS pointers. Consider using Railway Volumes.',
          'Upload actual video files to the volume.',
          'Or use external storage (S3, Cloudflare R2) for video files.'
        ] : [
          'All video files are real files. ✅',
          'Consider using Railway Volumes for persistent storage.',
          'Backup video files regularly.'
        ]
      });
    } catch (err) {
      res.status(500).json({ 
        error: 'Failed to read video directory', 
        details: err.message 
      });
    }
  } else {
    res.json({
      ...stats,
      recommendations: [
        'Video directory does not exist.',
        'Create the directory or mount a Railway Volume.',
        'Mount path should be: /app/server/uploads/videos'
      ]
    });
  }
});

// Get video details by ID (for debugging)
router.get('/video/:videoId', authenticateToken, requireAdmin, (req, res) => {
  const { videoId } = req.params;
  
  db.get(
    `SELECT video_id, title, url, module_id, order_index, duration 
     FROM videos 
     WHERE video_id = ?`,
    [videoId],
    (err, video) => {
      if (err) {
        return res.status(500).json({ error: 'Database error', message: err.message });
      }
      
      if (!video) {
        return res.status(404).json({ error: 'Video not found' });
      }
      
      const result = {
        video_id: video.video_id,
        title: video.title,
        module_id: video.module_id,
        order_index: video.order_index,
        duration: video.duration,
        url: video.url || null,
        url_info: {
          has_url: !!video.url,
          url_length: video.url ? video.url.length : 0,
          is_empty: !video.url || video.url.trim() === '',
          url_type: typeof video.url
        }
      };
      
      // Extract filename if URL exists
      if (video.url) {
        result.filename = video.url.includes('/') 
          ? video.url.split('/').pop() 
          : video.url;
        result.expected_path = `server/uploads/videos/${result.filename}`;
      }
      
      res.json(result);
    }
  );
});

// ==================== ROOM MANAGEMENT ====================

// Get all rooms
router.get('/rooms', authenticateToken, requireAdmin, (req, res) => {
  db.all('SELECT * FROM rooms ORDER BY name ASC', (err, rooms) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(rooms);
  });
});

// Create room
router.post('/rooms', authenticateToken, requireAdmin, (req, res) => {
  const { name, description, capacity } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Room name is required' });
  }

  const roomId = uuidv4();
  db.run(
    'INSERT INTO rooms (room_id, name, description, capacity, status) VALUES (?, ?, ?, ?, ?)',
    [roomId, name, description || '', capacity || 20, 'available'],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to create room' });
      }
      res.json({ 
        room_id: roomId, 
        message: 'สร้างห้องสำเร็จ',
        room: { room_id: roomId, name, description, capacity, status: 'available' }
      });
    }
  );
});

// Update room
router.put('/rooms/:roomId', authenticateToken, requireAdmin, (req, res) => {
  const { roomId } = req.params;
  const { name, description, capacity, status } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Room name is required' });
  }

  db.run(
    'UPDATE rooms SET name = ?, description = ?, capacity = ?, status = ? WHERE room_id = ?',
    [name, description || '', capacity || 20, status || 'available', roomId],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to update room' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Room not found' });
      }
      res.json({ message: 'อัพเดตข้อมูลห้องสำเร็จ' });
    }
  );
});

// Delete room
router.delete('/rooms/:roomId', authenticateToken, requireAdmin, (req, res) => {
  const { roomId } = req.params;

  // Check if room has bookings
  db.get(
    'SELECT COUNT(*) as count FROM room_bookings WHERE room_id = ? AND status != "cancelled"',
    [roomId],
    (err, result) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      
      if (result.count > 0) {
        return res.status(400).json({ 
          error: 'ไม่สามารถลบห้องที่มีการจองอยู่ได้',
          message: `มีการจอง ${result.count} รายการ กรุณายกเลิกการจองก่อน`
        });
      }

      db.run('DELETE FROM rooms WHERE room_id = ?', [roomId], function(err) {
        if (err) {
          return res.status(500).json({ error: 'Failed to delete room' });
        }
        if (this.changes === 0) {
          return res.status(404).json({ error: 'Room not found' });
        }
        res.json({ message: 'ลบห้องสำเร็จ' });
      });
    }
  );
});

// ==================== ROOM BOOKINGS MANAGEMENT ====================

// Get all room bookings with filters
router.get('/room-bookings', authenticateToken, requireAdmin, (req, res) => {
  const { room_id, status, date, user_id } = req.query;
  
  let query = `
    SELECT 
      rb.*,
      r.name as room_name,
      r.capacity,
      u.name as user_name,
      u.student_id
    FROM room_bookings rb
    JOIN rooms r ON rb.room_id = r.room_id
    JOIN users u ON rb.user_id = u.user_id
    WHERE 1=1
  `;
  
  const params = [];
  
  if (room_id) {
    query += ' AND rb.room_id = ?';
    params.push(room_id);
  }
  
  if (status) {
    query += ' AND rb.status = ?';
    params.push(status);
  }
  
  if (date) {
    query += ' AND rb.booking_date = ?';
    params.push(date);
  }
  
  if (user_id) {
    query += ' AND rb.user_id = ?';
    params.push(user_id);
  }
  
  query += ' ORDER BY rb.booking_date DESC, rb.start_time ASC';
  
  db.all(query, params, (err, bookings) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(bookings);
  });
});

// Get room booking statistics
router.get('/room-bookings/statistics', authenticateToken, requireAdmin, (req, res) => {
  const statsQuery = `
    SELECT 
      COUNT(*) as total_bookings,
      SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_count,
      SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved_count,
      SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_count,
      SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_count
    FROM room_bookings
  `;
  
  db.get(statsQuery, [], (err, stats) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(stats);
  });
});

// Get bookings for a specific room
router.get('/room-bookings/room/:roomId', authenticateToken, requireAdmin, (req, res) => {
  const { roomId } = req.params;
  const { date } = req.query;
  
  let query = `
    SELECT 
      rb.*,
      u.name as user_name,
      u.student_id
    FROM room_bookings rb
    JOIN users u ON rb.user_id = u.user_id
    WHERE rb.room_id = ?
  `;
  
  const params = [roomId];
  
  if (date) {
    query += ' AND rb.booking_date = ?';
    params.push(date);
  }
  
  query += ' ORDER BY rb.booking_date ASC, rb.start_time ASC';
  
  db.all(query, params, (err, bookings) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(bookings);
  });
});

// Update room booking status
router.put('/room-bookings/:bookingId/status', authenticateToken, requireAdmin, (req, res) => {
  const { bookingId } = req.params;
  const { status } = req.body;
  
  const validStatuses = ['pending', 'approved', 'cancelled', 'completed'];
  
  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({ 
      error: 'สถานะไม่ถูกต้อง',
      message: 'สถานะต้องเป็น: pending, approved, cancelled, หรือ completed'
    });
  }
  
  db.run(
    'UPDATE room_bookings SET status = ? WHERE booking_id = ?',
    [status, bookingId],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to update booking status' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Booking not found' });
      }
      
      const statusMessages = {
        'pending': 'เปลี่ยนสถานะเป็นรอดำเนินการ',
        'approved': 'อนุมัติการจองสำเร็จ',
        'cancelled': 'ยกเลิกการจองสำเร็จ',
        'completed': 'เปลี่ยนสถานะเป็นเสร็จสิ้น'
      };
      
      res.json({ message: statusMessages[status] });
    }
  );
});

// Delete room booking
router.delete('/room-bookings/:bookingId', authenticateToken, requireAdmin, (req, res) => {
  const { bookingId } = req.params;
  
  db.run('DELETE FROM room_bookings WHERE booking_id = ?', [bookingId], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Failed to delete booking' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    res.json({ message: 'ลบการจองสำเร็จ' });
  });
});

// Create room booking (by admin)
router.post('/room-bookings', authenticateToken, requireAdmin, (req, res) => {
  const { room_id, user_id, booking_date, start_time, end_time, status } = req.body;

  if (!room_id || !user_id || !booking_date || !start_time || !end_time) {
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
    if (overlap) {
      return res.status(400).json({ error: 'ช่วงเวลานี้ถูกจองแล้ว' });
    }

    const bookingId = uuidv4();
    db.run(
      'INSERT INTO room_bookings (booking_id, room_id, user_id, booking_date, start_time, end_time, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [bookingId, room_id, user_id, booking_date, start_time, end_time, status || 'approved'],
      function(err) {
        if (err) {
          return res.status(500).json({ error: 'Failed to create booking' });
        }
        res.json({ 
          message: 'สร้างการจองสำเร็จ', 
          booking_id: bookingId 
        });
      }
    );
  });
});

// ==================== ADMIN DASHBOARD & ALERTS ====================

// Get pending room bookings (รอการอนุมัติ) - สำหรับแสดงแจ้งเตือนในแผงควบคุม
router.get('/room-bookings/pending', authenticateToken, requireAdmin, (req, res) => {
  const query = `
    SELECT 
      rb.*,
      r.name as room_name,
      r.capacity,
      u.name as user_name,
      u.student_id,
      u.phone
    FROM room_bookings rb
    JOIN rooms r ON rb.room_id = r.room_id
    JOIN users u ON rb.user_id = u.user_id
    WHERE rb.status = 'pending'
    ORDER BY rb.created_at DESC
  `;
  
  db.all(query, [], (err, bookings) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json({
      count: bookings.length,
      bookings: bookings
    });
  });
});

// Get recent room bookings (การจองล่าสุด) - สำหรับแดชบอร์ด
router.get('/room-bookings/recent', authenticateToken, requireAdmin, (req, res) => {
  const limit = req.query.limit || 10;
  
  const query = `
    SELECT 
      rb.*,
      r.name as room_name,
      u.name as user_name,
      u.student_id
    FROM room_bookings rb
    JOIN rooms r ON rb.room_id = r.room_id
    JOIN users u ON rb.user_id = u.user_id
    ORDER BY rb.created_at DESC
    LIMIT ?
  `;
  
  db.all(query, [limit], (err, bookings) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(bookings);
  });
});

// Get today's room bookings - ดูการจองวันนี้
router.get('/room-bookings/today', authenticateToken, requireAdmin, (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  
  const query = `
    SELECT 
      rb.*,
      r.name as room_name,
      r.capacity,
      u.name as user_name,
      u.student_id,
      u.phone
    FROM room_bookings rb
    JOIN rooms r ON rb.room_id = r.room_id
    JOIN users u ON rb.user_id = u.user_id
    WHERE rb.booking_date = ? AND rb.status != 'cancelled'
    ORDER BY rb.start_time ASC
  `;
  
  db.all(query, [today], (err, bookings) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json({
      date: today,
      count: bookings.length,
      bookings: bookings
    });
  });
});

// Get room bookings dashboard summary - สรุปภาพรวมสำหรับแดชบอร์ด
router.get('/dashboard/room-bookings', authenticateToken, requireAdmin, (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  
  // Get various statistics
  const queries = {
    pending: 'SELECT COUNT(*) as count FROM room_bookings WHERE status = "pending"',
    today: 'SELECT COUNT(*) as count FROM room_bookings WHERE booking_date = ? AND status != "cancelled"',
    thisWeek: `
      SELECT COUNT(*) as count FROM room_bookings 
      WHERE booking_date >= date('now', 'weekday 0', '-7 days') 
      AND booking_date <= date('now', 'weekday 0')
      AND status != 'cancelled'
    `,
    thisMonth: `
      SELECT COUNT(*) as count FROM room_bookings 
      WHERE strftime('%Y-%m', booking_date) = strftime('%Y-%m', 'now')
      AND status != 'cancelled'
    `,
    totalRooms: 'SELECT COUNT(*) as count FROM rooms WHERE status = "available"',
    recentBookings: `
      SELECT 
        rb.booking_id,
        rb.booking_date,
        rb.start_time,
        rb.end_time,
        rb.status,
        rb.created_at,
        r.name as room_name,
        u.name as user_name,
        u.student_id
      FROM room_bookings rb
      JOIN rooms r ON rb.room_id = r.room_id
      JOIN users u ON rb.user_id = u.user_id
      ORDER BY rb.created_at DESC
      LIMIT 5
    `
  };
  
  const results = {};
  let completed = 0;
  const totalQueries = Object.keys(queries).length;
  
  // Execute all queries
  db.get(queries.pending, [], (err, result) => {
    if (!err) results.pendingCount = result.count;
    if (++completed === totalQueries) sendResponse();
  });
  
  db.get(queries.today, [today], (err, result) => {
    if (!err) results.todayCount = result.count;
    if (++completed === totalQueries) sendResponse();
  });
  
  db.get(queries.thisWeek, [], (err, result) => {
    if (!err) results.weekCount = result.count;
    if (++completed === totalQueries) sendResponse();
  });
  
  db.get(queries.thisMonth, [], (err, result) => {
    if (!err) results.monthCount = result.count;
    if (++completed === totalQueries) sendResponse();
  });
  
  db.get(queries.totalRooms, [], (err, result) => {
    if (!err) results.totalRooms = result.count;
    if (++completed === totalQueries) sendResponse();
  });
  
  db.all(queries.recentBookings, [], (err, bookings) => {
    if (!err) results.recentBookings = bookings;
    if (++completed === totalQueries) sendResponse();
  });
  
  function sendResponse() {
    res.json({
      summary: {
        pendingBookings: results.pendingCount || 0,
        todayBookings: results.todayCount || 0,
        weekBookings: results.weekCount || 0,
        monthBookings: results.monthCount || 0,
        totalRooms: results.totalRooms || 0
      },
      recentBookings: results.recentBookings || [],
      lastUpdated: new Date().toISOString()
    });
  }
});

module.exports = router;

