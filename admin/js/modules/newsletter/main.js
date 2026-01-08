/**
 * Newsletter Main Module
 */
import { AdminUtils } from '../../core/utils.js';
import { adminAuth } from '../../core/app-init.js';
import { loadMissionaries, uploadNewsletter } from './api.js';
import { renderSearchResults, handleImagePreview, clearForm } from './ui.js';
import { state } from './state.js';

// 1. 초기화
firebase.auth().onAuthStateChanged((user) => {
    if (user && adminAuth.allowedEmails.includes(user.email)) {
        setTimeout(initNewsletterPage, 500);
    }
});

async function initNewsletterPage() {
    try {
        await loadMissionaries();
        setupEventListeners();
        console.log('📰 Newsletter Page Module initialized.');
    } catch (error) {
        console.error('Newsletter init error:', error);
        AdminUtils.showToast('페이지 초기화 중 오류가 발생했습니다.', 'error');
    }
}

function setupEventListeners() {
    // 업로드 버튼
    const uploadBtn = document.getElementById('uploadBtn');
    if (uploadBtn) {
        uploadBtn.onclick = handleUpload;
    }

    // 선교사 검색
    const searchInput = document.getElementById('missionarySearch');
    if (searchInput) {
        searchInput.oninput = (e) => renderSearchResults(e.target.value, 'input');
        searchInput.onfocus = (e) => renderSearchResults(e.target.value, 'focus');
    }

    // 이미지 프리뷰
    const photoInput = document.getElementById('ministryPhotos');
    if (photoInput) {
        photoInput.onchange = (e) => handleImagePreview(e.target.files);
    }

    // 외부 클릭 시 검색 결과 닫기
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.form-group')) {
            const results = document.getElementById('searchResults');
            if (results) results.style.display = 'none';
        }
    });
}

async function handleUpload() {
    const missionaryId = document.getElementById('selectedMissionaryId').value;
    const title = document.getElementById('newsletterTitle').value.trim();
    const summary = document.getElementById('newsletterSummary').value.trim();
    const photoFiles = document.getElementById('ministryPhotos').files;
    const pdfFile = document.getElementById('pdfFile').files[0];

    if (!missionaryId) return AdminUtils.showToast('선교사를 선택해주세요.', 'error');
    if (!summary) return AdminUtils.showToast('요약을 입력해주세요.', 'error');
    if (photoFiles.length > 3) return AdminUtils.showToast('사역사진은 최대 3장까지 가능합니다.', 'error');

    try {
        AdminUtils.showLoading(document.body);

        await uploadNewsletter(missionaryId, {
            title,
            summary,
            photoFiles,
            pdfFile
        });

        AdminUtils.showToast('뉴스레터가 성공적으로 업로드되었습니다!', 'success');
        clearForm();
    } catch (error) {
        AdminUtils.showToast('업로드 중 오류가 발생했습니다.', 'error');
    } finally {
        const spinner = document.querySelector('.spinner');
        if (spinner) spinner.remove();
    }
}
