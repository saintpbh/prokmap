const express = require('express');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const bodyParser = require('body-parser');
const multer = require('multer');

const app = express();
const PORT = 8000;

// Middleware
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '.'))); // Serve Root

// Multer Setup
const upload = multer({ dest: 'tmp/uploads/' });

// Endpoint: Upload to PROK
app.post('/api/prok-upload', upload.any(), (req, res) => {
    // req.body contains text fields (if sent as FormData, key will be array index string '0', '1'...)
    // req.files contains uploaded files

    // We expect the frontend to send FormData.
    // If sending complex JSON structure along with files, usually we stringify JSON into a field.
    // Let's assume frontend sends:
    // Field 'data' = JSON String of missionaries
    // Files with fieldname = 'file_{index}' corresponding to data array index

    let uploadData = [];
    try {
        if (req.body.data) {
            uploadData = JSON.parse(req.body.data);
        } else {
            // Fallback for raw JSON body (previous version)
            uploadData = req.body;
        }
    } catch (e) {
        return res.status(400).json({ success: false, message: 'Invalid JSON data' });
    }

    if (!Array.isArray(uploadData)) {
        return res.status(400).json({ success: false, message: 'Data must be array' });
    }

    // Map files to data items
    if (req.files && req.files.length > 0) {
        req.files.forEach(file => {
            // Fieldname expected: "file_0", "file_1" etc.
            const match = file.fieldname.match(/file_(\d+)/);
            if (match) {
                const index = parseInt(match[1]);
                if (uploadData[index]) {
                    uploadData[index].localFilePath = path.resolve(file.path);
                    uploadData[index].originalFileName = file.originalname;
                }
            }
        });
    }

    console.log(`[API] Received upload request for ${uploadData.length} items`);

    // 1. Write request to tmp file
    const tmpDir = path.join(__dirname, 'tmp');
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir);

    const reqFile = path.join(tmpDir, `req_${Date.now()}.json`);
    fs.writeFileSync(reqFile, JSON.stringify(uploadData, null, 2));

    // 2. Spawn Scripts
    // Note: 'node' executable must be in path
    const scriptPath = path.join(__dirname, 'scripts', 'prok-uploader.js');
    const child = spawn('node', [scriptPath, reqFile]);

    let output = '';
    let errorOutput = '';

    child.stdout.on('data', (data) => {
        output += data.toString();
        // console.log(`[Script] ${data}`);
    });

    child.stderr.on('data', (data) => {
        errorOutput += data.toString();
        console.error(`[Script Error] ${data}`);
    });

    child.on('close', (code) => {
        // Clean up tmp file
        // fs.unlinkSync(reqFile); 

        // Clean up uploaded files? 
        // Ideally yes, but maybe keep for debug or let script clean up.
        // For now, leave them.

        if (code === 0) {
            console.log('[API] Script completed successfully');
            res.json({ success: true, log: output });
        } else {
            console.error(`[API] Script exited with code ${code}`);
            res.status(500).json({ success: false, message: 'Script failed', log: output + '\n' + errorOutput });
        }
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
    console.log(`📂 Serving static files from ${__dirname}`);
});
