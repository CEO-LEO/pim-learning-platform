// Upload videos to Railway Volume via the temp-upload endpoint
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const BACKEND_URL = 'https://pim-learning-platform-production.up.railway.app';
const VIDEOS_DIR = path.join(__dirname, 'server', 'uploads', 'videos');

// Get all video files
const videoFiles = fs.readdirSync(VIDEOS_DIR)
    .filter(f => f.endsWith('.mp4'))
    .map(f => ({
        name: f,
        path: path.join(VIDEOS_DIR, f),
        size: fs.statSync(path.join(VIDEOS_DIR, f)).size
    }));

console.log('=== Uploading Videos to Railway Volume ===\n');
console.log(`Found ${videoFiles.length} video files:\n`);

videoFiles.forEach(f => {
    const sizeMB = (f.size / 1024 / 1024).toFixed(2);
    console.log(`  - ${f.name} (${sizeMB} MB)`);
});

// Check endpoint status first
function checkEndpoint() {
    return new Promise((resolve, reject) => {
        console.log('\nChecking upload endpoint...');
        
        https.get(`${BACKEND_URL}/api/temp-upload/status`, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (res.statusCode === 200) {
                    const status = JSON.parse(data);
                    console.log('✓ Upload endpoint is ready');
                    console.log(`  Current files in volume: ${status.filesInVolume}`);
                    resolve(status);
                } else {
                    reject(new Error(`Status ${res.statusCode}: ${data}`));
                }
            });
        }).on('error', reject);
    });
}

// Upload a single file
function uploadFile(file) {
    return new Promise((resolve, reject) => {
        const sizeMB = (file.size / 1024 / 1024).toFixed(2);
        console.log(`\nUploading: ${file.name} (${sizeMB} MB)...`);
        
        const FormData = require('form-data');
        const form = new FormData();
        form.append('video', fs.createReadStream(file.path));
        
        const url = new URL(`${BACKEND_URL}/api/temp-upload/upload`);
        
        const options = {
            hostname: url.hostname,
            port: url.port || 443,
            path: url.pathname,
            method: 'POST',
            headers: form.getHeaders()
        };
        
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const result = JSON.parse(data);
                    if (result.success) {
                        console.log(`  ✓ Upload successful!`);
                        console.log(`    Server confirmed: ${result.filename} (${result.sizeInMB} MB)`);
                        resolve(result);
                    } else {
                        console.log(`  ✗ Upload failed: ${data}`);
                        reject(new Error(data));
                    }
                } catch (e) {
                    console.log(`  ✗ Upload error: ${e.message}`);
                    console.log(`  Response: ${data}`);
                    reject(e);
                }
            });
        });
        
        req.on('error', (e) => {
            console.log(`  ✗ Request error: ${e.message}`);
            reject(e);
        });
        
        form.pipe(req);
    });
}

// Main upload function
async function uploadAll() {
    try {
        // Check endpoint
        await checkEndpoint();
        
        console.log('\n=== Starting Upload ===');
        
        let uploadedCount = 0;
        let totalSize = 0;
        
        // Upload files one by one
        for (const file of videoFiles) {
            try {
                await uploadFile(file);
                uploadedCount++;
                totalSize += file.size;
                
                // Small delay between uploads
                await new Promise(resolve => setTimeout(resolve, 2000));
            } catch (error) {
                console.error(`Failed to upload ${file.name}:`, error.message);
            }
        }
        
        // Summary
        console.log('\n=== Upload Summary ===');
        console.log(`Uploaded: ${uploadedCount} / ${videoFiles.length} files`);
        const totalSizeMB = (totalSize / 1024 / 1024).toFixed(2);
        console.log(`Total size: ${totalSizeMB} MB`);
        
        // Verify
        console.log('\n=== Verifying Upload ===');
        const status = await checkEndpoint();
        if (status.files) {
            console.log('\nFiles on server:');
            status.files.forEach(f => {
                console.log(`  - ${f.name} (${f.sizeInMB} MB)`);
            });
        }
        
        console.log('\n✓ Upload process complete!');
        console.log('\nNext step: Test videos at https://pim-learning-platform.vercel.app');
        
    } catch (error) {
        console.error('\n✗ Error:', error.message);
        console.error('\nPossible issues:');
        console.error('  1. Railway deployment not complete yet (wait a few minutes)');
        console.error('  2. Upload endpoint not deployed correctly');
        console.error('  3. Network connectivity issues');
        process.exit(1);
    }
}

// Check if form-data is installed
try {
    require('form-data');
} catch (e) {
    console.error('Error: form-data package not found');
    console.error('Installing form-data...\n');
    const { execSync } = require('child_process');
    execSync('npm install form-data', { stdio: 'inherit', cwd: __dirname });
}

// Run upload
uploadAll();

