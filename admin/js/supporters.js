// supporters.js - 후원자 관리 페이지 로직

let allSupporters = [];
let allMissionaries = [];
let filteredSupporters = [];

firebase.auth().onAuthStateChanged((user) => {
    if (user && adminAuth.allowedEmails.includes(user.email)) {
        setTimeout(initSupportersPage, 500);
    }
});

async function initSupportersPage() {
    try {
        await Promise.all([loadSupporters(), loadMissionaries()]);
        setupEventListeners();
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
        renderSupportersList();
    } catch (error) {
        AdminUtils.showError(listEl, '데이터를 불러올 수 없습니다.');
        throw error;
    }
}

// 선교사 목록 로드
async function loadMissionaries() {
    allMissionaries = await firebaseDB.getMissionaries();
    populateMissionarySelect();
}

// 선교사 선택 드롭다운 채우기
function populateMissionarySelect() {
    const select = document.getElementById('supportedMissionaries');
    select.innerHTML = allMissionaries
        .filter(m => m.isActive !== false)
        .map(m => `<option value="${m.id}">${m.name} (${m.country})</option>`)
        .join('');
}

// 후원자 목록 렌더링
function renderSupportersList() {
    const listEl = document.getElementById('supportersList');

    if (filteredSupporters.length === 0) {
        listEl.innerHTML = '<p style="text-align: center; padding: 2rem; color: #999;">등록된 후원자가 없습니다.</p>';
        return;
    }

    listEl.innerHTML = `
        <table class="data-table">
            <thead>
                <tr>
                    <th>이름</th>
                    <th>교회</th>
                    <th>전화번호</th>
                    <th>이메일</th>
                    <th>월 후원금</th>
                    <th>후원 선교사</th>
                    <th style="text-align: center;">작업</th>
                </tr>
            </thead>
            <tbody>
                ${filteredSupporters.map(s => {
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
                            <td>${s.monthlyAmount ? s.monthlyAmount.toLocaleString() + '원' : '-'}</td>
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
}

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
    document.getElementById('supporterForm').addEventListener('submit', saveSupporter);
}

// 추가 모달 열기
function openAddSupporterModal() {
    document.getElementById('supporterModalTitle').textContent = '후원자 추가';
    document.getElementById('supporterForm').reset();
    document.getElementById('supporterId').value = '';
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
    document.getElementById('monthlyAmount').value = supporter.monthlyAmount || '';
    document.getElementById('residentNumber').value = supporter.residentNumber || '';
    document.getElementById('supporterNotes').value = supporter.notes || '';

    // 후원 선교사 선택
    const select = document.getElementById('supportedMissionaries');
    Array.from(select.options).forEach(option => {
        option.selected = (supporter.missionaryIds || []).includes(option.value);
    });

    AdminUtils.openModal('supporterModal');
}

// 후원자 저장
async function saveSupporter(e) {
    e.preventDefault();

    const id = document.getElementById('supporterId').value;
    const select = document.getElementById('supportedMissionaries');
    const selectedMissionaries = Array.from(select.selectedOptions).map(opt => opt.value);

    const formData = {
        name: document.getElementById('supporterName').value.trim(),
        church: document.getElementById('church').value.trim(),
        phone: document.getElementById('supporterPhone').value.trim(),
        email: document.getElementById('supporterEmail').value.trim(),
        address: document.getElementById('supporterAddress').value.trim(),
        monthlyAmount: parseInt(document.getElementById('monthlyAmount').value) || 0,
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
