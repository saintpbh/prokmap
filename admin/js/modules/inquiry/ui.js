import { state } from './state.js';
import { inquiryApi } from './api.js';
import { AdminUtils } from '../../core/utils.js';

export const inquiryUi = {
    renderInquiries() {
        const container = document.getElementById('inquiriesContainer');
        if (!container) return;

        let filtered = state.inquiries;
        if (state.currentFilter !== 'all') {
            filtered = state.inquiries.filter(i => i.status === state.currentFilter);
        }

        if (filtered.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #999; padding: 2rem;">해당하는 문의가 없습니다.</p>';
            return;
        }

        container.innerHTML = filtered.map(inquiry => `
            <div class="inquiry-card" data-id="${inquiry.id}">
                <div class="inquiry-header">
                    <div>
                        <div class="inquiry-missionary">📧 ${inquiry.missionaryName} 선교사님</div>
                        <div class="inquiry-sender">
                            <i class="fas fa-user"></i> ${inquiry.senderName} (${inquiry.senderEmail})
                        </div>
                    </div>
                    <span class="inquiry-status status-${inquiry.status}">
                        ${this.getStatusText(inquiry.status)}
                    </span>
                </div>
                <div class="inquiry-message">${inquiry.message}</div>
                <div class="inquiry-date">
                    <i class="fas fa-clock"></i> ${AdminUtils.formatDate(inquiry.timestamp)}
                </div>
            </div>
        `).join('');

        this.bindCardEvents();
    },

    getStatusText(status) {
        switch (status) {
            case 'pending': return '대기중';
            case 'forwarded': return '전달완료';
            case 'replied': return '답변완료';
            default: return status;
        }
    },

    bindCardEvents() {
        const container = document.getElementById('inquiriesContainer');
        container.querySelectorAll('.inquiry-card').forEach(card => {
            card.addEventListener('click', () => {
                this.showInquiryDetail(card.dataset.id);
            });
        });
    },

    showInquiryDetail(id) {
        const inquiry = state.inquiries.find(i => i.id === id);
        if (!inquiry) return;

        const content = document.getElementById('inquiryDetailContent');
        content.innerHTML = `
            <div class="detail-row">
                <div class="detail-label">선교사</div>
                <div class="detail-value"><strong>${inquiry.missionaryName}</strong></div>
            </div>
            <div class="detail-row">
                <div class="detail-label">문의자 이름</div>
                <div class="detail-value">${inquiry.senderName}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">문의자 이메일</div>
                <div class="detail-value">${inquiry.senderEmail}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">문의 일시</div>
                <div class="detail-value">${AdminUtils.formatDate(inquiry.timestamp)}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">상태</div>
                <div class="detail-value">
                    <select id="statusSelect" class="form-select" style="width: auto;">
                        <option value="pending" ${inquiry.status === 'pending' ? 'selected' : ''}>대기중</option>
                        <option value="forwarded" ${inquiry.status === 'forwarded' ? 'selected' : ''}>전달완료</option>
                        <option value="replied" ${inquiry.status === 'replied' ? 'selected' : ''}>답변완료</option>
                    </select>
                </div>
            </div>
            <div class="detail-row">
                <div class="detail-label">문의 내용</div>
                <div class="detail-value" style="white-space: pre-wrap; background: #f8f9fa; padding: 1rem; border-radius: 8px; margin-top: 8px;">
${inquiry.message}
                </div>
            </div>
            <div style="margin-top: 1.5rem; display: flex; gap: 0.5rem;">
                <button class="btn btn-primary" id="saveStatusBtn">
                    <i class="fas fa-save"></i> 상태 저장
                </button>
                <button class="btn" style="background: #3b82f6; color: white;" id="forwardEmailBtn">
                    <i class="fas fa-paper-plane"></i> 선교사에게 전달 (준비 중)
                </button>
            </div>
        `;

        document.getElementById('saveStatusBtn').onclick = () => this.handleUpdateStatus(id);
        document.getElementById('forwardEmailBtn').onclick = () => this.handleForwardEmail(inquiry.missionaryId, inquiry.missionaryName);

        document.getElementById('inquiryDetailModal').style.display = 'flex';
    },

    async handleUpdateStatus(id) {
        const newStatus = document.getElementById('statusSelect').value;
        try {
            await inquiryApi.updateStatus(id, newStatus);
            AdminUtils.showToast('상태가 업데이트되었습니다.', 'success');
            this.closeInquiryDetail();
            await this.refreshList();
        } catch (error) {
            console.error('상태 업데이트 실패:', error);
            AdminUtils.showToast('상태 업데이트에 실패했습니다.', 'error');
        }
    },

    handleForwardEmail(missionaryId, missionaryName) {
        alert(`이메일 발송 기능은 추후 구현 예정입니다.\n\n선교사: ${missionaryName}\n\n현재는 수동으로 선교사에게 문의를 전달해 주세요.`);
    },

    closeInquiryDetail() {
        document.getElementById('inquiryDetailModal').style.display = 'none';
    },

    async refreshList() {
        const container = document.getElementById('inquiriesContainer');
        AdminUtils.showLoading(container);
        try {
            state.inquiries = await inquiryApi.fetchInquiries();
            this.renderInquiries();
        } catch (error) {
            console.error('문의 로드 실패:', error);
            AdminUtils.showError(container, '데이터 로드 실패');
        }
    }
};

window.closeInquiryDetail = () => inquiryUi.closeInquiryDetail();
