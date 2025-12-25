const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const videoRoutes = require('./routes/videos');
const quizRoutes = require('./routes/quizzes');
const examRoutes = require('./routes/exams');
const analyticsRoutes = require('./routes/analytics');
const evaluationRoutes = require('./routes/evaluations');
const adminRoutes = require('./routes/admin');
const assignmentRoutes = require('./routes/assignments');
const discussionRoutes = require('./routes/discussions');
const announcementRoutes = require('./routes/announcements');
const fileRoutes = require('./routes/files');
const calendarRoutes = require('./routes/calendar');
const notificationRoutes = require('./routes/notifications');
const messageRoutes = require('./routes/messages');
const certificateRoutes = require('./routes/certificates');
const gradeRoutes = require('./routes/grades');
const practicalRoutes = require('./routes/practical');
const adminExportRoutes = require('./routes/admin-export');
const roomRoutes = require('./routes/rooms');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
// CORS configuration - allow all origins in development, restrict in production
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (process.env.NODE_ENV === 'production') {
      const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];
      // Allow Vercel preview and production domains
      const vercelPattern = /\.vercel\.app$/;
      
      if (allowedOrigins.includes(origin) || vercelPattern.test(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    } else {
      // Development: allow all origins
      callback(null, true);
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize database
const db = require('./database/init');

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/evaluations', evaluationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/discussions', discussionRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/grades', gradeRoutes);
app.use('/api/practical', practicalRoutes);
app.use('/api/admin/export', adminExportRoutes);
app.use('/api/rooms', roomRoutes);

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'PIM Learning Platform API is running',
    timestamp: new Date().toISOString()
  });
});

// Root route
app.get('/', (req, res) => {
  const html = `
    <!DOCTYPE html>
    <html lang="th">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>PIM Learning Platform API</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 20px;
        }
        .container {
          background: white;
          border-radius: 20px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
          padding: 40px;
          max-width: 800px;
          width: 100%;
        }
        h1 {
          color: #667eea;
          margin-bottom: 10px;
          font-size: 2.5em;
        }
        .subtitle {
          color: #666;
          margin-bottom: 30px;
          font-size: 1.1em;
        }
        .version {
          display: inline-block;
          background: #667eea;
          color: white;
          padding: 5px 15px;
          border-radius: 20px;
          font-size: 0.9em;
          margin-bottom: 30px;
        }
        .endpoints {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 15px;
          margin-top: 20px;
        }
        .endpoint {
          background: #f8f9fa;
          padding: 15px;
          border-radius: 10px;
          border-left: 4px solid #667eea;
          transition: transform 0.2s;
        }
        .endpoint:hover {
          transform: translateX(5px);
          box-shadow: 0 5px 15px rgba(102, 126, 234, 0.2);
        }
        .endpoint-label {
          color: #667eea;
          font-weight: bold;
          margin-bottom: 5px;
          text-transform: uppercase;
          font-size: 0.85em;
        }
        .endpoint-path {
          color: #333;
          font-family: 'Courier New', monospace;
          font-size: 0.9em;
        }
        .status {
          display: inline-block;
          background: #28a745;
          color: white;
          padding: 8px 20px;
          border-radius: 25px;
          margin-top: 20px;
          font-weight: bold;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>📚 PIM Learning Platform API</h1>
        <p class="subtitle">API Server สำหรับระบบการเรียนรู้ มหาวิทยาลัยปัญญาภิวัฒน์</p>
        <span class="version">Version 1.0.0</span>
        
        <h2 style="color: #333; margin-top: 30px; margin-bottom: 15px;">Available Endpoints:</h2>
        <div class="endpoints">
          <div class="endpoint">
            <div class="endpoint-label">Health Check</div>
            <div class="endpoint-path">/api/health</div>
          </div>
          <div class="endpoint">
            <div class="endpoint-label">Authentication</div>
            <div class="endpoint-path">/api/auth</div>
          </div>
          <div class="endpoint">
            <div class="endpoint-label">Videos</div>
            <div class="endpoint-path">/api/videos</div>
          </div>
          <div class="endpoint">
            <div class="endpoint-label">Quizzes</div>
            <div class="endpoint-path">/api/quizzes</div>
          </div>
          <div class="endpoint">
            <div class="endpoint-label">Exams</div>
            <div class="endpoint-path">/api/exams</div>
          </div>
          <div class="endpoint">
            <div class="endpoint-label">Analytics</div>
            <div class="endpoint-path">/api/analytics</div>
          </div>
          <div class="endpoint">
            <div class="endpoint-label">Evaluations</div>
            <div class="endpoint-path">/api/evaluations</div>
          </div>
          <div class="endpoint">
            <div class="endpoint-label">Admin</div>
            <div class="endpoint-path">/api/admin</div>
          </div>
          <div class="endpoint">
            <div class="endpoint-label">Assignments</div>
            <div class="endpoint-path">/api/assignments</div>
          </div>
          <div class="endpoint">
            <div class="endpoint-label">Discussions</div>
            <div class="endpoint-path">/api/discussions</div>
          </div>
          <div class="endpoint">
            <div class="endpoint-label">Announcements</div>
            <div class="endpoint-path">/api/announcements</div>
          </div>
          <div class="endpoint">
            <div class="endpoint-label">Files</div>
            <div class="endpoint-path">/api/files</div>
          </div>
          <div class="endpoint">
            <div class="endpoint-label">Calendar</div>
            <div class="endpoint-path">/api/calendar</div>
          </div>
          <div class="endpoint">
            <div class="endpoint-label">Notifications</div>
            <div class="endpoint-path">/api/notifications</div>
          </div>
          <div class="endpoint">
            <div class="endpoint-label">Messages</div>
            <div class="endpoint-path">/api/messages</div>
          </div>
          <div class="endpoint">
            <div class="endpoint-label">Certificates</div>
            <div class="endpoint-path">/api/certificates</div>
          </div>
          <div class="endpoint">
            <div class="endpoint-label">Grades</div>
            <div class="endpoint-path">/api/grades</div>
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 30px;">
          <span class="status">✅ Server is running</span>
        </div>
      </div>
    </body>
    </html>
  `;
  res.send(html);
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'PIM Learning Platform API' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📚 PIM Learning Platform API`);
});

