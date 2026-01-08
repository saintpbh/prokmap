/**
 * report-upload.js
 * Handles text parsing and batch updating for missionary reports.
 */

// Global State
let parsedData = [];
let allMissionaries = [];

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Auth Check
    firebase.auth().onAuthStateChanged((user) => {
        if (!user || !adminAuth.allowedEmails.includes(user.email)) {
            window.location.href = 'login.html';
            return;
        }
        loadMissionaries(); // Load DB data for matching
    });

    // Event Listeners
    document.getElementById('parseBtn').addEventListener('click', parseText);
    document.getElementById('uploadBtn').addEventListener('click', uploadData);
});

// Load Missionaries from DB (to match names)
async function loadMissionaries() {
    try {
        allMissionaries = await firebaseDB.getMissionaries();
        console.log(`Loaded ${allMissionaries.length} missionaries for matching.`);
    } catch (e) {
        console.error('Failed to load missionaries:', e);
        AdminUtils.showToast('선교사 목록을 불러오는데 실패했습니다.', 'error');
    }
}

// ---------------------------------------------------------
// Core Parsing Logic
// ---------------------------------------------------------
function parseText() {
    const rawText = document.getElementById('rawInput').value;
    if (!rawText.trim()) {
        AdminUtils.showToast('텍스트를 입력해주세요.', 'warning');
        return;
    }

    const lines = rawText.split('\n');
    parsedData = [];

    let currentDate = '';
    let currentCountry = '';
    let currentEntry = null;

    // Regex Patterns
    const datePattern = /^\/\/\s*(.*)/; // Matches: // 2025.6 or //2025년 6월
    const countryPattern = /^\[(.*)\]/; // Matches: [인도]

    // Name Pattern: Matches "Name 선교사" or just "Name" if it matches a DB record (checked later)
    // We look for lines that seem to start a new person (not starting with -, *, digit)
    const newPersonPattern = /^([가-힣]{2,4})(\s*선교사.*)?$/;

    // Keyword Patterns
    const sectionPattern = /^(사역|기도|1\.|-|\*|⦁)\s*[:.]?/;

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trim();
        if (!line) continue;

        // 1. Check Date Header
        const dateMatch = line.match(datePattern);
        if (dateMatch) {
            // New Date Section
            currentDate = dateMatch[1].trim();
            // Reset context if needed, but usually Country follows or persists?
            // User example shows country headers appearing after date headers.
            currentCountry = '';
            continue;
        }

        // 2. Check Country Header
        const countryMatch = line.match(countryPattern);
        if (countryMatch) {
            currentCountry = countryMatch[1].trim();
            continue;
        }

        // 3. New Person Detection
        // Heuristic: If line matches "Name 선교사" OR matches a known missionary name
        // AND it's not a bullet point.
        let isNewPerson = false;
        let potentialName = '';

        // Check if it's clearly a name line
        const nameMatch = line.match(newPersonPattern);
        if (nameMatch && !line.match(/^[-*⦁]/)) {
            // It looks like a name. Let's verify against DB or "선교사" suffix
            const rawName = nameMatch[1];
            if (line.includes('선교사') || findMissionaryByName(rawName)) {
                isNewPerson = true;
                potentialName = rawName;
            }
        }

        // Special case: "Name1, Name2 선교사" -> handle later if needed. 
        // For now, assuming single line per entry head.

        if (isNewPerson) {
            // Save previous entry
            if (currentEntry) {
                parsedData.push(currentEntry);
            }

            // Start new entry
            currentEntry = {
                name: potentialName,
                rawName: line, // Full line text
                date: currentDate || 'Unknown Date',
                country: currentCountry || '',
                summary: [],
                prayer: [],
                currentSection: 'summary' // Default to summary
            };
            continue;
        }

        // 4. Content Parsing (Summary vs Prayer)
        if (currentEntry) {
            // Detect Section Switch
            if (line.startsWith('기도:')) {
                currentEntry.currentSection = 'prayer';
                // Remove '기도:' prefix from this line if content exists on same line
                const content = line.replace(/^기도:\s*/, '');
                if (content) currentEntry.prayer.push(content);
                continue;
            } else if (line.startsWith('사역:')) {
                currentEntry.currentSection = 'summary';
                const content = line.replace(/^사역:\s*/, '');
                if (content) currentEntry.summary.push(content);
                continue;
            }

            // Regular Content Line
            // Append to current section
            if (currentEntry.currentSection === 'prayer') {
                currentEntry.prayer.push(line);
            } else {
                currentEntry.summary.push(line);
            }
        }
    }

    // Push last entry
    if (currentEntry) {
        parsedData.push(currentEntry);
    }

    renderPreview();
}

