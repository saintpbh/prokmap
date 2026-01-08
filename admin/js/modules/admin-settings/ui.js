import { state } from './state.js';
import { adminApi } from './api.js';
import { AdminUtils } from '../../core/utils.js';
import { adminAuth } from '../../core/app-init.js';

export const adminUi = {
    renderAdminsTable() {
        const tableEl = document.getElementById('adminsTable');
        if (!tableEl) return;

        if (state.allAdmins.length === 0) {
            tableEl.innerHTML = '<p style="text-align: center; padding: 2rem; color: #999;">관리자가 없습니다.</p>';
            return;
        }

        let html = `
            <table class="data-table">
                <thead>
                    <tr>
                        <th>이메일 계정</th>
                        <th>추가일</th>
                        <th>관리</th>
                    </tr>
                </thead>
                <tbody>
        `;

        state.allAdmins.forEach(admin => {
            const key = admin.email.replace(/\./g, ',');
            const isSystem = admin.addedBy === 'system' || adminAuth.allowedEmails.includes(admin.email);

            html += `
                <tr>
                    <td><strong>${admin.email}</strong> ${isSystem ? '<span class="badge badge-success" style="font-size: 0.7rem; margin-left: 5px;">기본</span>' : ''}</td>
                    <td>${admin.addedAt ? AdminUtils.formatDate(admin.addedAt) : '-'}</td>
                    <td>
                        ${isSystem ? '<small style="color: #999;">시스템 계정은 삭제 불가</small>' : `
                            <button class="btn btn-danger btn-sm" data-action="delete" data-key="${key}" data-email="${admin.email}">
                                <i class="fas fa-trash-alt"></i> 삭제
                            </button>
                        `}
                    </td>
                </tr>
            `;
        });

        html += `
                </tbody>
            </table>
        `;

        tableEl.innerHTML = html;
        this.bindTableEvents();
    },

    bindTableEvents() {
        const tableEl = document.getElementById('adminsTable');
        tableEl.querySelectorAll('[data-action="delete"]').forEach(btn => {
            btn.addEventListener('click', () => {
                const { key, email } = btn.dataset;
                this.handleDeleteAdmin(key, email);
            });
        });
    },

    async handleDeleteAdmin(key, email) {
        AdminUtils.showConfirm(`"${email}" 관리자를 정말 삭제하시겠습니까?`, async (confirmed) => {
            if (confirmed) {
                try {
                    await adminApi.deleteAdmin(key);
                    AdminUtils.showToast('관리자가 삭제되었습니다.');
                    this.refreshList();
                } catch (error) {
                    console.error('삭제 오류:', error);
                    AdminUtils.showToast('삭제 중 오류가 발생했습니다.', 'error');
                }
            }
        });
    },

    async refreshList() {
        const tableEl = document.getElementById('adminsTable');
        AdminUtils.showLoading(tableEl);
        try {
            const admins = await adminApi.fetchAdmins();
            state.allAdmins = admins;
            state.allAdmins.sort((a, b) => a.email.localeCompare(b.email));
            this.renderAdminsTable();
        } catch (error) {
            AdminUtils.showError(tableEl, '데이터를 불러올 수 없습니다.');
            console.error(error);
        }
    },

    openAddAdminModal() {
        document.getElementById('adminForm').reset();
        AdminUtils.openModal('adminModal');
    },

    closeAddAdminModal() {
        AdminUtils.closeModal('adminModal');
    }
};
