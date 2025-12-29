const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const db = require('../database/init');

// JWT_SECRET must be set in environment variables for security
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('ERROR: JWT_SECRET environment variable is not set!');
  console.error('Please set JWT_SECRET in your .env file before running the server.');
  process.exit(1);
}

// Register
router.post('/register', async (req, res) => {
  try {
    const { student_id, name, email, password, year_level } = req.body;

    // Input validation
    if (!student_id || !name || !password) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Trim and validate student_id
    const trimmedStudentId = student_id.trim();
    if (trimmedStudentId.length < 3) {
      return res.status(400).json({ error: 'Student ID must be at least 3 characters' });
    }

    // Validate password strength
    if (password.length < 4) {
      return res.status(400).json({ error: 'Password must be at least 4 characters' });
    }

    // Validate name
    const trimmedName = name.trim();
    if (trimmedName.length < 2) {
      return res.status(400).json({ error: 'Name must be at least 2 characters' });
    }

      // Check if student is in whitelist
      db.get('SELECT * FROM student_whitelist WHERE student_id = ?', [trimmedStudentId], (whitelistErr, whitelistEntry) => {
        if (whitelistErr) {
          return res.status(500).json({ error: 'Database error' });
        }
        
        // Only allow registration for whitelisted students
        if (!whitelistEntry) {
          return res.status(403).json({ error: 'รหัสนักศึกษานี้ไม่อยู่ในรายชื่อที่อนุญาต กรุณาติดต่อผู้ดูแลระบบ' });
        }

        // Check if student_id already exists
        db.get('SELECT * FROM users WHERE student_id = ?', [trimmedStudentId], async (err, user) => {
          if (err) {
            return res.status(500).json({ error: 'Database error' });
          }
          if (user) {
            return res.status(400).json({ error: 'รหัสนักศึกษานี้มีบัญชีอยู่แล้ว' });
          }

          const passwordHash = await bcrypt.hash(password, 10);
          const userId = uuidv4();

          // Extract year level from student_id if not provided
          let finalYearLevel = year_level;
          if (!finalYearLevel) {
            const firstDigit = parseInt(trimmedStudentId.charAt(0));
            if (firstDigit === 8) finalYearLevel = 4;
            else if (firstDigit === 7) finalYearLevel = 3;
            else if (firstDigit === 6) finalYearLevel = 2;
            else if (firstDigit === 5) finalYearLevel = 1;
            else finalYearLevel = 1;
          }

          db.run(
            'INSERT INTO users (user_id, student_id, name, email, password_hash, year_level, role, phone, is_whitelisted) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [
              userId, 
              trimmedStudentId, 
              trimmedName, 
              (email || '').trim() || `${trimmedStudentId}@pim.ac.th`, 
              passwordHash, 
              finalYearLevel, 
              'student',
              whitelistEntry.phone || null,
              1 // is_whitelisted
            ],
            function(err) {
              if (err) {
                return res.status(500).json({ error: 'Failed to create user' });
              }

              const token = jwt.sign({ userId, student_id: trimmedStudentId, role: 'student' }, JWT_SECRET, { expiresIn: '7d' });
              res.json({
                token,
                user: {
                  user_id: userId,
                  student_id: trimmedStudentId,
                  name: trimmedName,
                  email: (email || '').trim() || `${trimmedStudentId}@pim.ac.th`,
                  year_level: finalYearLevel,
                  role: 'student'
                }
              });
            }
          );
        });
      });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { student_id, password } = req.body;

    // Input validation
    if (!student_id || !password) {
      return res.status(400).json({ error: 'Student ID and password required' });
    }

    // Trim and validate input
    const trimmedStudentId = student_id.trim();
    if (!trimmedStudentId || trimmedStudentId.length < 3) {
      return res.status(400).json({ error: 'Invalid student ID format' });
    }

    if (!password || password.length < 4) {
      return res.status(400).json({ error: 'Invalid password format' });
    }

    db.get('SELECT * FROM users WHERE student_id = ?', [trimmedStudentId], async (err, user) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (!user) {
        return res.status(401).json({ error: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' });
      }

      // Check if user is whitelisted (only whitelisted students can login)
      if (user.is_whitelisted !== 1 && user.role === 'student') {
        return res.status(403).json({ error: 'คุณไม่มีสิทธิ์เข้าสู่ระบบ กรุณาติดต่อผู้ดูแลระบบ' });
      }

      const isValid = await bcrypt.compare(password, user.password_hash);
      if (!isValid) {
        return res.status(401).json({ error: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' });
      }

      const token = jwt.sign(
        { userId: user.user_id, student_id: user.student_id, role: user.role },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.json({
        token,
        user: {
          user_id: user.user_id,
          student_id: user.student_id,
          name: user.name,
          email: user.email,
          year_level: user.year_level,
          role: user.role
        }
      });
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// SSO Login (mock implementation)
router.post('/sso', (req, res) => {
  // In real implementation, this would verify with PIM SSO system
  const { sso_token } = req.body;
  
  // Mock SSO verification
  if (sso_token) {
    db.get('SELECT * FROM users WHERE student_id = ?', ['SSO_USER'], (err, user) => {
      if (err || !user) {
        return res.status(401).json({ error: 'SSO authentication failed' });
      }

      const token = jwt.sign(
        { userId: user.user_id, student_id: user.student_id, role: user.role },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.json({
        token,
        user: {
          user_id: user.user_id,
          student_id: user.student_id,
          name: user.name,
          email: user.email,
          year_level: user.year_level,
          role: user.role
        }
      });
    });
  } else {
    res.status(400).json({ error: 'SSO token required' });
  }
});

// Get current user
router.get('/me', authenticateToken, (req, res) => {
  db.get('SELECT user_id, student_id, name, email, year_level, role FROM users WHERE user_id = ?',
    [req.user.userId], (err, user) => {
      if (err || !user) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.json(user);
    });
});

// Middleware to authenticate token
function authenticateToken(req, res, next) {
  const fs = require('fs');
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  // #region agent log
  const path = require('path');
  const logPath = path.join(process.cwd(), '.cursor', 'debug.log');
  const logData = {location:'auth.js:224',message:'authenticateToken entry',data:{hasAuthHeader:!!authHeader,hasToken:!!token,tokenLength:token?.length,path:req.path,method:req.method},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A,B'};
  console.log('[DEBUG]', JSON.stringify(logData));
  try{const logDir = path.dirname(logPath); if(!fs.existsSync(logDir))fs.mkdirSync(logDir,{recursive:true}); fs.appendFileSync(logPath,JSON.stringify(logData)+'\n');}catch(e){console.error('[DEBUG] Log write error:',e.message);}
  // #endregion

  if (!token) {
    // #region agent log
    const path = require('path');
    const logPath = path.join(process.cwd(), '.cursor', 'debug.log');
    const logData2 = {location:'auth.js:229',message:'authenticateToken no token',data:{path:req.path},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'};
    console.log('[DEBUG]', JSON.stringify(logData2));
    try{const logDir = path.dirname(logPath); if(!fs.existsSync(logDir))fs.mkdirSync(logDir,{recursive:true}); fs.appendFileSync(logPath,JSON.stringify(logData2)+'\n');}catch(e){console.error('[DEBUG] Log write error:',e.message);}
    // #endregion
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    // #region agent log
    const path = require('path');
    const logPath = path.join(process.cwd(), '.cursor', 'debug.log');
    const logData3 = {location:'auth.js:232',message:'jwt.verify result',data:{hasError:!!err,errorMsg:err?.message,hasUser:!!user,userId:user?.userId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'};
    console.log('[DEBUG]', JSON.stringify(logData3));
    try{const logDir = path.dirname(logPath); if(!fs.existsSync(logDir))fs.mkdirSync(logDir,{recursive:true}); fs.appendFileSync(logPath,JSON.stringify(logData3)+'\n');}catch(e){console.error('[DEBUG] Log write error:',e.message);}
    // #endregion
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
}

// Middleware to check if user is admin or instructor
function isAdmin(req, res, next) {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'instructor')) {
    next();
  } else {
    res.status(403).json({ error: 'Access denied: Requires Admin or Instructor role' });
  }
}

module.exports = router;
module.exports.authenticateToken = authenticateToken;
module.exports.isAdmin = isAdmin;

