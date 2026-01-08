/**
 * Missionary UI Module
 */
import { AdminUtils } from '../../core/utils.js';
import { state } from './state.js';
import { loadMissionaries, loadSupporters, updateStatus } from './api.js';
import { initMap, setMapMarker } from './map.js';
import { firebaseDB } from '../../core/app-init.js';

export function renderMissionariesTable() {
    const tableEl = document.getElementById('missionariesTable');
    if (!tableEl) return;

    if (state.filteredMissionaries.length === 0) {
        tableEl.innerHTML = '<p style="text-align: center; padding: 2rem; color: #999;">선교사가 없습니다.</p>';
        return;
    }

    tableEl.innerHTML = `
        <table class="data-table">
            <thead>
                <tr>
                    <th>이름</th>
                    <th>국가</th>
                    <th>도시</th>
                    <th>노회</th>
                    <th>후원자</th>
                    <th>상태</th>
                    <th>마지막 업데이트</th>
                    <th style="text-align: center;">작업</th>
                </tr>
            </thead>
            <tbody>
                ${state.filteredMissionaries.map(m => renderRow(m)).join('')}
            </tbody>
        </table>
        ${state.hasMore ? `
            <div style="text-align: center; margin-top: 1.5rem; padding-bottom: 2rem;">
                <button class="btn btn-outline" id="loadMoreBtn" onclick="loadMoreMissionaries()" style="padding: 0.8rem 2rem; font-weight: bold;">
                    <i class="fas fa-chevron-down"></i> 더 보기
                </button>
            </div>
        ` : ''}
    `;
}

function renderRow(m) {
    const mySupporters = state.allSupporters.filter(s => (s.missionaryIds || []).includes(m.id));
    const supporterCount = mySupporters.length;
    const totalAmount = mySupporters.reduce((sum, s) => {
        const type = s.supportType || 'regular';
        if (type === 'regular' || !s.supportType) {
            return sum + (s.amount || s.monthlyAmount || 0);
        }
        return sum;
    }, 0);

    return `
        <tr>
            <td>
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <span style="font-size: 1.1em; cursor: pointer; color: #2c3e50; font-weight: bold;" 
                          onclick="openDetailModal('${m.id}')" 
                          onmouseover="this.style.textDecoration='underline'" 
                          onmouseout="this.style.textDecoration='none'">
                        ${m.name || '-'}
                    </span>
                    
                    ${m.healthStatus === 'weak' ? '<span title="허약">🩹</span>' :
            m.healthStatus === 'treatment' ? '<span title="치료 중">🏥</span>' :
                m.healthStatus === 'critical' ? '<span title="위독">🚨</span>' : ''}

                    <button class="btn-icon" onclick="copyUpdateLink('${m.id}', event)" title="업데이트 링크 복사" style="color: #6c5ce7; background: none; border: none; cursor: pointer;">
                        <i class="fas fa-link"></i>
                    </button>
                </div>
            </td>
            <td style="cursor: pointer; color: #3498db;" 
                onclick="document.getElementById('countryFilter').value='${m.country || ''}'; applyFilters();" 
                title="이 국가로 필터링">
                ${m.country || '-'}
            </td>
            <td>${m.city || '-'}</td>
            <td>${m.presbytery || '-'}</td>
            <td style="cursor: pointer;" onclick="openSupporterListModal('${m.id}')">
                ${supporterCount > 0
            ? `<div class="supporter-info-box" style="padding: 4px 8px; background: #eefff5; border-radius: 6px; display: inline-block;">
                         <span style="font-weight: bold; color: #2196F3;">${supporterCount}명</span> 
                         <span style="font-size: 0.9em; color: #555;">(${totalAmount.toLocaleString()}원)</span>
                       </div>`
            : '<span style="color: #aaa;">-</span>'}
            </td>
            <td>
                ${m.isDeleted ? '<span class="badge trash" style="background: #fb1; color: #fff; padding: 4px 8px; border-radius: 12px; font-weight: bold;">휴지통</span>' :
            m.isActive === false ? '<span class="badge archived" style="background: #95a5a6; color: #fff; padding: 4px 8px; border-radius: 12px; font-weight: bold;">아카이브 됨</span>' :
                `<select onchange="updateMissionaryStatus('${m.id}', this.value)" 
                    onclick="event.stopPropagation()"
                    style="padding: 0.25rem 0.5rem; border-radius: 12px; font-size: 0.8rem; border: 1px solid #ddd; cursor: pointer; outline: none;
                    background: ${m.status === 'active' ? '#d4edda' :
                    m.status === 'sabbatical' ? '#e2e3e5' :
                        m.status === 'vacation' ? '#fff3cd' : '#f8d7da'}; 
                    color: ${m.status === 'active' ? '#155724' :
                    m.status === 'sabbatical' ? '#383d41' :
                        m.status === 'vacation' ? '#856404' : '#721c24'}; font-weight: bold;"
                >
                    <option value="active" ${m.status === 'active' ? 'selected' : ''}>활동중</option>
                    <option value="sabbatical" ${m.status === 'sabbatical' ? 'selected' : ''}>안식년</option>
                    <option value="vacation" ${m.status === 'vacation' ? 'selected' : ''}>휴가</option>
                    <option value="returned" ${m.status === 'returned' ? 'selected' : ''}>귀국</option>
                </select>`}
            </td>
            <td>${AdminUtils.formatDate(m.updatedAt || m.createdAt)}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-primary" onclick="editMissionary('${m.id}')" title="수정">
                        <i class="fas fa-edit"></i>
                    </button>
                    ${m.isDeleted ? `
                        <button class="btn btn-success" onclick="restoreMissionary('${m.id}', '${m.name}')" title="휴지통에서 살리기">
                            <i class="fas fa-undo"></i>
                        </button>
                    ` : m.isActive === false ? `
                        <button class="btn btn-success" onclick="restoreMissionary('${m.id}', '${m.name}')" title="복원">
                            <i class="fas fa-undo"></i>
                        </button>
                        <button class="btn btn-danger" onclick="moveToTrash('${m.id}', '${m.name}')" title="휴지통으로">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    ` : ''}
                </div>
            </td>
        </tr>
    `;
}

