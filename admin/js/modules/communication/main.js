import { adminAuth } from '../../core/app-init.js';
import { communicationUi } from './ui.js';
import { communicationApi } from './api.js';
import { state } from './state.js';
import { AdminUtils } from '../../core/utils.js';

document.addEventListener('DOMContentLoaded', () => {
    initCommunicationPage();
});

async function initCommunicationPage() {
    firebase.auth().onAuthStateChanged(async (user) => {
        if (user && adminAuth.allowedEmails.includes(user.email)) {
            const [groups, missionaries] = await Promise.all([
                communicationApi.fetchGroups(),
                communicationApi.fetchMissionaries()
            ]);
            state.groups = groups;
            state.missionaries = missionaries;

            communicationUi.renderGroupSelect();
            communicationUi.refreshHistory();
            setupEventListeners();
        }
    });
}

function setupEventListeners() {
    const groupSelect = document.getElementById('groupSelect');
    if (groupSelect) {
        groupSelect.addEventListener('change', () => communicationUi.updateRecipientCount());
    }

    const previewBtn = document.getElementById('previewBtn');
    if (previewBtn) {
        previewBtn.addEventListener('click', previewMessage);
    }

    const sendBtn = document.getElementById('sendBtn');
    if (sendBtn) {
        sendBtn.addEventListener('click', sendMessage);
    }
}

function previewMessage() {
    const subject = document.getElementById('messageSubject').value.trim();
    const content = document.getElementById('messageContent').value.trim();

    if (!subject || !content) {
        AdminUtils.showToast('제목과 내용을 입력해주세요.', 'warning');
        return;
    }

    const preview = `━━━━━━━━━━━━━━━━━━━━\n제목: ${subject}\n━━━━━━━━━━━━━━━━━━━━\n\n${content}\n\n━━━━━━━━━━━━━━━━━━━━\n발신: 한국기독교장로회 국제협력선교`;
    alert(preview);
}

async function sendMessage() {
    const subject = document.getElementById('messageSubject').value.trim();
    const content = document.getElementById('messageContent').value.trim();
    const methodEl = document.querySelector('input[name="contactMethod"]:checked');
    const method = methodEl ? methodEl.value : 'email';

    if (!subject || !content) {
        AdminUtils.showToast('제목과 내용을 입력해주세요.', 'warning');
        return;
    }

    AdminUtils.showConfirm('발송하시겠습니까?', async (confirmed) => {
        if (!confirmed) return;

        const btn = document.getElementById('sendBtn');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 발송 중...';
        btn.disabled = true;

        try {
            const groupSelect = document.getElementById('groupSelect');
            const selected = Array.from(groupSelect.selectedOptions);
            const groupIds = selected.map(opt => opt.value);

            await communicationApi.saveCommunication({
                subject,
                content,
                method,
                groups: groupIds,
                sentBy: firebase.auth().currentUser.email
            });

            // EmailJS placeholder logic (same as original)
            if (method === 'email') {
                AdminUtils.showToast('발송 기록이 저장되었습니다. (실제 발송 기능은 관리자 설정 필요)', 'success');
            } else {
                AdminUtils.showToast('발송 기록이 저장되었습니다.', 'success');
            }

            document.getElementById('messageSubject').value = '';
            document.getElementById('messageContent').value = '';
            await communicationUi.refreshHistory();

        } catch (error) {
            console.error('발송 실패:', error);
            AdminUtils.showToast('발송 중 오류가 발생했습니다: ' + error.message, 'error');
        } finally {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    });
}
