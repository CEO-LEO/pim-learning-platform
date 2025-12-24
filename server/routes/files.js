const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { authenticateToken } = require('./auth');
const db = require('../database/init');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = 'uploads/course_files/';
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|xls|xlsx|ppt|pptx|txt|zip|rar/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

// Get all files for a module
router.get('/module/:moduleId', authenticateToken, (req, res) => {
  const { moduleId } = req.params;
  
  db.all(
    `SELECT f.*, u.name as uploaded_by_name
     FROM course_files f
     LEFT JOIN users u ON f.uploaded_by = u.user_id
     WHERE f.module_id = ?
     ORDER BY f.uploaded_at DESC`,
    [moduleId],
    (err, files) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(files);
    }
  );
});

// Upload file (admin/instructor only)
router.post('/upload', authenticateToken, upload.single('file'), (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'instructor') {
    return res.status(403).json({ error: 'Permission denied' });
  }

  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const { module_id, title } = req.body;
  
  if (!module_id || !title) {
    // Delete uploaded file if validation fails
    fs.unlinkSync(req.file.path);
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const fileId = uuidv4();
  const fileSize = req.file.size;
  const fileType = path.extname(req.file.originalname).substring(1);
  
  db.run(
    `INSERT INTO course_files (file_id, module_id, title, file_path, file_type, file_size, uploaded_by)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [fileId, module_id, title, req.file.path, fileType, fileSize, req.user.userId],
    function(err) {
      if (err) {
        fs.unlinkSync(req.file.path);
        return res.status(500).json({ error: 'Failed to save file record' });
      }
      
      res.json({
        file_id: fileId,
        title,
        file_path: req.file.path,
        file_type: fileType,
        file_size: fileSize,
        message: 'File uploaded successfully'
      });
    }
  );
});

// Download file
router.get('/download/:fileId', authenticateToken, (req, res) => {
  const { fileId } = req.params;
  
  db.get(
    'SELECT file_path, title FROM course_files WHERE file_id = ?',
    [fileId],
    (err, file) => {
      if (err || !file) {
        return res.status(404).json({ error: 'File not found' });
      }

      if (!fs.existsSync(file.file_path)) {
        return res.status(404).json({ error: 'File does not exist on server' });
      }

      res.download(file.file_path, file.title, (err) => {
        if (err) {
          console.error('Download error:', err);
        }
      });
    }
  );
});

// Delete file (admin/instructor only)
router.delete('/:fileId', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'instructor') {
    return res.status(403).json({ error: 'Permission denied' });
  }

  const { fileId } = req.params;
  
  db.get('SELECT file_path FROM course_files WHERE file_id = ?', [fileId], (err, file) => {
    if (err || !file) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Delete file from filesystem
    if (fs.existsSync(file.file_path)) {
      fs.unlinkSync(file.file_path);
    }

    // Delete record from database
    db.run('DELETE FROM course_files WHERE file_id = ?', [fileId], function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to delete file record' });
      }
      res.json({ message: 'File deleted successfully' });
    });
  });
});

module.exports = router;

