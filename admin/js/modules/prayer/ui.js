/**
 * Prayer UI Module
 */
import { state } from './state.js';
import { AdminUtils } from '../../core/utils.js';

export function renderPrayerList() {
    const listEl = document.getElementById('prayerTopicsList');
    const searchText = document.getElementById('searchInput')?.value.toLowerCase().trim() || '';

    state.filteredMissionaries = state.allMissionaries.filter(m =>
        m.name.toLowerCase().includes(searchText) ||
        (m.country && m.country.toLowerCase().includes(searchText))
    );

    if (state.filteredMissionaries.length === 0) {
        listEl.innerHTML = '<p style="text-align: center; padding: 2rem; color: #999;">검색 결과가 없습니다.</p>';
        return;
    }

    listEl.innerHTML = state.filteredMissionaries.map(m => {
        const hasSummaryP = m.summaryPrayer && m.summaryPrayer.trim();
        const hasTopic = m.prayerTopic && m.prayerTopic.trim();
        const hasSummary = m.summary && m.summary.trim();

        const isComplete = hasSummaryP && hasTopic && hasSummary;
        const statusColor = isComplete ? '#e3f2fd' : (hasSummaryP || hasTopic ? '#fff9db' : '#fff');
        const borderColor = isComplete ? '#2196f3' : (hasSummaryP || hasTopic ? '#fcc419' : '#eee');

        return `
            <div style="padding: 1rem; background: ${statusColor}; border: 1px solid ${borderColor}; border-radius: 8px; margin-bottom: 1rem; cursor: pointer; transition: all 0.2s;"
                 onclick="openEditModal('${m.id}')">
                <div style="display:flex; justify-content:space-between;">
                    <h4 style="margin: 0; color: #333;">${m.name} <small style="color:#666; font-weight:normal;">(${m.country})</small></h4>
                    ${isComplete ? '<span style="font-size:0.8em; color:blue;">작성완료</span>' : (hasSummaryP || hasTopic ? '<span style="font-size:0.8em; color:orange;">진행중</span>' : '<span style="font-size:0.8em; color:#999;">미작성</span>')}
                </div>
                ${hasSummaryP ? `<div style="margin-top:0.5rem; font-size:0.9em;"><strong>📌 요약:</strong> ${m.summaryPrayer.substring(0, 50)}${m.summaryPrayer.length > 50 ? '...' : ''}</div>` : ''}
                ${hasTopic ? `<div style="margin-top:0.3rem; font-size:0.9em; color:#555;"><strong>🙏 제목:</strong> ${m.prayerTopic.substring(0, 50)}${m.prayerTopic.length > 50 ? '...' : ''}</div>` : ''}
                ${hasSummary ? `<div style="margin-top:0.3rem; font-size:0.9em; color:#868e96;"><strong>📰 소식:</strong> ${m.summary.substring(0, 50)}${m.summary.length > 50 ? '...' : ''}</div>` : ''}
            </div>
        `;
    }).join('');
}

export function openEditModal(id) {
    const m = state.allMissionaries.find(xml => xml.id === id);
    if (!m) return;

    document.getElementById('editId').value = id;
    document.getElementById('editNameDisplay').textContent = `${m.name} 선교사님의 기도제목 수정`;
    document.getElementById('editSummaryPrayer').value = m.summaryPrayer || '';
    document.getElementById('editPrayerTopic').value = m.prayerTopic || '';
    document.getElementById('editPrayerBasic').value = m.prayer || '';
    document.getElementById('editSummary').value = m.summary || '';

    AdminUtils.openModal('editPrayerModal');
}

window.openEditModal = openEditModal;
