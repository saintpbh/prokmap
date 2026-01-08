import { adminAuth } from '../../core/app-init.js';
import { inquiryUi } from './ui.js';
import { state } from './state.js';

document.addEventListener('DOMContentLoaded', () => {
    initInquiryPage();
});

async function initInquiryPage() {
    firebase.auth().onAuthStateChanged(async (user) => {
        if (user && adminAuth.allowedEmails.includes(user.email)) {
            await inquiryUi.refreshList();
            setupEventListeners();
        }
    });
}

function setupEventListeners() {
    // 필터 변경 이벤트
    const statusFilter = document.getElementById('statusFilter');
    if (statusFilter) {
        statusFilter.addEventListener('change', (e) => {
            state.currentFilter = e.target.value;
            inquiryUi.renderInquiries();
        });
    }

    // 새로고침 버튼
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => inquiryUi.refreshList());
    }
}