export function populateFilterOptions() {
    const countries = [...new Set(state.allMissionaries.map(m => m.country).filter(c => c))].sort();
    const presbyteries = [...new Set(state.allMissionaries.map(m => m.presbytery).filter(p => p))].sort();

    const countryFilter = document.getElementById('countryFilter');
    const presbyteryFilter = document.getElementById('presbyteryFilter');

    if (countryFilter) {
        countryFilter.innerHTML = '<option value="">전체 국가</option>' +
            countries.map(c => `<option value="${c}">${c}</option>`).join('');
    }

    if (presbyteryFilter) {
        presbyteryFilter.innerHTML = '<option value="">전체 노회</option>' +
            presbyteries.map(p => `<option value="${p}">${p}</option>`).join('');
    }
}

export function applyFilters() {
    const searchInput = document.getElementById('searchInput');
    if (!searchInput) return;

    const searchTerm = searchInput.value.toLowerCase();
    const country = document.getElementById('countryFilter').value;
    const presbytery = document.getElementById('presbyteryFilter').value;
    const status = document.getElementById('statusFilter').value;
    const showArchived = document.getElementById('showArchived')?.checked;
    const showTrash = document.getElementById('showTrash')?.checked;

    state.filteredMissionaries = state.allMissionaries.filter(m => {
        if (showTrash) {
            if (!m.isDeleted) return false;
        } else {
            if (m.isDeleted) return false;
            if (!showArchived && m.isActive === false) return false;
        }

        const matchSearch = !searchTerm ||
            (m.name && m.name.toLowerCase().includes(searchTerm)) ||
            (m.country && m.country.toLowerCase().includes(searchTerm)) ||
            (m.city && m.city.toLowerCase().includes(searchTerm));
        const matchCountry = !country || m.country === country;
        const matchPresbytery = !presbytery || m.presbytery === presbytery;
        const matchStatus = !status || m.status === status;

        return matchSearch && matchCountry && matchPresbytery && matchStatus;
    });

    renderMissionariesTable();
}

// Global exposure for legacy HTML events
window.loadMoreMissionaries = async function () {
    const btn = document.getElementById('loadMoreBtn');
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 로딩 중...';
    }
    await loadMissionaries(true);
    applyFilters();
};

