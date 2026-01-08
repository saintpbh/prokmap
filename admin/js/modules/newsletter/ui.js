/**
 * Newsletter UI Module
 */
import { state } from './state.js';
import { AdminUtils } from '../../core/utils.js';

/**
 * 선교사 검색 결과 렌더링
 */
export function renderSearchResults(query, searchType = 'input') {
    const resultsDiv = document.getElementById('searchResults');
    if (!resultsDiv) return;

    if (!query && searchType !== 'focus') {
        resultsDiv.style.display = 'none';
        return;
    }

    const filtered = state.missionaries.filter(m =>
        m.name.toLowerCase().includes(query.toLowerCase()) ||
        (m.country && m.country.toLowerCase().includes(query.toLowerCase()))
    );

    if (filtered.length === 0) {
        resultsDiv.innerHTML = '<div style="padding: 10px; color: #999;">검색 결과가 없습니다</div>';
        resultsDiv.style.display = 'block';
        return;
    }

    resultsDiv.innerHTML = filtered.slice(0, 50).map(m => `
        <div onclick="selectMissionary('${m.id}', '${m.name}', '${m.country || ''}')" 
             class="search-result-item">
            <strong>${m.name}</strong> <span style="color:#666; font-size:0.9em;">(${m.country || '-'})</span>
        </div>
    `).join('');

    resultsDiv.style.display = 'block';
}

/**
 * 선교사 선택 처리
 */
export function selectMissionary(id, name, country) {
    state.selectedMissionary = { id, name, country };

    document.getElementById('selectedMissionaryId').value = id;
    document.getElementById('selectedMissionaryName').value = name;

    const displayBox = document.getElementById('selectedNameText');
    if (displayBox) displayBox.innerText = `${name} (${country})`;

    document.getElementById('selectedDisplay').style.display = 'block';
    document.getElementById('missionarySearch').style.display = 'none';
    document.getElementById('searchResults').style.display = 'none';
}

/**
 * 선택 초기화
 */
export function resetSelection() {
    state.selectedMissionary = null;

    document.getElementById('selectedMissionaryId').value = '';
    document.getElementById('selectedMissionaryName').value = '';

    document.getElementById('selectedDisplay').style.display = 'none';
    const searchInput = document.getElementById('missionarySearch');
    if (searchInput) {
        searchInput.style.display = 'block';
        searchInput.value = '';
        searchInput.focus();
    }
}

/**
 * 이미지 프리뷰 처리
 */
export function handleImagePreview(files) {
    const preview = document.getElementById('ministryPhotosPreview');
    if (!preview) return;

    preview.innerHTML = '';

    if (files.length > 3) {
        AdminUtils.showToast('최대 3장까지만 선택 가능합니다.', 'error');
        return false;
    }

    for (let i = 0; i < Math.min(files.length, 3); i++) {
        const file = files[i];
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = document.createElement('img');
            img.src = e.target.result;
            img.style.cssText = 'width: 100px; height: 100px; object-fit: cover; border-radius: 8px;';
            preview.appendChild(img);
        };
        reader.readAsDataURL(file);
    }
    return true;
}

/**
 * 폼 초기화
 */
export function clearForm() {
    resetSelection();
    const fields = ['newsletterTitle', 'newsletterSummary', 'ministryPhotos', 'pdfFile'];
    fields.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    const preview = document.getElementById('ministryPhotosPreview');
    if (preview) preview.innerHTML = '';
}

// Global exposure for legacy onclick handlers if needed
window.selectMissionary = selectMissionary;
window.resetSelection = resetSelection;
window.clearForm = clearForm;
