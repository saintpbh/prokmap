/**
 * Supporter UI Module
 */
import { state } from './state.js';
import { AdminUtils } from '../../core/utils.js';
import { deleteSupporterData, fetchSupporters } from './api.js';

export function renderSupportersList() {
    const listEl = document.getElementById('supportersList');
    if (!listEl) return;

    if (state.filteredSupporters.length === 0) {
        listEl.innerHTML = '<p style="text-align: center; padding: 2rem; color: #999;">등록된 후원자가 없습니다.</p>';
        return;
    }

    const totalItems = state.filteredSupporters.length;
    const totalPages = Math.ceil(totalItems / state.itemsPerPage);

    if (state.currentPage > totalPages) state.currentPage = totalPages;
    if (state.currentPage < 1) state.currentPage = 1;

    const startIndex = (state.currentPage - 1) * state.itemsPerPage;
    const endIndex = Math.min(startIndex + state.itemsPerPage, totalItems);
    const pageData = state.filteredSupporters.slice(startIndex, endIndex);

    let html = `
        <table class="data-table">
            <thead>
                <tr>
                    <th>이름</th>
                    <th>교회</th>
                    <th>전화번호</th>
                    <th>이메일</th>
                    <th>후원 유형</th>
                    <th>후원 금액</th>
                    <th>후원 선교사</th>
                    <th style="text-align: center;">작업</th>
                </tr>
            </thead>
            <tbody>
                ${pageData.map(s => renderSupporterRow(s)).join('')}
            </tbody>
        </table>
    `;

    html += renderPagination(totalPages);
    listEl.innerHTML = html;
}

function renderSupporterRow(s) {
    const supportedNames = (s.missionaryIds || []).map(id => {
        const m = state.allMissionaries.find(missionary => missionary.id === id);
        return m ? m.name : '알 수 없음';
    }).join(', ');

    const supportTypeLabel = s.supportType === 'onetime' ? '일시' : '정기';
    const supportTypeClass = s.supportType === 'onetime' ? 'badge-warning' : 'badge-success';
    const amount = s.amount || s.monthlyAmount || 0;

    return `
        <tr>
            <td><strong>${s.name || '-'}</strong></td>
            <td>${s.church || '-'}</td>
            <td>${s.phone || '-'}</td>
            <td>${s.email || '-'}</td>
            <td>
                <span class="badge ${supportTypeClass}" style="font-size: 0.8em; padding: 0.2em 0.5em; border-radius: 4px;">
                    ${supportTypeLabel}
                </span>
            </td>
            <td><span style="font-weight: bold;">${amount.toLocaleString()}원</span></td>
            <td>${supportedNames || '-'}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-primary" onclick="editSupporter('${s.id}')" title="수정">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-danger" onclick="deleteSupporter('${s.id}', '${s.name}')" title="삭제">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `;
}

function renderPagination(totalPages) {
    if (totalPages <= 1) return '';

    let pagesHtml = '';
    pagesHtml += `<button class="btn btn-sm" onclick="changePage(${state.currentPage - 1})" ${state.currentPage === 1 ? 'disabled' : ''}>&lt;</button>`;

    let startPage = Math.max(1, state.currentPage - 2);
    let endPage = Math.min(totalPages, startPage + 4);
    if (endPage - startPage < 4) startPage = Math.max(1, endPage - 4);

    for (let i = startPage; i <= endPage; i++) {
        pagesHtml += `
            <button class="btn btn-sm ${i === state.currentPage ? 'btn-primary' : 'btn-outline'}" 
                    onclick="changePage(${i})" style="margin: 0 2px; min-width: 30px;">
                ${i}
            </button>
        `;
    }

    pagesHtml += `<button class="btn btn-sm" onclick="changePage(${state.currentPage + 1})" ${state.currentPage === totalPages ? 'disabled' : ''}>&gt;</button>`;

    return `<div class="pagination" style="display: flex; justify-content: center; margin-top: 1rem; gap: 0.5rem;">${pagesHtml}</div>`;
}

export function renderSelectedItems() {
    const container = document.getElementById('selectedMissionaries');
    if (!container) return;
    container.innerHTML = '';

    state.selectedMissionaryIds.forEach(id => {
        const m = state.allMissionaries.find(xml => xml.id === id);
        if (m) {
            const el = document.createElement('div');
            el.className = 'selected-item';
            el.innerHTML = `${m.name} <span class="remove-item" onclick="removeMissionary('${id}')">&times;</span>`;
            container.appendChild(el);
        }
    });
}

// Global exposure for legacy / dynamic HTML
window.changePage = (page) => {
    state.currentPage = page;
    renderSupportersList();
};

window.editSupporter = async (id) => {
    const supporter = state.allSupporters.find(s => s.id === id);
    if (!supporter) return;

    document.getElementById('supporterModalTitle').textContent = '후원자 수정';
    document.getElementById('supporterId').value = id;
    document.getElementById('supporterName').value = supporter.name || '';
    document.getElementById('church').value = supporter.church || '';
    document.getElementById('supporterPhone').value = supporter.phone || '';
    document.getElementById('supporterEmail').value = supporter.email || '';
    document.getElementById('supporterAddress').value = supporter.address || '';

    const supportType = supporter.supportType || 'regular';
    const radio = document.querySelector(`input[name="supportType"][value="${supportType}"]`);
    if (radio) radio.checked = true;

    document.getElementById('amount').value = supporter.amount || supporter.monthlyAmount || '';
    document.getElementById('residentNumber').value = supporter.residentNumber || '';
    document.getElementById('supporterNotes').value = supporter.notes || '';

    state.selectedMissionaryIds.clear();
    (supporter.missionaryIds || []).forEach(mid => state.selectedMissionaryIds.add(mid));
    renderSelectedItems();

    AdminUtils.openModal('supporterModal');
};

window.deleteSupporter = async (id, name) => {
    if (!AdminUtils.confirm(`정말로 "${name}" 후원자를 삭제하시겠습니까?`)) return;
    try {
        await deleteSupporterData(id);
        AdminUtils.showToast('후원자가 삭제되었습니다.', 'success');
        await fetchSupporters();
        renderSupportersList();
    } catch (error) {
        AdminUtils.showToast('삭제 오류', 'error');
    }
};

window.removeMissionary = (id) => {
    state.selectedMissionaryIds.delete(id);
    renderSelectedItems();
};
