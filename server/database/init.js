const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.join(__dirname, 'pim_learning.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('✅ Connected to SQLite database');
    initializeTables();
  }
});

function initializeTables() {
  // Users table
  db.run(`CREATE TABLE IF NOT EXISTS users (
    user_id TEXT PRIMARY KEY,
    student_id TEXT UNIQUE,
    name TEXT NOT NULL,
    year_level INTEGER,
    role TEXT DEFAULT 'student',
    email TEXT,
    password_hash TEXT,
    phone TEXT,
    is_whitelisted INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Student whitelist table (for reference)
  db.run(`CREATE TABLE IF NOT EXISTS student_whitelist (
    student_id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT,
    gpax REAL,
    advisor TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Modules table
  db.run(`CREATE TABLE IF NOT EXISTS modules (
    module_id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    objectives TEXT,
    year_level INTEGER,
    order_index INTEGER
  )`);
  
  // Add objectives column if it doesn't exist (for existing databases)
  db.all(`PRAGMA table_info(modules)`, (err, columns) => {
    if (!err && columns) {
      const hasObjectives = columns.some(col => col.name === 'objectives');
      if (!hasObjectives) {
        db.run(`ALTER TABLE modules ADD COLUMN objectives TEXT`, (alterErr) => {
          if (alterErr && !alterErr.message.includes('duplicate column')) {
            console.log('Note: Could not add objectives column:', alterErr.message);
          } else {
            console.log('✅ Added objectives column to modules table');
          }
        });
      }
    }
  });

  // Videos table
  db.run(`CREATE TABLE IF NOT EXISTS videos (
    video_id TEXT PRIMARY KEY,
    module_id TEXT,
    title TEXT NOT NULL,
    url TEXT,
    duration INTEGER,
    order_index INTEGER,
    FOREIGN KEY (module_id) REFERENCES modules(module_id)
  )`);

  // Video progress table
  db.run(`CREATE TABLE IF NOT EXISTS video_progress (
    progress_id TEXT PRIMARY KEY,
    user_id TEXT,
    video_id TEXT,
    watch_time INTEGER DEFAULT 0,
    is_complete INTEGER DEFAULT 0,
    last_watched DATETIME,
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (video_id) REFERENCES videos(video_id)
  )`);

  // Quizzes table
  db.run(`CREATE TABLE IF NOT EXISTS quizzes (
    quiz_id TEXT PRIMARY KEY,
    module_id TEXT,
    title TEXT NOT NULL,
    time_limit INTEGER,
    passing_score INTEGER DEFAULT 70,
    allow_retake INTEGER DEFAULT 1,
    order_index INTEGER DEFAULT 1,
    FOREIGN KEY (module_id) REFERENCES modules(module_id)
  )`);
  
  // Add order_index column if it doesn't exist (for existing databases)
  // SQLite doesn't support IF NOT EXISTS for ALTER TABLE, so we need to check first
  db.all(`PRAGMA table_info(quizzes)`, (err, columns) => {
    if (!err && columns) {
      const hasOrderIndex = columns.some(col => col.name === 'order_index');
      if (!hasOrderIndex) {
        db.run(`ALTER TABLE quizzes ADD COLUMN order_index INTEGER DEFAULT 1`, (alterErr) => {
          if (alterErr && !alterErr.message.includes('duplicate column')) {
            console.log('Note: Could not add order_index column:', alterErr.message);
          }
        });
      }
    }
  });

  // Quiz questions table
  db.run(`CREATE TABLE IF NOT EXISTS quiz_questions (
    question_id TEXT PRIMARY KEY,
    quiz_id TEXT,
    question TEXT NOT NULL,
    type TEXT,
    options TEXT,
    correct_answer TEXT,
    order_index INTEGER,
    FOREIGN KEY (quiz_id) REFERENCES quizzes(quiz_id)
  )`);

  // Quiz results table
  db.run(`CREATE TABLE IF NOT EXISTS quiz_results (
    result_id TEXT PRIMARY KEY,
    user_id TEXT,
    quiz_id TEXT,
    score INTEGER,
    passed INTEGER,
    answers TEXT,
    completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (quiz_id) REFERENCES quizzes(quiz_id)
  )`);

  // Practical exams table
  db.run(`CREATE TABLE IF NOT EXISTS practical_exams (
    exam_id TEXT PRIMARY KEY,
    date TEXT NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    limit_count INTEGER,
    remaining_count INTEGER,
    status TEXT DEFAULT 'open'
  )`);

  // Exam registrations table
  db.run(`CREATE TABLE IF NOT EXISTS exam_registrations (
    registration_id TEXT PRIMARY KEY,
    user_id TEXT,
    exam_id TEXT,
    status TEXT DEFAULT 'registered',
    registered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (exam_id) REFERENCES practical_exams(exam_id)
  )`);

  // Assessment results table
  db.run(`CREATE TABLE IF NOT EXISTS assessment_results (
    assessment_id TEXT PRIMARY KEY,
    user_id TEXT,
    exam_id TEXT,
    score INTEGER,
    passed INTEGER,
    feedback TEXT,
    assessed_by TEXT,
    assessed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (exam_id) REFERENCES practical_exams(exam_id)
  )`);

  // Learning hours table
  db.run(`CREATE TABLE IF NOT EXISTS learning_hours (
    hours_id TEXT PRIMARY KEY,
    user_id TEXT,
    module_id TEXT,
    hours REAL DEFAULT 0,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (module_id) REFERENCES modules(module_id)
  )`);

  // Evaluations table
  db.run(`CREATE TABLE IF NOT EXISTS evaluations (
    evaluation_id TEXT PRIMARY KEY,
    user_id TEXT,
    module_id TEXT,
    answers TEXT,
    submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (module_id) REFERENCES modules(module_id)
  )`);

  // Assignments table
  db.run(`CREATE TABLE IF NOT EXISTS assignments (
    assignment_id TEXT PRIMARY KEY,
    module_id TEXT,
    title TEXT NOT NULL,
    description TEXT,
    due_date DATETIME,
    max_score INTEGER DEFAULT 100,
    created_by TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (module_id) REFERENCES modules(module_id),
    FOREIGN KEY (created_by) REFERENCES users(user_id)
  )`);

  // Assignment submissions table
  db.run(`CREATE TABLE IF NOT EXISTS assignment_submissions (
    submission_id TEXT PRIMARY KEY,
    assignment_id TEXT,
    user_id TEXT,
    content TEXT,
    file_path TEXT,
    score INTEGER,
    feedback TEXT,
    graded_by TEXT,
    submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    graded_at DATETIME,
    status TEXT DEFAULT 'submitted',
    FOREIGN KEY (assignment_id) REFERENCES assignments(assignment_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (graded_by) REFERENCES users(user_id)
  )`);

  // Discussions table
  db.run(`CREATE TABLE IF NOT EXISTS discussions (
    discussion_id TEXT PRIMARY KEY,
    module_id TEXT,
    title TEXT NOT NULL,
    content TEXT,
    created_by TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME,
    is_pinned INTEGER DEFAULT 0,
    FOREIGN KEY (module_id) REFERENCES modules(module_id),
    FOREIGN KEY (created_by) REFERENCES users(user_id)
  )`);

  // Discussion replies table
  db.run(`CREATE TABLE IF NOT EXISTS discussion_replies (
    reply_id TEXT PRIMARY KEY,
    discussion_id TEXT,
    user_id TEXT,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME,
    FOREIGN KEY (discussion_id) REFERENCES discussions(discussion_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id)
  )`);

  // Announcements table
  db.run(`CREATE TABLE IF NOT EXISTS announcements (
    announcement_id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT,
    created_by TEXT,
    target_audience TEXT DEFAULT 'all',
    module_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME,
    is_important INTEGER DEFAULT 0,
    FOREIGN KEY (created_by) REFERENCES users(user_id),
    FOREIGN KEY (module_id) REFERENCES modules(module_id)
  )`);

  // Course files table
  db.run(`CREATE TABLE IF NOT EXISTS course_files (
    file_id TEXT PRIMARY KEY,
    module_id TEXT,
    title TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_type TEXT,
    file_size INTEGER,
    uploaded_by TEXT,
    uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (module_id) REFERENCES modules(module_id),
    FOREIGN KEY (uploaded_by) REFERENCES users(user_id)
  )`);

  // Calendar events table
  db.run(`CREATE TABLE IF NOT EXISTS calendar_events (
    event_id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    event_date DATETIME NOT NULL,
    end_date DATETIME,
    event_type TEXT DEFAULT 'general',
    module_id TEXT,
    created_by TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (module_id) REFERENCES modules(module_id),
    FOREIGN KEY (created_by) REFERENCES users(user_id)
  )`);

  // Certificates table
  db.run(`CREATE TABLE IF NOT EXISTS certificates (
    certificate_id TEXT PRIMARY KEY,
    user_id TEXT,
    module_id TEXT,
    certificate_number TEXT UNIQUE,
    issued_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    issued_by TEXT,
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (module_id) REFERENCES modules(module_id),
    FOREIGN KEY (issued_by) REFERENCES users(user_id)
  )`);

  // Notifications table
  db.run(`CREATE TABLE IF NOT EXISTS notifications (
    notification_id TEXT PRIMARY KEY,
    user_id TEXT,
    title TEXT NOT NULL,
    message TEXT,
    type TEXT DEFAULT 'info',
    link TEXT,
    is_read INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
  )`);

  // Messages table
  db.run(`CREATE TABLE IF NOT EXISTS messages (
    message_id TEXT PRIMARY KEY,
    sender_id TEXT,
    receiver_id TEXT,
    subject TEXT,
    content TEXT NOT NULL,
    is_read INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id) REFERENCES users(user_id),
    FOREIGN KEY (receiver_id) REFERENCES users(user_id)
  )`);

  // Grades table
  db.run(`CREATE TABLE IF NOT EXISTS grades (
    grade_id TEXT PRIMARY KEY,
    user_id TEXT,
    module_id TEXT,
    assignment_id TEXT,
    quiz_id TEXT,
    exam_id TEXT,
    score REAL,
    max_score REAL,
    grade_letter TEXT,
    feedback TEXT,
    graded_by TEXT,
    graded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (module_id) REFERENCES modules(module_id),
    FOREIGN KEY (assignment_id) REFERENCES assignments(assignment_id),
    FOREIGN KEY (quiz_id) REFERENCES quizzes(quiz_id),
    FOREIGN KEY (exam_id) REFERENCES practical_exams(exam_id),
    FOREIGN KEY (graded_by) REFERENCES users(user_id)
  )`);

  // Rooms table
  db.run(`CREATE TABLE IF NOT EXISTS rooms (
    room_id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    capacity INTEGER,
    status TEXT DEFAULT 'available'
  )`);

  // Room bookings table
  db.run(`CREATE TABLE IF NOT EXISTS room_bookings (
    booking_id TEXT PRIMARY KEY,
    room_id TEXT,
    user_id TEXT,
    booking_date TEXT NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (room_id) REFERENCES rooms(room_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id)
  )`);

  // Insert default modules
  insertDefaultData();
  
  // Generate weekly practical exam slots (Monday-Friday) for the next 12 weeks
  generateWeeklyPracticalSlots();
  
  // Seeding is disabled to avoid duplicate data
  // setTimeout(() => {
  //   const seed = require('./seed');
  //   seed();
  // }, 2000);
}

function generateWeeklyPracticalSlots() {
  const today = new Date();
  const timeSlots = [
    { start: '09:00', end: '12:00' },
    { start: '13:00', end: '16:00' }
  ];
  
  // Start from next Monday
  const daysUntilMonday = (8 - today.getDay()) % 7 || 7;
  const startDate = new Date(today);
  startDate.setDate(today.getDate() + daysUntilMonday);
  
  // Generate slots for 12 weeks (60 weekdays)
  const slots = [];
  for (let week = 0; week < 12; week++) {
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

  // Insert slots into database (using INSERT OR IGNORE to avoid duplicates)
  const { v4: uuidv4 } = require('uuid');
  let inserted = 0;
  
  db.serialize(() => {
    slots.forEach((exam) => {
      db.get(
        'SELECT exam_id FROM practical_exams WHERE date = ? AND start_time = ? AND end_time = ?',
        [exam.date, exam.start, exam.end],
        (err, existing) => {
          if (!err && !existing) {
            const examId = uuidv4();
            db.run(
              'INSERT INTO practical_exams (exam_id, date, start_time, end_time, limit_count, remaining_count, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
              [examId, exam.date, exam.start, exam.end, 100, 100, 'open'],
              function(insertErr) {
                if (!insertErr) {
                  inserted++;
                }
              }
            );
          }
        }
      );
    });
    
    // Log after a short delay to allow inserts to complete
    setTimeout(() => {
      if (inserted > 0) {
        console.log(`✅ Generated ${inserted} new practical exam slots for the next 12 weeks (Mon-Fri)`);
      }
    }, 1000);
  });
}

function insertDefaultData() {
  const { v4: uuidv4 } = require('uuid');
  
  const modules = [
    { id: 'module_1', title: 'การบริการ', description: 'ทักษะงานบริการ, ขั้นตอนงานแคชเชียร์, การสื่อสารกับลูกค้า', year: 1, order: 1 },
    { id: 'module_2', title: 'การเตรียมสินค้าอุ่นร้อน', description: 'วิธีใช้ตู้ร้อน, ขั้นตอนเตรียมสินค้า', year: 2, order: 2 },
    { id: 'module_3', title: 'การจัดการอุปกรณ์และความสะอาด', description: 'อุปกรณ์ในร้าน, ขั้นตอนล้างและเก็บอุปกรณ์', year: 1, order: 3 },
    { id: 'module_4', title: 'การจัดการและบริหารสินค้า', description: 'การรับสินค้า, FIFO/FEFO, การนับสต๊อก', year: 2, order: 4 }
  ];

  modules.forEach(module => {
    db.run(`INSERT OR IGNORE INTO modules (module_id, title, description, year_level, order_index) 
            VALUES (?, ?, ?, ?, ?)`,
      [module.id, module.title, module.description, module.year, module.order]);
  });

  // Insert default admin user (password: admin123)
  const bcrypt = require('bcryptjs');
  const adminPassword = bcrypt.hashSync('admin123', 10);
  db.run(`INSERT OR IGNORE INTO users (user_id, student_id, name, year_level, role, email, password_hash)
          VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ['admin_1', 'ADMIN001', 'Admin User', null, 'admin', 'admin@pim.ac.th', adminPassword]);
  
  // Insert default rooms for 7-Eleven Demo Store training
  const defaultRooms = [
    {
      id: uuidv4(),
      name: 'ห้องปฏิบัติการแคชเชียร์ (Cashier Lab)',
      description: 'สำหรับฝึกทักษะการใช้เครื่อง POS และการบริการฐานเงิน',
      capacity: 20
    },
    {
      id: uuidv4(),
      name: 'ห้องเตรียมสินค้าอุ่นร้อน (Food Prep Room)',
      description: 'สำหรับฝึกการใช้อุปกรณ์อุ่นร้อนและสุขอนามัยอาหาร',
      capacity: 15
    },
    {
      id: uuidv4(),
      name: 'ห้องจัดเรียงสินค้า (Merchandise Room)',
      description: 'สำหรับฝึกการจัดเรียงสินค้าและการตรวจสอบคุณภาพ',
      capacity: 25
    },
    {
      id: uuidv4(),
      name: 'ห้องคลังสินค้า (Storage Room)',
      description: 'สำหรับฝึกการรับสินค้า FIFO/FEFO และการนับสต๊อก',
      capacity: 15
    },
    {
      id: uuidv4(),
      name: 'ห้องบรรยาย A (Lecture Room A)',
      description: 'ห้องบรรยายพร้อมอุปกรณ์ AV ครบครัน',
      capacity: 50
    },
    {
      id: uuidv4(),
      name: 'ห้องบรรยาย B (Lecture Room B)',
      description: 'ห้องบรรยายขนาดกลางสำหรับกลุ่มย่อย',
      capacity: 30
    },
    {
      id: uuidv4(),
      name: 'ห้องประชุมกลุ่มย่อย (Group Discussion Room)',
      description: 'ห้องสำหรับกิจกรรมกลุ่มและแลกเปลี่ยนความคิดเห็น',
      capacity: 12
    },
    {
      id: uuidv4(),
      name: 'Demo Store (ร้านสาธิต)',
      description: 'ร้าน 7-Eleven จำลองสมจริงสำหรับฝึกปฏิบัติ',
      capacity: 10
    }
  ];

  defaultRooms.forEach(room => {
    db.run(`INSERT OR IGNORE INTO rooms (room_id, name, description, capacity, status) 
            VALUES (?, ?, ?, ?, ?)`,
      [room.id, room.name, room.description, room.capacity, 'available'],
      (err) => {
        if (err) {
          console.error(`Error inserting room ${room.name}:`, err.message);
        }
      }
    );
  });
  
  console.log(`✅ Initialized ${defaultRooms.length} default training rooms`);
}

module.exports = db;

