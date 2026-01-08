import { state } from './state.js';
import { groupApi } from './api.js';
import { AdminUtils } from '../../core/utils.js';

export const groupUi = {
    renderGroups() {
        const listEl = document.getElementById('groupsList');
        if (!listEl) return;

        if (state.allGroups.length === 0) {
            listEl.innerHTML = '<p style="text-align: center; padding: 2rem; color: #999;">생성된 그룹이 없습니다.</p>';
            return;
        }

        listEl.innerHTML = state.allGroups.map(g => {
            const memberNames = (g.memberIds || []).map(id => {
                const m = state.allMissionaries.find(missionary => missionary.id === id);
                return m ? m.name : '알 수 없음';
            }).join(', ');

            return `
                <div style="background: #f8f9fa; padding: 1.5rem; border-radius: 8px; margin-bottom: 1rem;">
                    <div style="display: flex; justify-content: space-between; align-items: start;">
                        <div style="flex: 1;">
                            <h4 style="margin: 0 0 0.5rem 0; color: var(--primary-color);">${g.name}</h4>
                            ${g.description ? `<p style="color: #666; margin: 0 0 0.5rem 0;">${g.description}</p>` : ''}
                            <p style="margin: 0; font-size: 0.9rem;"><strong>멤버 (${(g.memberIds || []).length}명):</strong> ${memberNames || '-'}</p>
                        </div>
                        <div style="display: flex; gap: 0.5rem;">
                            <button class="btn btn-primary" data-action="edit" data-id="${g.id}" style="padding: 0.5rem 1rem;"><i class="fas fa-edit"></i></button>
                            <button class="btn btn-danger" data-action="delete" data-id="${g.id}" data-name="${g.name}" style="padding: 0.5rem 1rem;"><i class="fas fa-trash"></i></button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        this.bindListEvents();
    },

    bindListEvents() {
        const listEl = document.getElementById('groupsList');
        listEl.querySelectorAll('[data-action="edit"]').forEach(btn => {
            btn.addEventListener('click', () => this.editGroup(btn.dataset.id));
        });
        listEl.querySelectorAll('[data-action="delete"]').forEach(btn => {
            btn.addEventListener('click', () => this.deleteGroup(btn.dataset.id, btn.dataset.name));
        });
    },

    openAddGroupModal() {
        document.getElementById('groupModalTitle').textContent = '그룹 생성';
        document.getElementById('groupForm').reset();
        document.getElementById('groupId').value = '';
        state.selectedMemberIds.clear();
        this.renderSelectedMembers();
        AdminUtils.openModal('groupModal');
    },

    async editGroup(id) {
        const group = state.allGroups.find(g => g.id === id);
        if (!group) return;
        document.getElementById('groupModalTitle').textContent = '그룹 수정';
        document.getElementById('groupId').value = id;
        document.getElementById('groupName').value = group.name || '';
        document.getElementById('groupDescription').value = group.description || '';

        state.selectedMemberIds.clear();
        (group.memberIds || []).forEach(memberId => state.selectedMemberIds.add(memberId));
        this.renderSelectedMembers();

        AdminUtils.openModal('groupModal');
    },

    async deleteGroup(id, name) {
        AdminUtils.showConfirm(`"${name}" 그룹을 삭제하시겠습니까?`, async (confirmed) => {
            if (confirmed) {
                try {
                    await groupApi.deleteGroup(id);
                    AdminUtils.showToast('그룹이 삭제되었습니다.', 'success');
                    await this.refreshList();
                } catch (error) {
                    AdminUtils.showToast('삭제 중 오류가 발생했습니다.', 'error');
                }
            }
        });
    },

    renderSelectedMembers() {
        const container = document.getElementById('selectedMembers');
        if (!container) return;
        container.innerHTML = '';

        state.selectedMemberIds.forEach(id => {
            const member = state.allMissionaries.find(m => m.id === id);
            if (member) {
                const el = document.createElement('div');
                el.className = 'selected-item';
                el.innerHTML = `
                    ${member.name}
                    <span class="remove-item" data-id="${id}">&times;</span>
                `;
                el.querySelector('.remove-item').onclick = () => {
                    state.selectedMemberIds.delete(id);
                    this.renderSelectedMembers();
                };
                container.appendChild(el);
            }
        });
    },

    handleMemberSearch(e) {
        const term = e.target.value.toLowerCase().trim();
        const resultsContainer = document.getElementById('memberSearchResults');

        if (!term) {
            resultsContainer.classList.remove('active');
            return;
        }

        const results = state.allMissionaries.filter(m =>
            m.isActive !== false &&
            !state.selectedMemberIds.has(m.id) &&
            (m.name.toLowerCase().includes(term) || (m.country && m.country.toLowerCase().includes(term)))
        ).slice(0, 10);

        if (results.length > 0) {
            resultsContainer.innerHTML = results.map(m => `
                <div class="search-result-item" data-id="${m.id}">
                    <span class="name">${m.name}</span>
                    <span class="meta">${m.country || '-'}</span>
                </div>
            `).join('');

            resultsContainer.querySelectorAll('.search-result-item').forEach(item => {
                item.onclick = () => {
                    state.selectedMemberIds.add(item.dataset.id);
                    this.renderSelectedMembers();
                    document.getElementById('memberSearchInput').value = '';
                    resultsContainer.classList.remove('active');
                    document.getElementById('memberSearchInput').focus();
                };
            });

            resultsContainer.classList.add('active');
        } else {
            resultsContainer.innerHTML = '<div class="search-result-item" style="cursor: default;">검색 결과가 없습니다.</div>';
            resultsContainer.classList.add('active');
        }
    },

    async refreshList() {
        const listEl = document.getElementById('groupsList');
        AdminUtils.showLoading(listEl);
        try {
            state.allGroups = await groupApi.fetchGroups();
            this.renderGroups();
        } catch (error) {
            AdminUtils.showError(listEl, '그룹을 불러올 수 없습니다.');
        }
    }
};
