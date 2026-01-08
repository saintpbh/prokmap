/**
 * Prayer Main Module
 */
import { AdminUtils } from '../../core/utils.js';
import { adminAuth } from '../../core/app-init.js';
import { loadPrayerMissionaries, updatePrayerData } from './api.js';
import { renderPrayerList } from './ui.js';

firebase.auth().onAuthStateChanged((user) => {
    if (user && adminAuth.allowedEmails.includes(user.email)) {
        setTimeout(initPrayerPage, 500);
    }
});

async function initPrayerPage() {
    try {
        await loadPrayerMissionaries();
        renderPrayerList();
        setupEventListeners();
        console.log('🙏 Prayer Page Module initialized.');
    } catch (error) {
        console.error('Prayer Page init error:', error);
        AdminUtils.showToast('데이터 로딩 중 오류 발생', 'error');
    }
}

function setupEventListeners() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.oninput = renderPrayerList;
    }

    const form = document.getElementById('editPrayerForm');
    if (form) {
        form.onsubmit = handleSave;
    }
}

async function handleSave(e) {
    e.preventDefault();
    const id = document.getElementById('editId').value;
    const summaryPrayer = document.getElementById('editSummaryPrayer').value.trim();
    const prayerTopic = document.getElementById('editPrayerTopic').value.trim();
    const prayer = document.getElementById('editPrayerBasic').value.trim();
    const summary = document.getElementById('editSummary').value.trim();

    try {
        const btn = e.target.querySelector('button[type="submit"]');
        btn.textContent = '저장 중...';
        btn.disabled = true;

        await updatePrayerData(id, {
            summaryPrayer,
            prayerTopic,
            prayer,
            summary
        });

        AdminUtils.showToast('기도 제목이 수정되었습니다.', 'success');
        AdminUtils.closeModal('editPrayerModal');
        renderPrayerList();
    } catch (error) {
        AdminUtils.showToast('저장 중 오류가 발생했습니다.', 'error');
    } finally {
        const btn = e.target.querySelector('button[type="submit"]');
        btn.textContent = '저장';
        btn.disabled = false;
    }
}
