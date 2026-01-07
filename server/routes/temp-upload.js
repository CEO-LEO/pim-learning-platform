const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Use Railway Volume mount path
const uploadsDir = process.env.RAILWAY_VOLUME_MOUNT_PATH || path.join(__dirname, '..', 'uploads', 'videos');

// Ensure directory exists
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 500 * 1024 * 1024 }
});

router.post('/upload', upload.single('video'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        
        console.log(`✓ Uploaded: ${req.file.filename} (${(req.file.size / 1024 / 1024).toFixed(2)} MB) to ${uploadsDir}`);
        
        res.json({
            success: true,
            filename: req.file.filename,
            size: req.file.size,
            sizeInMB: (req.file.size / 1024 / 1024).toFixed(2),
            path: req.file.path
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: error.message });
    }
});

router.get('/status', (req, res) => {
    try {
        if (!fs.existsSync(uploadsDir)) {
            return res.json({ status: 'ready', filesInVolume: 0, files: [], uploadDir: uploadsDir });
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
            files: fileDetails,
            uploadDir: uploadsDir,
            volumeMountPath: process.env.RAILWAY_VOLUME_MOUNT_PATH
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;

