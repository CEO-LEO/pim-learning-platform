const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { authenticateToken } = require('./auth');

// Stream video files with proper headers
// Support both authenticated (with token) and query parameter token (for video element)
router.get('/:filename', (req, res, next) => {
  // Set CORS headers before authentication
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Range, Authorization');
  res.setHeader('Access-Control-Expose-Headers', 'Content-Range, Accept-Ranges, Content-Length');
  
  // Handle OPTIONS request for CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Log request for debugging
  console.log('[VideoStream] Request received:', {
    filename: req.params.filename,
    method: req.method,
    hasAuthHeader: !!req.headers.authorization,
    hasTokenQuery: !!req.query.token,
    range: req.headers.range
  });
  
  // Try to authenticate - check Authorization header first, then query parameter
  const authHeader = req.headers.authorization;
  const tokenFromQuery = req.query.token;
  
  // If token is in query parameter, add it to Authorization header
  if (tokenFromQuery && !authHeader) {
    req.headers.authorization = `Bearer ${tokenFromQuery}`;
    console.log('[VideoStream] Token from query parameter added to Authorization header');
  }
  
  // Use standard authentication middleware
  authenticateToken(req, res, next);
}, (req, res) => {
  const { filename } = req.params;
  const videoPath = path.join(__dirname, '..', 'uploads', 'videos', filename);
  
  console.log('[VideoStream] Processing video request:', {
    filename,
    videoPath,
    cwd: process.cwd(),
    __dirname
  });
  
  // Security: prevent directory traversal
  if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    console.error('[VideoStream] Invalid filename detected:', filename);
    return res.status(400).json({ error: 'Invalid filename' });
  }
  
  // Check if file exists
  const fileExists = fs.existsSync(videoPath);
  
  if (!fileExists) {
    console.error(`[VideoStream] Video file not found: ${videoPath}`);
    console.error(`[VideoStream] Current directory: ${process.cwd()}`);
    console.error(`[VideoStream] __dirname: ${__dirname}`);
    console.error(`[VideoStream] Uploads directory exists: ${fs.existsSync(path.join(__dirname, '..', 'uploads'))}`);
    console.error(`[VideoStream] Videos directory exists: ${fs.existsSync(path.join(__dirname, '..', 'uploads', 'videos'))}`);
    if (fs.existsSync(path.join(__dirname, '..', 'uploads', 'videos'))) {
      try {
        const files = fs.readdirSync(path.join(__dirname, '..', 'uploads', 'videos'));
        console.error(`[VideoStream] Files in videos directory (${files.length}): ${files.slice(0, 10).join(', ')}`);
      } catch (err) {
        console.error(`[VideoStream] Error reading videos directory: ${err.message}`);
      }
    }
    // Try alternative paths (in case of different deployment structure)
    const altPaths = [
      path.join(process.cwd(), 'server', 'uploads', 'videos', filename),
      path.join(process.cwd(), 'uploads', 'videos', filename),
      path.join(__dirname, '..', '..', 'uploads', 'videos', filename)
    ];
    
    for (const altPath of altPaths) {
      if (fs.existsSync(altPath)) {
        console.log(`[VideoStream] Found video at alternative path: ${altPath}`);
        return streamVideo(altPath, req, res);
      }
    }
    
    // If still not found, return detailed error with more diagnostic info
    const diagnosticInfo = {
      error: 'Video file not found',
      filename,
      videoPath,
      cwd: process.cwd(),
      __dirname: __dirname,
      message: 'Video file may not be deployed. Check Railway logs for Git LFS pull status.',
      troubleshooting: {
        checkGitLFS: 'Verify Git LFS pull succeeded in Railway build logs',
        checkPath: 'Verify video files are in server/uploads/videos/ directory',
        checkRailwayVolume: 'Consider using Railway volumes for persistent file storage'
      }
    };
    
    console.error('[VideoStream] Detailed 404 error:', JSON.stringify(diagnosticInfo, null, 2));
    
    return res.status(404).json(diagnosticInfo);
  }
  
  streamVideo(videoPath, req, res);
});

function streamVideo(videoPath, req, res) {
  const stat = fs.statSync(videoPath);
  const fileSize = stat.size;
  const range = req.headers.range;
  
  console.log(`[VideoStream] Serving video: ${path.basename(videoPath)}, size: ${fileSize}, range: ${range || 'none'}`);
  
  // Set CORS headers for video streaming
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Range, Authorization');
  res.setHeader('Access-Control-Expose-Headers', 'Content-Range, Accept-Ranges, Content-Length');
  
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
      'Cache-Control': 'public, max-age=31536000',
    };
    res.writeHead(206, head);
    file.pipe(res);
  } else {
    // Full file request
    const head = {
      'Content-Length': fileSize,
      'Content-Type': 'video/mp4',
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'public, max-age=31536000',
    };
    res.writeHead(200, head);
    fs.createReadStream(videoPath).pipe(res);
  }
}

module.exports = router;

