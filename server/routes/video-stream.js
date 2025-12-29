const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { authenticateToken } = require('./auth');

// Stream video files with proper headers
// Support both authenticated (with token) and query parameter token (for video element)
router.get('/:filename', (req, res, next) => {
  // Try to authenticate - check Authorization header first, then query parameter
  const authHeader = req.headers.authorization;
  const tokenFromQuery = req.query.token;
  
  // If token is in query parameter, add it to Authorization header
  if (tokenFromQuery && !authHeader) {
    req.headers.authorization = `Bearer ${tokenFromQuery}`;
  }
  
  // Use standard authentication middleware
  authenticateToken(req, res, next);
}, (req, res) => {
  const { filename } = req.params;
  const videoPath = path.join(__dirname, '..', 'uploads', 'videos', filename);
  
  // Security: prevent directory traversal
  if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    return res.status(400).json({ error: 'Invalid filename' });
  }
  
  // Check if file exists
  if (!fs.existsSync(videoPath)) {
    console.error(`[VideoStream] Video file not found: ${videoPath}`);
    console.error(`[VideoStream] Current directory: ${process.cwd()}`);
    console.error(`[VideoStream] Uploads directory exists: ${fs.existsSync(path.join(__dirname, '..', 'uploads'))}`);
    console.error(`[VideoStream] Videos directory exists: ${fs.existsSync(path.join(__dirname, '..', 'uploads', 'videos'))}`);
    if (fs.existsSync(path.join(__dirname, '..', 'uploads', 'videos'))) {
      const files = fs.readdirSync(path.join(__dirname, '..', 'uploads', 'videos'));
      console.error(`[VideoStream] Files in videos directory: ${files.join(', ')}`);
    }
    return res.status(404).json({ error: 'Video file not found', filename, videoPath });
  }
  
  const stat = fs.statSync(videoPath);
  const fileSize = stat.size;
  const range = req.headers.range;
  
  console.log(`[VideoStream] Serving video: ${filename}, size: ${fileSize}, range: ${range || 'none'}`);
  
  if (range) {
    // Support range requests for video streaming
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunksize = (end - start) + 1;
    const file = fs.createReadStream(videoPath, { start, end });
    const head = {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': 'video/mp4',
    };
    res.writeHead(206, head);
    file.pipe(res);
  } else {
    // Full file request
    const head = {
      'Content-Length': fileSize,
      'Content-Type': 'video/mp4',
    };
    res.writeHead(200, head);
    fs.createReadStream(videoPath).pipe(res);
  }
});

module.exports = router;

