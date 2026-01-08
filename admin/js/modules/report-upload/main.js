import { adminAuth } from '../../core/app-init.js';
import { reportUi } from './ui.js';
import { reportApi } from './api.js';
import { state } from './state.js';
import { AdminUtils } from '../../core/utils.js';

document.addEventListener('DOMContentLoaded', () => {
    initReportUploadPage();
});

async function initReportUploadPage() {
    firebase.auth().onAuthStateChanged(async (user) => {
        if (user && adminAuth.allowedEmails.includes(user.email)) {
            state.allMissionaries = await reportApi.fetchMissionaries();
            setupEventListeners();
        }
    });
}

function setupEventListeners() {
    const parseBtn = document.getElementById('parseBtn');
    if (parseBtn) {
        parseBtn.addEventListener('click', () => {
            const rawText = document.getElementById('rawInput').value;
            if (!rawText.trim()) {
                AdminUtils.showToast('텍스트를 입력해주세요.', 'warning');
                return;
            }
            state.parsedData = reportApi.parseText(rawText);
            reportUi.renderPreview();
        });
    }

    const uploadBtn = document.getElementById('uploadBtn');
    if (uploadBtn) {
        uploadBtn.addEventListener('click', async () => {
            if (!AdminUtils.confirm(`총 ${state.parsedData.length}명의 데이터를 업데이트하시겠습니까?`)) return;

            uploadBtn.disabled = true;
            const originalText = uploadBtn.innerHTML;
            uploadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 업데이트 중...';

            let successCount = 0;
            let failCount = 0;

            try {
                for (const item of state.parsedData) {
                    const match = reportApi.findMissionaryByName(item.name);
                    if (!match) {
                        failCount++;
                        continue;
                    }

                    const updates = { updatedAt: new Date().toISOString() };
                    if (item.summary.length > 0) {
                        updates.summary = `[${item.date} 소식]\n${item.summary.join('\n')}`;
                    }
                    if (item.prayer.length > 0) {
                        updates.prayerTopic = `[${item.date} 기도제목]\n${item.prayer.join('\n')}`;
                    }

                    await reportApi.updateMissionary(match.id, updates);
                    successCount++;
                }
                AdminUtils.showToast(`업데이트 완료! 성공: ${successCount}, 실패: ${failCount}`, 'success');
            } catch (error) {
                console.error("Update failed:", error);
                AdminUtils.showToast('업데이트 중 오류가 발생했습니다.', 'error');
            } finally {
                uploadBtn.disabled = false;
                uploadBtn.innerHTML = originalText;
            }
        });
    }
}
