import { state } from './state.js';
import { communicationApi } from './api.js';
import { AdminUtils } from '../../core/utils.js';

export const communicationUi = {
    renderGroupSelect() {
        const select = document.getElementById('groupSelect');
        if (!select) return;

        // Keep 'All' option
        select.innerHTML = '<option value="all">전체 선교사</option>';
        state.groups.forEach(group => {
            const option = document.createElement('option');
            option.value = group.id;
            option.textContent = `${group.name} (${(group.memberIds || []).length}명)`;
            select.appendChild(option);
        });
    },

    updateRecipientCount() {
        const select = document.getElementById('groupSelect');
        const selected = Array.from(select.selectedOptions);
        let totalRecipients = 0;

        if (selected.some(opt => opt.value === 'all')) {
            totalRecipients = state.missionaries.length;
        } else {
            const selectedGroupIds = selected.map(opt => opt.value);
            const memberSet = new Set();

            selectedGroupIds.forEach(id => {
                const group = state.groups.find(g => g.id === id);
                if (group && group.memberIds) {
                    group.memberIds.forEach(mId => memberSet.add(mId));
                }
            });

            totalRecipients = memberSet.size;
        }

        document.getElementById('recipientCount').textContent =
            `총 ${totalRecipients}명에게 발송됩니다.`;
    },

    renderHistory() {
        const container = document.getElementById('communicationHistory');
        if (!container) return;

        if (state.communications.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #999; padding: 2rem;">발송 내역이 없습니다.</p>';
            return;
        }

        container.innerHTML = `
            <table class="data-table">
                <thead>
                    <tr>
                        <th>발송일</th>
                        <th>제목</th>
                        <th>방법</th>
                        <th>발송자</th>
                    </tr>
                </thead>
                <tbody>
                    ${state.communications.map(c => `
                        <tr>
                            <td>${AdminUtils.formatDate(c.sentAt)}</td>
                            <td>${c.subject}</td>
                            <td>${c.method === 'email' ? '📧 메일' : c.method}</td>
                            <td>${c.sentBy}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    },

    async refreshHistory() {
        const container = document.getElementById('communicationHistory');
        AdminUtils.showLoading(container);
        try {
            state.communications = await communicationApi.fetchHistory();
            this.renderHistory();
        } catch (error) {
            console.error('발송 내역 로드 실패:', error);
            AdminUtils.showError(container, '데이터 로드 실패');
        }
    }
};
