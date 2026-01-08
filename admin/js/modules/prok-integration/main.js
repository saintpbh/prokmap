import { adminAuth } from '../../core/app-init.js';
import { prokUi } from './ui.js';
import { prokApi } from './api.js';
import { state } from './state.js';
import { AdminUtils } from '../../core/utils.js';

document.addEventListener('DOMContentLoaded', () => {
    initProkPage();
});

async function initProkPage() {
    firebase.auth().onAuthStateChanged(async (user) => {
        if (user && adminAuth.allowedEmails.includes(user.email)) {
            const missionaries = await prokApi.fetchMissionaries();
            missionaries.sort((a, b) => {
                const dateA = a.updatedAt || '';
                const dateB = b.updatedAt || '';
                return dateB.localeCompare(dateA);
            });
            state.allMissionaries = missionaries;
            prokUi.renderList();
            setupEventListeners();
        }
    });
}

function setupEventListeners() {
    document.getElementById('searchInput').addEventListener('input', () => prokUi.renderList());
    document.getElementById('selectAll').addEventListener('change', (e) => prokUi.toggleAll(e.target.checked));
    document.getElementById('uploadBtn').addEventListener('click', startUpload);
}

async function startUpload() {
    if (!AdminUtils.confirm(`${state.selectedIds.size}명의 소식을 총회 홈페이지에 업로드하시겠습니까?`)) return;

    const targets = state.allMissionaries.filter(m => state.selectedIds.has(m.id));
    const baseData = targets.map((m, index) => ({
        id: m.id,
        name: m.name,
        country: m.country,
        summary: (m.summary || '') + '\n\n' + (m.prayerTopic || ''),
        link: '',
        fileUrl: ''
    }));

    const formData = new FormData();
    formData.append('data', JSON.stringify(baseData));

    baseData.forEach((item, index) => {
        const fileInput = document.getElementById(`file-${item.id}`);
        if (fileInput && fileInput.files.length > 0) {
            formData.append(`file_${index}`, fileInput.files[0]);
        }
    });

    prokUi.log('🚀 서버에 요청 전송 중 (파일 업로드 포함)...\n', true);

    try {
        const result = await prokApi.uploadToProk(formData);

        if (result.success) {
            prokUi.log('✅ 스크립트 실행 성공!\n\n');
            prokUi.log(result.log);
        } else {
            prokUi.log('❌ 실행 실패\n');
            prokUi.log(result.message + '\n');
            prokUi.log(result.log);
        }
    } catch (e) {
        console.error(e);
        prokUi.log(`❌ 네트워크 오류: ${e.message}`);
    }
}
