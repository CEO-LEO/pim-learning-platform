// Suppress deprecation warnings from dependencies
process.removeAllListeners('warning');
process.on('warning', (warning) => {
  // Only suppress fs.F_OK deprecation warnings
  if (warning.name === 'DeprecationWarning' && warning.message.includes('fs.F_OK')) {
    return; // Suppress this specific warning
  }
  // Show other warnings
  console.warn(warning.name, warning.message);
});

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
const videoStreamRoutes = require('./routes/video-stream');

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

// Video streaming route (with authentication)
app.use('/api/videos/stream', videoStreamRoutes);

// Serve uploaded files (public access for now, can be secured later)
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  setHeaders: (res, filePath) => {
    // Set proper headers for video files
    if (filePath.endsWith('.mp4') || filePath.endsWith('.webm') || filePath.endsWith('.mov')) {
      res.setHeader('Content-Type', 'video/mp4');
      res.setHeader('Accept-Ranges', 'bytes');
    }
  }
}));

// Health check endpoint
app.get('/api/health', (req, res) => {
  const fs = require('fs');
  const path = require('path');
  // Use Railway Volume mount path if available
  const videosPath = process.env.RAILWAY_VOLUME_MOUNT_PATH || path.join(__dirname, 'uploads', 'videos');
  
  let videoFiles = [];
  let videoFilesExist = false;
  let allFiles = [];
  
  try {
    if (fs.existsSync(videosPath)) {
      allFiles = fs.readdirSync(videosPath);
      videoFiles = allFiles.filter(f => f.endsWith('.mp4') || f.endsWith('.webm') || f.endsWith('.mov'));
      videoFilesExist = videoFiles.length > 0;
    }
  } catch (err) {
    console.error('[Health] Error checking video files:', err.message);
  }
  
  // Check for Git LFS pointer files (indicates LFS files weren't pulled)
  const lfsPointers = [];
  const realVideoFiles = [];
  
  allFiles.forEach(f => {
    try {
      const filePath = path.join(videosPath, f);
      if (fs.statSync(filePath).isFile()) {
        const size = fs.statSync(filePath).size;
        if (size < 200) {
          // Check if it's an LFS pointer
          const content = fs.readFileSync(filePath, 'utf8');
          if (content.includes('version https://git-lfs.github.com/spec/v1')) {
            lfsPointers.push(f);
          }
        } else {
          // Real video file (size > 200 bytes)
          realVideoFiles.push({
            filename: f,
            size: size,
            sizeMB: (size / (1024 * 1024)).toFixed(2)
          });
        }
      }
    } catch (e) {
      // Ignore errors
    }
  });
  
  res.json({ 
    status: 'ok', 
    message: 'PIM Learning Platform API is running',
    timestamp: new Date().toISOString(),
    cwd: process.cwd(),
    __dirname: __dirname,
    videoFiles: {
      directoryExists: fs.existsSync(videosPath),
      directoryPath: videosPath,
      fileCount: videoFiles.length,
      realVideoFileCount: realVideoFiles.length,
      lfsPointerCount: lfsPointers.length,
      totalFilesInDir: allFiles.length,
      files: videoFiles.slice(0, 20), // Show first 20 files
      realFiles: realVideoFiles.slice(0, 20), // Show real video files with sizes
      allFiles: allFiles.slice(0, 10), // Show all files for debugging
      hasFiles: videoFilesExist,
      hasLfsPointers: lfsPointers.length > 0,
      lfsPointers: lfsPointers, // Show all LFS pointer files
      warning: lfsPointers.length > 0 ? `${lfsPointers.length} files are LFS pointers and need to be replaced with actual video files` : null
    },
    env: {
      NODE_ENV: process.env.NODE_ENV,
      PORT: process.env.PORT,
      hasJwtSecret: !!process.env.JWT_SECRET
    },
    warning: videoFilesExist ? null : 'No video files found. Git LFS pull may have failed or files not deployed.'
  });
});

