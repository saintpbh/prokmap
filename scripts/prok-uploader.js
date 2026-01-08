const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const https = require('https');

// PROK Credentials
const PROK_ID = '관리자(국제)';
const PROK_PW = '123456';
const UPLOAD_URL = 'https://www.prok.org/Board/Index/82382';

// -------------------------------------------------------------
// Helper: Download File
// -------------------------------------------------------------
async function downloadFile(url, dest) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest);
        https.get(url, (response) => {
            if (response.statusCode >= 300 && response.headers.location) {
                // Handle Redirect
                return downloadFile(response.headers.location, dest).then(resolve).catch(reject);
            }
            response.pipe(file);
            file.on('finish', () => {
                file.close(() => resolve(dest));
            });
        }).on('error', (err) => {
            fs.unlink(dest, () => reject(err));
        });
    });
}

// -------------------------------------------------------------
// Main Script
// -------------------------------------------------------------
(async () => {
    // 1. Process Args
    const dataFile = process.argv[2];
    if (!dataFile) {
        console.error("Usage: npm run upload-prok -- <path-to-json-file>");
        console.error("Example: npm run upload-prok -- data.json");
        process.exit(1);
    }

    const absPath = path.resolve(dataFile);
    if (!fs.existsSync(absPath)) {
        console.error(`File not found: ${absPath}`);
        process.exit(1);
    }

    // Expecting array of objects or single object
    let uploadData = JSON.parse(fs.readFileSync(absPath, 'utf8'));
    if (!Array.isArray(uploadData)) uploadData = [uploadData];

    console.log(`🚀 Starting PROK Uploader for ${uploadData.length} items...`);

    // 2. Launch Browser
    const browser = await puppeteer.launch({
        headless: false, // User wants to see it
        defaultViewport: null,
        args: ['--start-maximized']
    });

    const page = await browser.newPage();

    // ---------------------------------------------------------
    // Login Flow
    // ---------------------------------------------------------
    try {
        console.log('🔑 Logging in...');

        // Strategy: Go directly to what acts as login page or board
        await page.goto(UPLOAD_URL, { waitUntil: 'domcontentloaded' });

        // 1. Try to find Login Link
        // Look for any anchor containing "로그인" or "Login"
        const foundLogin = await page.evaluate(() => {
            const anchors = Array.from(document.querySelectorAll('a'));
            const loginLink = anchors.find(a => a.innerText.includes('로그인') || a.innerText.includes('Login'));
            if (loginLink) {
                loginLink.click();
                return true;
            }
            return false;
        });

        if (foundLogin) {
            console.log('   Found Login link, clicking...');
        } else {
            console.log('   No direct Login link found, checking if already on Login page or logged in.');
        }

        // 2. Wait for Login Form
        const idSelector = 'input.form-control';
        try {
            // Wait longer (10s)
            await page.waitForSelector(idSelector, { timeout: 10000 });

            console.log('   Login form detected. Entering credentials...');
            await page.evaluate((id, pw) => {
                const inputs = document.querySelectorAll('input.form-control');
                // Find the input that looks like ID. Usually first one or type='text'
                if (inputs.length > 0) inputs[0].value = id;
                if (inputs.length > 1) inputs[1].value = pw;
            }, PROK_ID, PROK_PW);

            // Click Submit
            const submitBtn = await page.$('button.submit-btn');
            if (submitBtn) {
                await submitBtn.click();
                await page.waitForNavigation({ waitUntil: 'networkidle0' });
                console.log('✅ Login Submitted');
            } else {
                console.log('⚠️ Submit button not found?');
            }
        } catch (e) {
            console.log('ℹ️ Login form not found. Assuming already logged in.');
        }

    } catch (e) {
        console.error('❌ Login Step Failed:', e);
    }

    // ---------------------------------------------------------
    // Upload Loop
    // ---------------------------------------------------------
    for (const item of uploadData) {
        console.log(`📋 Processing: ${item.name} (${item.country})`);

        try {
            // Navigate to Write Page
            await page.goto('https://www.prok.org/Board/Write/82382', { waitUntil: 'load' });

            // 1. Title
            const title = `[${item.country}] ${item.name} 선교사`;
            await page.type('input.form-control.required[placeholder="제목을 입력해주세요."]', title);

            // 2. Content (CKEditor)
            // Construct Content
            let contentHtml = `<p>${item.summary.replace(/\n/g, '<br>')}</p>`;
            if (item.link) {
                contentHtml += `<br><br><p><a href="${item.link}" target="_blank">👇 원문보기 (뉴스레터/블로그)</a></p>`;
            }

            // Inject into iframe
            const frameElement = await page.waitForSelector('iframe.cke_wysiwyg_frame');
            const frame = await frameElement.contentFrame();
            await frame.evaluate((html) => {
                document.body.innerHTML = html;
            }, contentHtml);

            // 3. File Upload
            // Wait for upload? (Sometimes progress bar)
            await new Promise(r => setTimeout(r, 2000)); // Simple wait

            // Cleanup
            // fs.unlinkSync(localPath); // Keep for debug for now
        }

            // 4. Submit
            await page.click('button.submit-btn'); // UNCOMMENT TO ACTUALLY POST
        console.log('✅ Submitted Post for:', title);
        // console.log('⚠️ [Simulation] Would click Submit now.');
        // console.log('   Title:', title);

        // Wait a bit to observe
        await new Promise(r => setTimeout(r, 2000));

    } catch (e) {
        console.error(`❌ Failed to upload for ${item.name}:`, e);
    }
}

    console.log('🎉 All tasks finished.');
    // await browser.close(); // Keep open for user verification?
}) ();
