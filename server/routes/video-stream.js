const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('[VideoStream] ERROR: JWT_SECRET environment variable is not set!');
}

// Custom authentication for video streaming that handles errors gracefully
function authenticateVideoRequest(req, res, next) {
  // Set CORS headers before authentication
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Range, Authorization');
  res.setHeader('Access-Control-Expose-Headers', 'Content-Range, Accept-Ranges, Content-Length, Content-Type');
  
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
  
  // Enhanced logging
  console.log('[VideoStream] Request received:', {
    filename: req.params.filename,
    method: req.method,
    hasAuthHeader: !!authHeader,
    hasTokenQuery: !!tokenFromQuery,
    range: req.headers.range
  });
  
  // If token is in query parameter, add it to Authorization header
  if (tokenFromQuery && !authHeader) {
    req.headers.authorization = `Bearer ${tokenFromQuery}`;
    console.log('[VideoStream] Token from query parameter added to Authorization header');
  }
  
  // Extract token
  const token = (authHeader && authHeader.split(' ')[1]) || tokenFromQuery;
  
  if (!token) {
    console.error('[VideoStream] No token provided');
    console.error('[VideoStream] Request details:', {
      url: req.url,
      query: req.query,
      headers: {
        authorization: req.headers.authorization ? 'present' : 'missing',
        range: req.headers.range
      }
    });
    return res.status(401).json({ error: 'Access token required' });
  }
  
  if (!JWT_SECRET) {
    console.error('[VideoStream] JWT_SECRET is not configured');
    return res.status(500).json({ error: 'Server configuration error' });
  }
  
  // Verify token
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      console.error('[VideoStream] Token verification failed:', err.message);
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
}

// Stream video files with proper headers
// Support both authenticated (with token) and query parameter token (for video element)
// Support both GET and HEAD requests
router.get('/:filename', authenticateVideoRequest, handleVideoRequest);
router.head('/:filename', authenticateVideoRequest, handleVideoRequest);

function handleVideoRequest(req, res) {
  const { filename } = req.params;
  // Use /app/server/uploads/videos for Railway Volume
  const videoPath = process.env.RAILWAY_VOLUME_MOUNT_PATH 
    ? path.join(process.env.RAILWAY_VOLUME_MOUNT_PATH, filename)
    : path.join(__dirname, '..', 'uploads', 'videos', filename);
  
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
  
  // Check if file is an LFS pointer (very small file with LFS pointer content)
  if (fileExists) {
    try {
      const stats = fs.statSync(videoPath);
      if (stats.size < 200) {
        // Check if it's an LFS pointer
        const content = fs.readFileSync(videoPath, 'utf8');
        if (content.includes('version https://git-lfs.github.com/spec/v1')) {
          console.error(`[VideoStream] File is an LFS pointer, not actual video: ${filename}`);
          return res.status(404).json({
            error: 'Video file not available',
            message: 'Video file is a Git LFS pointer and was not pulled during deployment',
            filename: filename,
            troubleshooting: {
              issue: 'Git LFS files were not pulled during Railway build',
              solutions: [
                'Check Railway build logs for Git LFS pull errors',
                'Use Railway Volumes to store video files',
                'Use external storage (S3, Cloudflare R2) for video files',
                'Ensure Git LFS is properly configured in repository'
              ]
            }
          });
        }
      }
    } catch (err) {
      console.error(`[VideoStream] Error checking file: ${err.message}`);
    }
  }
  
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
}

// Get content type based on file extension
function getContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const contentTypes = {
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.mov': 'video/quicktime',
    '.avi': 'video/x-msvideo',
    '.mkv': 'video/x-matroska',
    '.m4v': 'video/mp4',
    '.flv': 'video/x-flv',
    '.ogv': 'video/ogg'
  };
  return contentTypes[ext] || 'video/mp4'; // Default to mp4
}

function streamVideo(videoPath, req, res) {
  const stat = fs.statSync(videoPath);
  const fileSize = stat.size;
  const range = req.headers.range;
  const contentType = getContentType(videoPath);
  const isHeadRequest = req.method === 'HEAD';
  
2  console.log(`[VideoStream] Serving video: ${path.basename(videoPath)}, method: ${req.method}, size: ${fileSize}, range: ${range || 'none'}, content-type: ${contentType}`);
  
  // Set CORS headers for video streaming
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Range, Authorization');
  res.setHeader('Access-Control-Expose-Headers', 'Content-Range, Accept-Ranges, Content-Length, Content-Type');
  
  if (range) {
    // Support range requests for video streaming
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunksize = (end - start) + 1;
    const head = {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=31536000',
    };
    res.writeHead(206, head);
    if (!isHeadRequest) {
      const file = fs.createReadStream(videoPath, { start, end });
      file.pipe(res);
    } else {
      res.end();
    }
  } else {
    // Full file request
    const head = {
      'Content-Length': fileSize,
      'Content-Type': contentType,
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'public, max-age=31536000',
    };
    res.writeHead(200, head);
    if (!isHeadRequest) {
      fs.createReadStream(videoPath).pipe(res);
    } else {
      res.end();
    }
  }
}

module.exports = router;