// Diagnostic endpoint for video URL testing
app.get('/api/diagnose/video/:videoId', require('./routes/auth').authenticateToken, (req, res) => {
  const db = require('./database/init');
  const { videoId } = req.params;
  const fs = require('fs');
  const path = require('path');
  
  db.get('SELECT * FROM videos WHERE video_id = ?', [videoId], (err, video) => {
    if (err) {
      return res.status(500).json({ error: 'Database error', details: err.message });
    }
    
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }
    
    // Check if video file exists
    let filename = video.url;
    if (filename && filename.includes('/')) {
      filename = filename.split('/').pop();
    }
    
    const videosDir = process.env.RAILWAY_VOLUME_MOUNT_PATH || path.join(__dirname, 'uploads', 'videos');
    const videoPath = path.join(videosDir, filename);
    const fileExists = fs.existsSync(videoPath);
    
    res.json({
      video: {
        video_id: video.video_id,
        title: video.title,
        url: video.url,
        urlType: typeof video.url,
        urlLength: video.url?.length,
        hasUrl: !!video.url
      },
      filename: filename,
      fileCheck: {
        expectedPath: videoPath,
        exists: fileExists,
        directoryExists: fs.existsSync(videosDir)
      },
      constructedUrl: {
        base: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
        streamUrl: `${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/videos/stream/${filename}`
      }
    });
  });
});

// Comprehensive video diagnostic endpoint - check all videos
app.get('/api/diagnose/videos/all', require('./routes/auth').authenticateToken, (req, res) => {
  const db = require('./database/init');
  const fs = require('fs');
  const path = require('path');
  
  // Check if user is admin
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  // Use Railway Volume mount path if available
  const videosPath = process.env.RAILWAY_VOLUME_MOUNT_PATH || path.join(__dirname, 'uploads', 'videos');
  const videosDirExists = fs.existsSync(videosPath);
  
  // Get all video files on server
  let serverFiles = [];
  if (videosDirExists) {
    try {
      serverFiles = fs.readdirSync(videosPath).filter(f => {
        const filePath = path.join(videosPath, f);
        return fs.statSync(filePath).isFile() && 
               (f.endsWith('.mp4') || f.endsWith('.webm') || f.endsWith('.mov'));
      });
    } catch (err) {
      console.error('[Diagnose] Error reading videos directory:', err);
    }
  }
  
  // Get all videos from database
  db.all('SELECT video_id, module_id, title, url, duration, order_index FROM videos ORDER BY module_id, order_index', [], (err, dbVideos) => {
    if (err) {
      return res.status(500).json({ error: 'Database error', details: err.message });
    }
    
    // Check each video
    const videoChecks = dbVideos.map(video => {
      let filename = video.url;
      if (filename && filename.includes('/')) {
        filename = filename.split('/').pop();
      }
      
      const videosDir = process.env.RAILWAY_VOLUME_MOUNT_PATH || path.join(__dirname, 'uploads', 'videos');
      const videoPath = path.join(videosDir, filename || '');
      const fileExists = filename ? fs.existsSync(videoPath) : false;
      
      let fileSize = 0;
      if (fileExists) {
        try {
          fileSize = fs.statSync(videoPath).size;
        } catch (e) {
          // Ignore
        }
      }
      
      return {
        video_id: video.video_id,
        title: video.title,
        module_id: video.module_id,
        order_index: video.order_index,
        database: {
          url: video.url,
          hasUrl: !!video.url,
          filename: filename || null
        },
        file: {
          exists: fileExists,
          path: videoPath,
          size: fileSize,
          sizeMB: fileSize > 0 ? (fileSize / (1024 * 1024)).toFixed(2) : 0
        },
        status: fileExists ? 'OK' : (video.url ? 'MISSING_FILE' : 'NO_URL')
      };
    });
    
    // Summary
    const summary = {
      totalVideosInDb: dbVideos.length,
      videosWithUrl: dbVideos.filter(v => v.url && v.url.trim()).length,
      videosWithFile: videoChecks.filter(v => v.file.exists).length,
      videosMissingFile: videoChecks.filter(v => v.status === 'MISSING_FILE').length,
      videosNoUrl: videoChecks.filter(v => v.status === 'NO_URL').length,
      serverFiles: {
        count: serverFiles.length,
        files: serverFiles.slice(0, 50) // Show first 50 files
      },
      directoryExists: videosDirExists,
      directoryPath: videosPath
    };
    
    res.json({
      summary,
      videos: videoChecks,
      timestamp: new Date().toISOString()
    });
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

