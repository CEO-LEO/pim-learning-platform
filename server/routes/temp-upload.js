// Temporary upload endpoint for uploading videos to Railway Volume
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Setup multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadsDir = path.join(__dirname, '../uploads/videos');
        // Create directory if it doesn't exist
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    }
});

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 500 * 1024 * 1024 // 500MB limit
    }
});

// Upload endpoint
router.post('/upload', upload.single('video'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        
        console.log(`✓ Uploaded: ${req.file.filename} (${(req.file.size / 1024 / 1024).toFixed(2)} MB)`);
        
        res.json({
            success: true,
            filename: req.file.filename,
            size: req.file.size,
            sizeInMB: (req.file.size / 1024 / 1024).toFixed(2)
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Status endpoint
router.get('/status', (req, res) => {
    try {
        const uploadsDir = path.join(__dirname, '../uploads/videos');
        
        if (!fs.existsSync(uploadsDir)) {
            return res.json({ 
                status: 'ready',
                filesInVolume: 0,
                files: []
            });
        }
        
        const files = fs.readdirSync(uploadsDir);
        const videoFiles = files.filter(f => f.endsWith('.mp4'));
        
        const fileDetails = videoFiles.map(f => {
            const stats = fs.statSync(path.join(uploadsDir, f));
            return {
                name: f,
                size: stats.size,
                sizeInMB: (stats.size / 1024 / 1024).toFixed(2)
            };
        });
        
        res.json({
            status: 'ready',
            filesInVolume: videoFiles.length,
            files: fileDetails
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;

