import { adminAuth } from '../../core/app-init.js';
import { adminUi } from './ui.js';
import { adminApi } from './api.js';
import { AdminUtils } from '../../core/utils.js';

document.addEventListener('DOMContentLoaded', () => {
    // auth 상태 감지는 app-init에서 처리하므로, 여기선 권한 확인 후 초기화
    initAdminsPage();
});

async function initAdminsPage() {
    // 권한 확인 (이미 app-init에서 로그인 체크는 함)
    firebase.auth().onAuthStateChanged(async (user) => {
        if (user && adminAuth.allowedEmails.includes(user.email)) {
            await adminUi.refreshList();
            setupEventListeners();
        }
    });
}

function setupEventListeners() {
    const form = document.getElementById('adminForm');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('adminEmail').value.trim();
            if (!email) return;

            try {
                const currentUser = firebase.auth().currentUser;
                await adminApi.saveAdmin(email, currentUser ? currentUser.email : 'unknown');
                AdminUtils.showToast('관리자가 성공적으로 추가되었습니다.');
                adminUi.closeAddAdminModal();
                await adminUi.refreshList();
            } catch (error) {
                console.error('저장 오류:', error);
                AdminUtils.showToast('저장 중 오류가 발생했습니다.', 'error');
            }
        });
    }

    // 전역 함수 연결 (HTML의 onclick 속성 호환용)
    window.openAddAdminModal = () => adminUi.openAddAdminModal();
}
