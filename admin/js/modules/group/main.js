import { adminAuth } from '../../core/app-init.js';
import { groupUi } from './ui.js';
import { groupApi } from './api.js';
import { state } from './state.js';
import { AdminUtils } from '../../core/utils.js';

document.addEventListener('DOMContentLoaded', () => {
    initGroupPage();
});

async function initGroupPage() {
    firebase.auth().onAuthStateChanged(async (user) => {
        if (user && adminAuth.allowedEmails.includes(user.email)) {
            const [groups, missionaries] = await Promise.all([
                groupApi.fetchGroups(),
                groupApi.fetchMissionaries()
            ]);
            state.allGroups = groups;
            state.allMissionaries = missionaries;

            groupUi.renderGroups();
            setupEventListeners();
        }
    });
}

function setupEventListeners() {
    const form = document.getElementById('groupForm');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = document.getElementById('groupId').value;
            const data = {
                name: document.getElementById('groupName').value.trim(),
                description: document.getElementById('groupDescription').value.trim(),
                memberIds: Array.from(state.selectedMemberIds)
            };

            try {
                await groupApi.saveGroup(id, data);
                AdminUtils.showToast(id ? '그룹이 수정되었습니다.' : '그룹이 생성되었습니다.', 'success');
                AdminUtils.closeModal('groupModal');
                await groupUi.refreshList();
            } catch (error) {
                AdminUtils.showToast('저장 중 오류가 발생했습니다.', 'error');
            }
        });
    }

    const searchInput = document.getElementById('memberSearchInput');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => groupUi.handleMemberSearch(e));
        searchInput.addEventListener('focus', (e) => groupUi.handleMemberSearch(e));
    }

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-input-wrapper')) {
            const results = document.getElementById('memberSearchResults');
            if (results) results.classList.remove('active');
        }
    });

    // 전역 함수 연결
    window.openAddGroupModal = () => groupUi.openAddGroupModal();
}
