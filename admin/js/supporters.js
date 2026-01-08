// supporters.js - 후원자 관리 페이지 로직

let allSupporters = [];
let allMissionaries = [];
let filteredSupporters = [];
// 선택된 후원 선교사 ID 관리
let selectedMissionaryIds = new Set();

firebase.auth().onAuthStateChanged((user) => {
    if (user && adminAuth.allowedEmails.includes(user.email)) {
        setTimeout(initSupportersPage, 500);
    }
});

async function initSupportersPage() {
    try {
        await Promise.all([loadSupporters(), loadMissionaries()]);
        renderSupportersList(); // 데이터 로드 완료 후 렌더링
        setupEventListeners();

        // 검색 이벤트 리스너 (후원 선교사 추가용)
        const searchInput = document.getElementById('missionarySearchInput');
        if (searchInput) {
            searchInput.addEventListener('input', handleMissionarySearch);
            searchInput.addEventListener('focus', handleMissionarySearch);
        }

        // 외부 클릭 시 드롭다운 닫기
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.search-input-wrapper')) {
                const results = document.getElementById('missionarySearchResults');
                if (results) results.classList.remove('active');
            }
        });

    } catch (error) {
        console.error('페이지 초기화 오류:', error);
        AdminUtils.showToast('페이지를 불러오는 중 오류가 발생했습니다.', 'error');
    }
}

// 후원자 목록 로드
async function loadSupporters() {
    const listEl = document.getElementById('supportersList');
    AdminUtils.showLoading(listEl);

    try {
        const snapshot = await firebase.database().ref('supporters').once('value');
        const data = snapshot.val();

        allSupporters = data ? Object.keys(data).map(key => ({
            id: key,
            ...data[key]
        })) : [];

        filteredSupporters = [...allSupporters];
        // renderSupportersList(); // initSupportersPage에서 데이터 로드 완료 후 호출
    } catch (error) {
        AdminUtils.showError(listEl, '데이터를 불러올 수 없습니다.');
        throw error;
    }
}

// 선교사 목록 로드
async function loadMissionaries() {
    allMissionaries = await firebaseDB.getMissionaries();
    // populateMissionarySelect() 제거됨 (검색 UI로 대체)
}

// 후원자 목록 렌더링
// 페이지네이션 변수
let currentPage = 1;
const itemsPerPage = 10;

