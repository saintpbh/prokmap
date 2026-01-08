/**
 * Missionary Management Main Module
 */
import { AdminUtils } from '../../core/utils.js';
import { adminAuth } from '../../core/app-init.js';
import { state } from './state.js';
import { loadMissionaries, loadSupporters } from './api.js';
import { initMap } from './map.js';
import { renderMissionariesTable, populateFilterOptions, applyFilters } from './ui.js';
import './modals.js';   // Populates window.openAddModal etc.
import './family.js';   // Populates window.addFamilyRow etc.

// 1. 초기화
firebase.auth().onAuthStateChanged((user) => {
    if (user && adminAuth.allowedEmails.includes(user.email)) {
        setTimeout(initMissionariesPage, 500);
    }
});

async function initMissionariesPage() {
    try {
        await Promise.all([
            loadMissionaries(),
            loadSupporters()
        ]);

        populateFilterOptions();
        applyFilters();

        // 지도 초기화
        initMap();

        // 필터 이벤트 바인딩
        setupFilters();

    } catch (error) {
        console.error('페이지 초기화 오류:', error);
        AdminUtils.showToast('페이지를 불러오는 중 오류가 발생했습니다.', 'error');
    }
}

function setupFilters() {
    ['searchInput', 'countryFilter', 'presbyteryFilter', 'statusFilter'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('input', applyFilters);
    });

    ['showArchived', 'showTrash'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('change', applyFilters);
    });
}

// 2. Global exposure for legacy HTML events not covered in other modules
window.initMissionariesPage = initMissionariesPage;

// Export state for debugging if needed
window.__missionaryState = state;
