/**
 * Supporter Main Module
 */
import { AdminUtils } from '../../core/utils.js';
import { adminAuth } from '../../core/app-init.js';
import { fetchSupporters, fetchMissionariesForSupporter, saveSupporterData } from './api.js';
import { renderSupportersList, renderSelectedItems } from './ui.js';
import { state } from './state.js';

firebase.auth().onAuthStateChanged((user) => {
    if (user && adminAuth.allowedEmails.includes(user.email)) {
        setTimeout(initSupportersPage, 500);
    }
});

async function initSupportersPage() {
    try {
        await Promise.all([fetchSupporters(), fetchMissionariesForSupporter()]);
        renderSupportersList();
        setupEventListeners();
        console.log('💰 Supporter Page Module initialized.');
    } catch (error) {
        console.error('Supporter Page init error:', error);
        AdminUtils.showToast('데이터 로딩 오류', 'error');
    }
}

function setupEventListeners() {
    const form = document.getElementById('supporterForm');
    if (form) form.onsubmit = handleSave;

    const missionarySearch = document.getElementById('missionarySearchInput');
    if (missionarySearch) {
        missionarySearch.oninput = handleMissionarySearch;
        missionarySearch.onfocus = handleMissionarySearch;
    }

    const searchSupporter = document.getElementById('searchSupporter');
    if (searchSupporter) {
        searchSupporter.onkeyup = () => {
            const term = searchSupporter.value.toLowerCase();
            state.filteredSupporters = state.allSupporters.filter(s =>
                (s.name && s.name.toLowerCase().includes(term)) ||
                (s.church && s.church.toLowerCase().includes(term)) ||
                (s.phone && s.phone.toLowerCase().includes(term)) ||
                (s.email && s.email.toLowerCase().includes(term))
            );
            renderSupportersList();
        };
    }

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-input-wrapper')) {
            const res = document.getElementById('missionarySearchResults');
            if (res) res.classList.remove('active');
        }
    });
}

function handleMissionarySearch(e) {
    const term = e.target.value.toLowerCase().trim();
    const resultsContainer = document.getElementById('missionarySearchResults');
    if (!term) return resultsContainer?.classList.remove('active');

    const results = state.allMissionaries.filter(m =>
        m.isActive !== false &&
        !state.selectedMissionaryIds.has(m.id) &&
        (m.name.toLowerCase().includes(term) || (m.country && m.country.toLowerCase().includes(term)))
    ).slice(0, 10);

    if (resultsContainer) {
        if (results.length > 0) {
            resultsContainer.innerHTML = results.map(m => `
                <div class="search-result-item" onclick="addMissionary('${m.id}')">
                    <span class="name">${m.name}</span>
                    <span class="meta">${m.country || '-'}</span>
                </div>
            `).join('');
            resultsContainer.classList.add('active');
        } else {
            resultsContainer.innerHTML = '<div class="search-result-item" style="cursor: default;">결과 없음</div>';
            resultsContainer.classList.add('active');
        }
    }
}

async function handleSave(e) {
    e.preventDefault();
    const id = document.getElementById('supporterId').value;
    const supportType = document.querySelector('input[name="supportType"]:checked').value;
    const amountVal = parseInt(document.getElementById('amount').value) || 0;

    const formData = {
        name: document.getElementById('supporterName').value.trim(),
        church: document.getElementById('church').value.trim(),
        phone: document.getElementById('supporterPhone').value.trim(),
        email: document.getElementById('supporterEmail').value.trim(),
        address: document.getElementById('supporterAddress').value.trim(),
        supportType: supportType,
        amount: amountVal,
        monthlyAmount: amountVal,
        residentNumber: document.getElementById('residentNumber').value.trim(),
        missionaryIds: Array.from(state.selectedMissionaryIds),
        notes: document.getElementById('supporterNotes').value.trim(),
        updatedAt: new Date().toISOString()
    };

    try {
        await saveSupporterData(id, formData);
        AdminUtils.showToast(id ? '수정되었습니다.' : '추가되었습니다.', 'success');
        AdminUtils.closeModal('supporterModal');
        await fetchSupporters();
        renderSupportersList();
    } catch (err) {
        AdminUtils.showToast('저장 중 오류', 'error');
    }
}

// Global exposure for Modal buttons and Legacy scripts
window.loadSupporters = async () => {
    await fetchSupporters();
    renderSupportersList();
};

window.openAddSupporterModal = () => {
    document.getElementById('supporterModalTitle').textContent = '후원자 추가';
    document.getElementById('supporterForm').reset();
    document.getElementById('supporterId').value = '';
    state.selectedMissionaryIds.clear();
    renderSelectedItems();
    AdminUtils.openModal('supporterModal');
};

window.addMissionary = (id) => {
    state.selectedMissionaryIds.add(id);
    renderSelectedItems();
    const input = document.getElementById('missionarySearchInput');
    if (input) {
        input.value = '';
        input.focus();
    }
    document.getElementById('missionarySearchResults')?.classList.remove('active');
};
