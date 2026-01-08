/**
 * Missionary Family Management Module
 */
import { AdminUtils } from '../../core/utils.js';

export function addFamilyRow(data = {}) {
    const listBody = document.getElementById('familyListBody');
    if (!listBody) return;

    const row = document.createElement('div');
    row.className = 'family-row-grid';

    row.innerHTML = `
        <div>
            <input type="text" class="compact-input family-name" placeholder="이름" value="${data.name || ''}" ${data.readonly ? 'readonly' : ''}>
        </div>
        <div class="family-cell-multi">
            <input type="text" class="compact-input family-relation" placeholder="관계" value="${data.relation || ''}">
            <select class="compact-select family-gender">
                <option value="">성별</option>
                <option value="M" ${data.gender === 'M' ? 'selected' : ''}>남</option>
                <option value="F" ${data.gender === 'F' ? 'selected' : ''}>여</option>
            </select>
        </div>
        <div>
            <input type="date" class="compact-input family-dob" value="${data.dob || ''}">
        </div>
        <div class="family-cell-multi">
            <input type="tel" class="compact-input family-phone" placeholder="연락처" value="${data.phone || ''}">
            <input type="email" class="compact-input family-email" placeholder="이메일" value="${data.email || ''}">
        </div>
        <div style="text-align: center;">
            <button type="button" class="btn btn-danger btn-sm" onclick="removeFamilyRow(this)" title="삭제" style="padding: 0.4rem; min-width: 32px; justify-content: center;">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;
    listBody.appendChild(row);
}

export function removeFamilyRow(btn) {
    if (confirm('이 가족 구성원을 삭제하시겠습니까?')) {
        btn.closest('.family-row-grid').remove();
    }
}

// Global exposure
window.addFamilyRow = addFamilyRow;
window.removeFamilyRow = removeFamilyRow;