function findMissionaryByName(name) {
    return allMissionaries.find(m => m.name.includes(name));
}

// ---------------------------------------------------------
// Rendering & Upload
// ---------------------------------------------------------
function renderPreview() {
    const listEl = document.getElementById('previewList');
    const countEl = document.getElementById('countDisplay');
    const uploadBtn = document.getElementById('uploadBtn');

    listEl.innerHTML = '';
    countEl.textContent = parsedData.length;
    uploadBtn.disabled = parsedData.length === 0;

    if (parsedData.length === 0) {
        listEl.innerHTML = '<div style="padding: 2rem; text-align: center; color: #999;">분석된 데이터가 없습니다.</div>';
        return;
    }

    parsedData.forEach((item, index) => {
        // Try to match with DB to show status
        const match = findMissionaryByName(item.name);
        const statusClass = match ? 'status-ok' : 'status-error';
        const matchStatus = match ? `✅ 매칭됨: ${match.name}` : '❌ 매칭 실패 (DB에 없음)';

        const div = document.createElement('div');
        div.className = 'preview-item';
        div.innerHTML = `
            <div class="preview-header">
                <span>
                    <span style="font-size:1.1em; color:#333;">${item.name}</span>
                    <small class="${statusClass}" style="margin-left: 8px; font-weight:normal;">${matchStatus}</small>
                </span>
                <span>
                    ${item.country ? `<span class="badge-country">${item.country}</span>` : ''}
                    <span class="badge-date">${item.date}</span>
                </span>
            </div>
            
            ${item.summary.length > 0 ? `
                <div style="margin-bottom: 4px; font-weight: bold; font-size: 0.85em; color: #555;">📋 사역 보고</div>
                <div class="text-preview">${item.summary.join('\n')}</div>
            ` : ''}
            
            ${item.prayer.length > 0 ? `
                <div style="margin-top: 8px; margin-bottom: 4px; font-weight: bold; font-size: 0.85em; color: #555;">🙏 기도 제목</div>
                <div class="text-preview">${item.prayer.join('\n')}</div>
            ` : ''}
        `;
        listEl.appendChild(div);
    });
}

async function uploadData() {
    if (!confirm(`총 ${parsedData.length}명의 데이터를 업데이트하시겠습니까?`)) return;

    const btn = document.getElementById('uploadBtn');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 업데이트 중...';

    let successCount = 0;
    let failCount = 0;

    try {
        for (const item of parsedData) {
            const match = findMissionaryByName(item.name);
            if (!match) {
                failCount++;
                continue;
            }

            const updates = {
                updatedAt: new Date().toISOString()
            };

            // Logic: Append summary with Date header
            // But we should be careful not to keep appending duplicates if run multiple times?
            // For batch update, we assume we just overwrite or prepend?
            // The User request 'update script' logic was: Update Summary with `[Date] Text`.

            // Let's format the summary
            if (item.summary.length > 0) {
                const summaryText = `[${item.date} 소식]\n${item.summary.join('\n')}`;
                updates.summary = summaryText;
            }

            // Update Prayer if exists (Overwrite prayerTopic is standard behavior since it's "Current Prayer")
            if (item.prayer.length > 0) {
                const prayerText = `[${item.date} 기도제목]\n${item.prayer.join('\n')}`;
                updates.prayerTopic = prayerText;
            }

            await firebaseDB.updateMissionary(match.id, updates);
            successCount++;
        }

        AdminUtils.showToast(`업데이트 완료! 성공: ${successCount}, 실패: ${failCount}`, 'success');

        // Clear input after success?
        // document.getElementById('rawInput').value = '';
        // parsedData = [];
        // renderPreview();

    } catch (e) {
        console.error("Update failed:", e);
        AdminUtils.showToast('업데이트 중 오류가 발생했습니다.', 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-cloud-upload-alt"></i> DB 업데이트';
    }
}