window.filterSupporterList = function () {
    const year = document.getElementById('supporterFilterYear')?.value;
    const month = document.getElementById('supporterFilterMonth')?.value;

    const listBody = document.getElementById('supporterListBody');
    const totalEl = document.getElementById('totalSupportAmount');

    if (!state.currentMissionaryIdForSupport) return;

    let filtered = state.allSupportHistory.filter(h => h.missionaryId === state.currentMissionaryIdForSupport);

    if (year) {
        filtered = filtered.filter(h => new Date(h.date).getFullYear() === parseInt(year));
    }
    if (month) {
        filtered = filtered.filter(h => (new Date(h.date).getMonth() + 1) === parseInt(month));
    }

    const summary = {};
    let grandTotal = 0;

    filtered.forEach(item => {
        const name = item.depositorName || item.supporterName || '익명';
        if (!summary[name]) summary[name] = { count: 0, total: 0, lastDate: '' };
        const amount = parseInt(item.amount) || 0;
        summary[name].count++;
        summary[name].total += amount;
        grandTotal += amount;
        if (!summary[name].lastDate || item.date > summary[name].lastDate) summary[name].lastDate = item.date;
    });

    const sortedList = Object.entries(summary).sort((a, b) => b[1].total - a[1].total);

    if (sortedList.length === 0) {
        listBody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 2rem; color: #666;">해당 조건의 후원 내역이 없습니다.</td></tr>';
        totalEl.textContent = '0원';
        return;
    }

    listBody.innerHTML = sortedList.map(([name, data]) => `
        <tr>
            <td style="font-weight: 500;">${name}</td>
            <td><span class="badge badge-success" style="font-size: 0.75em;">후원</span></td>
            <td style="text-align:center;">${data.count}회</td>
            <td style="text-align:right; font-weight:bold; color: #2c3e50;">${data.total.toLocaleString()}원</td>
            <td style="text-align:center; color:#666; font-size: 0.9em;">${data.lastDate}</td>
        </tr>
    `).join('');

    totalEl.textContent = grandTotal.toLocaleString() + '원';
};

window.searchMissionariesForSelector = function () {
    const query = document.getElementById('selectorSearch')?.value.toLowerCase() || '';
    const listDiv = document.getElementById('selectorList');
    if (!listDiv) return;

    const filtered = state.allMissionaries.filter(m =>
        m.name.toLowerCase().includes(query) ||
        (m.country && m.country.toLowerCase().includes(query))
    );

    listDiv.innerHTML = filtered.map(m => `
        <div style="padding: 0.5rem; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center;">
            <div>
                <div style="font-weight: bold;">${m.name}</div>
                <div style="font-size: 0.85em; color: #666;">${m.country} / ${m.organization || '-'}</div>
            </div>
            <button class="btn btn-sm btn-outline-primary" onclick="selectMissionaryForFamily('${m.id}', '${m.name}', '${m.mobile || ''}', '${m.email || ''}')">선택</button>
        </div>
    `).join('');

    if (filtered.length === 0) {
        listDiv.innerHTML = '<div style="padding: 1rem; text-align: center; color: #999;">검색 결과가 없습니다.</div>';
    }
};

window.initDateFilters = function () {
    const yearSelect = document.getElementById('supporterFilterYear');
    if (!yearSelect) return;

    const currentYear = new Date().getFullYear();
    let yearOpts = '<option value="">전체 (년)</option>';
    for (let y = currentYear; y >= 2020; y--) {
        yearOpts += `<option value="${y}">${y}년</option>`;
    }
    yearSelect.innerHTML = yearOpts;
};

window.copyUpdateLink = async function (id, event) {
    if (event) event.stopPropagation();
    try {
        const missionary = state.allMissionaries.find(m => m.id === id);
        if (!missionary) return;
        let key = missionary.accessKey;
        if (!key) {
            key = Math.random().toString(36).substring(2, 15);
            // Assuming firebaseDB is globally available or imported
            // If not, this line will cause an error.
            // For this task, I'll assume it's available or a placeholder.
            // If firebaseDB is not defined, it should be imported or passed.
            // As per the prompt, I should make the change faithfully.
            // If firebaseDB is not defined, the user needs to define it.
            await firebaseDB.updateMissionary(id, { accessKey: key });
            missionary.accessKey = key;
        }
        const link = `${window.location.origin}/update.html?id=${id}&key=${key}`;
        await navigator.clipboard.writeText(link);
        AdminUtils.showToast(`'${missionary.name}' 선교사의 업데이트 링크가 복사되었습니다!`, 'success');
    } catch (error) {
        AdminUtils.showToast('링크 생성 중 오류가 발생했습니다.', 'error');
    }
};

window.applyFilters = applyFilters;
window.updateMissionaryStatus = async function (id, status) {
    try {
        await updateStatus(id, status);
        const missionary = state.allMissionaries.find(m => m.id === id);
        if (missionary) missionary.status = status;
        AdminUtils.showToast('상태가 변경되었습니다.', 'success');
        applyFilters();
    } catch (error) {
        AdminUtils.showToast('상태 변경 실패', 'error');
    }
};
