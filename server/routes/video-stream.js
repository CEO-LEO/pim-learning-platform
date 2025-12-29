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
  
  // #region agent log
  const fs = require('fs');
  const path = require('path');
  const logPath = path.join(process.cwd(), '.cursor', 'debug.log');
  const logData1 = {location:'video-stream.js:31',message:'VideoStream middleware entry',data:{filename:req.params.filename,hasAuthHeader:!!authHeader,hasTokenQuery:!!tokenFromQuery,tokenQueryLength:tokenFromQuery?.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'};
  console.log('[DEBUG]', JSON.stringify(logData1));
  try{const logDir = path.dirname(logPath); if(!fs.existsSync(logDir))fs.mkdirSync(logDir,{recursive:true}); fs.appendFileSync(logPath,JSON.stringify(logData1)+'\n');}catch(e){console.error('[DEBUG] Log write error:',e.message);}
  // #endregion
  
  // If token is in query parameter, add it to Authorization header
  if (tokenFromQuery && !authHeader) {
    req.headers.authorization = `Bearer ${tokenFromQuery}`;
    console.log('[VideoStream] Token from query parameter added to Authorization header');
    // #region agent log
    const logData2 = {location:'video-stream.js:36',message:'Token from query added to header',data:{hasTokenQuery:!!tokenFromQuery},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'};
    console.log('[DEBUG]', JSON.stringify(logData2));
    try{const logDir = path.dirname(logPath); if(!fs.existsSync(logDir))fs.mkdirSync(logDir,{recursive:true}); fs.appendFileSync(logPath,JSON.stringify(logData2)+'\n');}catch(e){console.error('[DEBUG] Log write error:',e.message);}
    // #endregion
  }
  
  // Use standard authentication middleware
  authenticateToken(req, res, next);
}, (req, res) => {
  const { filename } = req.params;
  const videoPath = path.join(__dirname, '..', 'uploads', 'videos', filename);
  const logPath = path.join(process.cwd(), '.cursor', 'debug.log');
  
  console.log('[VideoStream] Processing video request:', {
    filename,
    videoPath,
    cwd: process.cwd(),
    __dirname
  });
  
  // #region agent log
  const logData3 = {location:'video-stream.js:44',message:'VideoStream processing request',data:{filename,videoPath,cwd:process.cwd(),__dirname},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'};
  console.log('[DEBUG]', JSON.stringify(logData3));
  try{const logDir = path.dirname(logPath); if(!fs.existsSync(logDir))fs.mkdirSync(logDir,{recursive:true}); fs.appendFileSync(logPath,JSON.stringify(logData3)+'\n');}catch(e){console.error('[DEBUG] Log write error:',e.message);}
  // #endregion
  
  // Security: prevent directory traversal
  if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    console.error('[VideoStream] Invalid filename detected:', filename);
    // #region agent log
    const logData4 = {location:'video-stream.js:54',message:'Invalid filename detected',data:{filename},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'};
    console.log('[DEBUG]', JSON.stringify(logData4));
    try{const logDir = path.dirname(logPath); if(!fs.existsSync(logDir))fs.mkdirSync(logDir,{recursive:true}); fs.appendFileSync(logPath,JSON.stringify(logData4)+'\n');}catch(e){console.error('[DEBUG] Log write error:',e.message);}
    // #endregion
    return res.status(400).json({ error: 'Invalid filename' });
  }
  
  // Check if file exists
  const fileExists = fs.existsSync(videoPath);
  // #region agent log
  const logData5 = {location:'video-stream.js:60',message:'Checking file existence',data:{filename,videoPath,fileExists},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'};
  console.log('[DEBUG]', JSON.stringify(logData5));
  try{const logDir = path.dirname(logPath); if(!fs.existsSync(logDir))fs.mkdirSync(logDir,{recursive:true}); fs.appendFileSync(logPath,JSON.stringify(logData5)+'\n');}catch(e){console.error('[DEBUG] Log write error:',e.message);}
  // #endregion
  
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