// 후원자 목록 렌더링
function renderSupportersList() {
    const listEl = document.getElementById('supportersList');

    if (filteredSupporters.length === 0) {
        listEl.innerHTML = '<p style="text-align: center; padding: 2rem; color: #999;">등록된 후원자가 없습니다.</p>';
        return;
    }

    // 페이지네이션 로직
    const totalItems = filteredSupporters.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    // 현재 페이지가 유효 범위를 벗어나지 않도록 조정
    if (currentPage > totalPages) currentPage = totalPages;
    if (currentPage < 1) currentPage = 1;

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
    const pageData = filteredSupporters.slice(startIndex, endIndex);

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
                ${pageData.map(s => {
        const supportedNames = (s.missionaryIds || []).map(id => {
            const m = allMissionaries.find(missionary => missionary.id === id);
            return m ? m.name : '알 수 없음';
        }).join(', ');

        return `
                        <tr>
                            <td><strong>${s.name || '-'}</strong></td>
                            <td>${s.church || '-'}</td>
                            <td>${s.phone || '-'}</td>
                            <td>${s.email || '-'}</td>
                            <td>
                                <span class="badge ${s.supportType === 'onetime' ? 'badge-warning' : 'badge-success'}" 
                                      style="font-size: 0.8em; padding: 0.2em 0.5em; border-radius: 4px; 
                                             background: ${s.supportType === 'onetime' ? '#ffc107' : '#28a745'}; 
                                             color: ${s.supportType === 'onetime' ? '#212529' : 'white'};">
                                    ${s.supportType === 'onetime' ? '일시' : '정기'}
                                </span>
                            </td>
                            <td>
                                <span style="font-weight: bold;">
                                    ${s.amount ? s.amount.toLocaleString() + '원' : (s.monthlyAmount ? s.monthlyAmount.toLocaleString() + '원' : '-')}
                                </span>
                            </td>
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
    }).join('')}
            </tbody>
        </table>
    `;

    // 페이지네이션 컨트롤 추가
    html += renderPagination(totalPages);

    listEl.innerHTML = html;
}

function renderPagination(totalPages) {
    if (totalPages <= 1) return '';

    let pagesHtml = '';

    // 이전 버튼
    pagesHtml += `<button class="btn btn-sm" onclick="changePage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>&lt;</button>`;

    // 페이지 번호 (최대 5개 표시)
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + 4);

    if (endPage - startPage < 4) {
        startPage = Math.max(1, endPage - 4);
    }

    for (let i = startPage; i <= endPage; i++) {
        pagesHtml += `
            <button class="btn btn-sm ${i === currentPage ? 'btn-primary' : 'btn-outline'}" 
                    onclick="changePage(${i})" 
                    style="margin: 0 2px; min-width: 30px;">
                ${i}
            </button>
        `;
    }

    // 다음 버튼
    pagesHtml += `<button class="btn btn-sm" onclick="changePage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>&gt;</button>`;

    return `
        <div class="pagination" style="display: flex; justify-content: center; margin-top: 1rem; gap: 0.5rem;">
            ${pagesHtml}
        </div>
    `;
}

window.changePage = function (page) {
    currentPage = page;
    renderSupportersList();
};

// 검색
function searchSupporters() {
    const searchTerm = document.getElementById('searchSupporter').value.toLowerCase();

    filteredSupporters = allSupporters.filter(s => {
        return (s.name && s.name.toLowerCase().includes(searchTerm)) ||
            (s.church && s.church.toLowerCase().includes(searchTerm)) ||
            (s.phone && s.phone.toLowerCase().includes(searchTerm)) ||
            (s.email && s.email.toLowerCase().includes(searchTerm));
    });

    renderSupportersList();
}

// 이벤트 리스너 설정
function setupEventListeners() {
    const form = document.getElementById('supporterForm');
    if (form) {
        form.addEventListener('submit', saveSupporter);
    }
}

// 추가 모달 열기
function openAddSupporterModal() {
    document.getElementById('supporterModalTitle').textContent = '후원자 추가';
    document.getElementById('supporterForm').reset();
    document.getElementById('supporterId').value = '';

    // 초기화
    selectedMissionaryIds.clear();
    renderSelectedMissionaries();

    // 기본값 라디오 버튼
    const regularRadio = document.querySelector('input[name="supportType"][value="regular"]');
    if (regularRadio) regularRadio.checked = true;

    AdminUtils.openModal('supporterModal');
}

// 수정 모달 열기
async function editSupporter(id) {
    const supporter = allSupporters.find(s => s.id === id);
    if (!supporter) return;

    document.getElementById('supporterModalTitle').textContent = '후원자 수정';
    document.getElementById('supporterId').value = id;

    // 폼 필드 채우기
    document.getElementById('supporterName').value = supporter.name || '';
    document.getElementById('church').value = supporter.church || '';
    document.getElementById('supporterPhone').value = supporter.phone || '';
    document.getElementById('supporterEmail').value = supporter.email || '';
    document.getElementById('supporterAddress').value = supporter.address || '';

    // 후원 유형 및 금액 설정
    const supportType = supporter.supportType || 'regular'; // 기본값 정기
    const radioBtn = document.querySelector(`input[name="supportType"][value="${supportType}"]`);
    if (radioBtn) radioBtn.checked = true;

    document.getElementById('amount').value = supporter.amount || supporter.monthlyAmount || '';

    document.getElementById('residentNumber').value = supporter.residentNumber || '';
    document.getElementById('supporterNotes').value = supporter.notes || '';

    // 후원 선교사 데이터 로드
    selectedMissionaryIds.clear();
    (supporter.missionaryIds || []).forEach(id => selectedMissionaryIds.add(id));
    renderSelectedMissionaries();

    AdminUtils.openModal('supporterModal');
}

// 후원자 저장
async function saveSupporter(e) {
    e.preventDefault();

    const id = document.getElementById('supporterId').value;

    // selectedMissionaryIds Set을 배열로 변환
    const selectedMissionaries = Array.from(selectedMissionaryIds);

    // 라디오 버튼 값 가져오기
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
        monthlyAmount: amountVal, // 호환성 유지
        residentNumber: document.getElementById('residentNumber').value.trim(),
        missionaryIds: selectedMissionaries,
        notes: document.getElementById('supporterNotes').value.trim(),
        updatedAt: new Date().toISOString()
    };

    try {
        if (id) {
            await firebase.database().ref(`supporters/${id}`).update(formData);
            AdminUtils.showToast('후원자 정보가 수정되었습니다.', 'success');
        } else {
            formData.createdAt = new Date().toISOString();
            await firebase.database().ref('supporters').push(formData);
            AdminUtils.showToast('후원자가 추가되었습니다.', 'success');
        }

        AdminUtils.closeModal('supporterModal');
        await loadSupporters();
    } catch (error) {
        console.error('저장 오류:', error);
        AdminUtils.showToast('저장 중 오류가 발생했습니다.', 'error');
    }
}

// 후원자 삭제
async function deleteSupporter(id, name) {
    if (!AdminUtils.confirm(`정말로 "${name}" 후원자를 삭제하시겠습니까?`)) {
        return;
    }

    try {
        await firebase.database().ref(`supporters/${id}`).remove();
        AdminUtils.showToast('후원자가 삭제되었습니다.', 'success');
        await loadSupporters();
    } catch (error) {
        console.error('삭제 오류:', error);
        AdminUtils.showToast('삭제 중 오류가 발생했습니다.', 'error');
    }
}

// --- Search & Add Logic ---

function handleMissionarySearch(e) {
    const term = e.target.value.toLowerCase().trim();
    const resultsContainer = document.getElementById('missionarySearchResults');

    if (!term) {
        resultsContainer.classList.remove('active');
        return;
    }

    // 활성 상태이고, 이미 선택되지 않은 선교사 필터링
    const results = allMissionaries.filter(m =>
        m.isActive !== false &&
        !selectedMissionaryIds.has(m.id) &&
        (m.name.toLowerCase().includes(term) || (m.country && m.country.toLowerCase().includes(term)))
    ).slice(0, 10); // 최대 10개 표시

    if (results.length > 0) {
        resultsContainer.innerHTML = results.map(m => `
            <div class="search-result-item" onclick="addMissionary('${m.id}')">
                <span class="name">${m.name}</span>
                <span class="meta">${m.country || '-'}</span>
            </div>
        `).join('');
        resultsContainer.classList.add('active');
    } else {
        resultsContainer.innerHTML = '<div class="search-result-item" style="cursor: default;">검색 결과가 없습니다.</div>';
        resultsContainer.classList.add('active');
    }
}

function addMissionary(id) {
    selectedMissionaryIds.add(id);
    renderSelectedMissionaries();

    // 검색창 초기화 및 드롭다운 닫기
    const searchInput = document.getElementById('missionarySearchInput');
    searchInput.value = '';
    document.getElementById('missionarySearchResults').classList.remove('active');
    searchInput.focus();
}

function removeMissionary(id) {
    selectedMissionaryIds.delete(id);
    renderSelectedMissionaries();
}

function renderSelectedMissionaries() {
    const container = document.getElementById('selectedMissionaries');
    container.innerHTML = '';

    selectedMissionaryIds.forEach(id => {
        const member = allMissionaries.find(m => m.id === id);
        if (member) {
            const el = document.createElement('div');
            el.className = 'selected-item';
            el.innerHTML = `
                ${member.name}
                <span class="remove-item" onclick="removeMissionary('${id}')">&times;</span>
            `;
            container.appendChild(el);
        }
    });
}

// 전역 함수 노출
window.addMissionary = addMissionary;
window.removeMissionary = removeMissionary;
window.editSupporter = editSupporter;
window.deleteSupporter = deleteSupporter;
window.saveSupporter = saveSupporter;
window.openAddSupporterModal = openAddSupporterModal;
