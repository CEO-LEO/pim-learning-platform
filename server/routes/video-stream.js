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
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    // Use standard authentication middleware
    return authenticateToken(req, res, next);
  } else if (tokenFromQuery) {
    // Support token in query parameter for video element (can't send custom headers)
    req.headers.authorization = `Bearer ${tokenFromQuery}`;
    return authenticateToken(req, res, next);
  } else {
    // No token provided
    return res.status(401).json({ error: 'Access token required' });
  }
}, (req, res) => {
  const { filename } = req.params;
  const videoPath = path.join(__dirname, '..', 'uploads', 'videos', filename);
  
  // Security: prevent directory traversal
  if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    return res.status(400).json({ error: 'Invalid filename' });
  }
  
  // Check if file exists
  if (!fs.existsSync(videoPath)) {
    return res.status(404).json({ error: 'Video file not found' });
  }
  
  const stat = fs.statSync(videoPath);
  const fileSize = stat.size;
  const range = req.headers.range;
  
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

