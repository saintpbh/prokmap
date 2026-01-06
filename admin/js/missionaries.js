// missionaries.js - 선교사 관리 페이지 로직

let map;
let marker;
let allMissionaries = [];
let filteredMissionaries = [];

// 페이지 초기화
firebase.auth().onAuthStateChanged((user) => {
    if (user && adminAuth.allowedEmails.includes(user.email)) {
        setTimeout(initMissionariesPage, 500);
    }
});

async function initMissionariesPage() {
    try {
        await loadMissionaries();
        initMap();
        initFilters();
        setupEventListeners();
    } catch (error) {
        console.error('페이지 초기화 오류:', error);
        AdminUtils.showToast('페이지를 불러오는 중 오류가 발생했습니다.', 'error');
    }
}

// 선교사 목록 로드
async function loadMissionaries() {
    const tableEl = document.getElementById('missionariesTable');
    AdminUtils.showLoading(tableEl);

    try {
        allMissionaries = await firebaseDB.getMissionaries();
        filteredMissionaries = [...allMissionaries];
        renderMissionariesTable();
        populateFilterOptions();
    } catch (error) {
        AdminUtils.showError(tableEl, '데이터를 불러올 수 없습니다.');
        throw error;
    }
}

// 테이블 렌더링
function renderMissionariesTable() {
    const tableEl = document.getElementById('missionariesTable');

    if (filteredMissionaries.length === 0) {
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
                    <th>상태</th>
                    <th>마지막 업데이트</th>
                    <th style="text-align: center;">작업</th>
                </tr>
            </thead>
            <tbody>
                ${filteredMissionaries.map(m => `
                    <tr>
                        <td><strong>${m.name || '-'}</strong></td>
                        <td>${m.country || '-'}</td>
                        <td>${m.city || '-'}</td>
                        <td>${m.presbytery || '-'}</td>
                        <td>
                            <span style="padding: 0.25rem 0.75rem; border-radius: 12px; font-size: 0.8rem; 
                                ${m.status === 'active' ? 'background: #d4edda; color: #155724;' :
            m.status === 'vacation' ? 'background: #fff3cd; color: #856404;' :
                'background: #f8d7da; color: #721c24;'}">
                                ${m.status === 'active' ? '활동중' : m.status === 'vacation' ? '휴가' : '귀국'}
                            </span>
                        </td>
                        <td>${AdminUtils.formatDate(m.updatedAt || m.createdAt)}</td>
                        <td>
                            <div class="action-buttons">
                                <button class="btn btn-primary" onclick="editMissionary('${m.id}')" title="수정">
                                    <i class="fas fa-edit"></i>
                                </button>
                                ${m.isActive !== false ? `
                                    <button class="btn btn-danger" onclick="deleteMissionary('${m.id}', '${m.name}')" title="아카이브">
                                        <i class="fas fa-archive"></i>
                                    </button>
                                ` : `
                                    <button class="btn btn-success" onclick="restoreMissionary('${m.id}', '${m.name}')" title="복원">
                                        <i class="fas fa-undo"></i>
                                    </button>
                                `}
                            </div>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

// 필터 옵션 채우기
function populateFilterOptions() {
    const countries = [...new Set(allMissionaries.map(m => m.country).filter(c => c))].sort();
    const presbyteries = [...new Set(allMissionaries.map(m => m.presbytery).filter(p => p))].sort();

    const countryFilter = document.getElementById('countryFilter');
    const presbyteryFilter = document.getElementById('presbyteryFilter');
    const countryList = document.getElementById('countryList');
    const presbyteryList = document.getElementById('presbyteryList');

    countryFilter.innerHTML = '<option value="">전체 국가</option>' +
        countries.map(c => `<option value="${c}">${c}</option>`).join('');

    presbyteryFilter.innerHTML = '<option value="">전체 노회</option>' +
        presbyteries.map(p => `<option value="${p}">${p}</option>`).join('');

    countryList.innerHTML = countries.map(c => `<option value="${c}">`).join('');
    presbyteryList.innerHTML = presbyteries.map(p => `<option value="${p}">`).join('');
}

// 필터 초기화
function initFilters() {
    const searchInput = document.getElementById('searchInput');
    const countryFilter = document.getElementById('countryFilter');
    const presbyteryFilter = document.getElementById('presbyteryFilter');
    const statusFilter = document.getElementById('statusFilter');

    [searchInput, countryFilter, presbyteryFilter, statusFilter].forEach(el => {
        el.addEventListener('input', applyFilters);
    });
}

// 필터 적용
function applyFilters() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const country = document.getElementById('countryFilter').value;
    const presbytery = document.getElementById('presbyteryFilter').value;
    const status = document.getElementById('statusFilter').value;

    // 활성 상태 필터 추가
    const showArchived = document.getElementById('showArchived')?.checked;

    filteredMissionaries = allMissionaries.filter(m => {
        // 아카이브 필터
        if (!showArchived && m.isActive === false) return false;
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

// 지도 초기화
function initMap() {
    map = L.map('map').setView([20, 0], 2);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '© OpenStreetMap contributors © CARTO'
    }).addTo(map);

    map.on('click', (e) => {
        const { lat, lng } = e.latlng;
        setMapMarker(lat, lng);
        document.getElementById('lat').value = lat.toFixed(4);
        document.getElementById('lng').value = lng.toFixed(4);
    });
}

// 지도 마커 설정
function setMapMarker(lat, lng) {
    if (marker) {
        map.removeLayer(marker);
    }
    marker = L.marker([lat, lng]).addTo(map);
    map.setView([lat, lng], 6);
}

// 이벤트 리스너 설정
function setupEventListeners() {
    document.getElementById('missionaryForm').addEventListener('submit', saveMissionary);

    // 이미지 미리보기
    document.getElementById('familyPhoto').addEventListener('change', (e) => previewImage(e, 'familyPhotoPreview'));
    document.getElementById('ministryPhoto').addEventListener('change', (e) => previewImage(e, 'ministryPhotoPreview'));

    // 위도/경도 입력 시 지도 업데이트
    ['lat', 'lng'].forEach(id => {
        document.getElementById(id).addEventListener('input', () => {
            const lat = parseFloat(document.getElementById('lat').value);
            const lng = parseFloat(document.getElementById('lng').value);
            if (!isNaN(lat) && !isNaN(lng)) {
                setMapMarker(lat, lng);
            }
        });
    });
}

// 추가 모달 열기
function openAddModal() {
    document.getElementById('modalTitle').textContent = '선교사 추가';
    document.getElementById('missionaryForm').reset();
    document.getElementById('missionaryId').value = '';

    if (marker) {
        map.removeLayer(marker);
        marker = null;
    }
    map.setView([20, 0], 2);

    AdminUtils.openModal('missionaryModal');
}

// 수정 모달 열기
async function editMissionary(id) {
    const missionary = allMissionaries.find(m => m.id === id);
    if (!missionary) return;

    document.getElementById('modalTitle').textContent = '선교사 수정';
    document.getElementById('missionaryId').value = id;

    // 폼 필드 채우기
    const fields = ['name', 'englishName', 'country', 'city', 'presbytery', 'organization',
        'sentDate', 'status', 'lat', 'lng', 'email', 'localPhone', 'localAddress',
        'prayerTopic', 'prayer', 'summary'];

    fields.forEach(field => {
        const value = missionary[field] || '';
        document.getElementById(field).value = value;
    });

    // 지도에 위치 표시
    if (missionary.lat && missionary.lng) {
        setMapMarker(missionary.lat, missionary.lng);
    }

    // 이미지 미리보기
    const familyPreview = document.getElementById('familyPhotoPreview');
    const ministryPreview = document.getElementById('ministryPhotoPreview');

    if (missionary.familyPhotoUrl) {
        familyPreview.innerHTML = `<img src="${missionary.familyPhotoUrl}" style="max-width: 100%; max-height: 150px; border-radius: 8px; object-fit: cover;">`;
    } else {
        familyPreview.innerHTML = '';
    }

    if (missionary.ministryPhotoUrl) {
        ministryPreview.innerHTML = `<img src="${missionary.ministryPhotoUrl}" style="max-width: 100%; max-height: 150px; border-radius: 8px; object-fit: cover;">`;
    } else {
        ministryPreview.innerHTML = '';
    }

    AdminUtils.openModal('missionaryModal');
}

// 이미지 미리보기
function previewImage(event, previewId) {
    const file = event.target.files[0];
    const preview = document.getElementById(previewId);

    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            preview.innerHTML = `<img src="${e.target.result}" style="max-width: 100%; max-height: 150px; border-radius: 8px; object-fit: cover;">`;
        };
        reader.readAsDataURL(file);
    } else {
        preview.innerHTML = '';
    }
}

// Firebase Storage에 이미지 업로드
async function uploadImage(file, path) {
    if (!file) return null;

    try {
        const storage = firebase.storage();
        const storageRef = storage.ref();
        const imageRef = storageRef.child(path);

        await imageRef.put(file);
        const downloadURL = await imageRef.getDownloadURL();
        return downloadURL;
    } catch (error) {
        console.error('이미지 업로드 오류:', error);
        AdminUtils.showToast('이미지 업로드 실패', 'error');
        return null;
    }
}

// 선교사 저장
async function saveMissionary(e) {
    e.preventDefault();

    const id = document.getElementById('missionaryId').value;
    const familyPhotoFile = document.getElementById('familyPhoto').files[0];
    const ministryPhotoFile = document.getElementById('ministryPhoto').files[0];
    // 이미지 업로드 (파일이 선택된 경우에만)
    let familyPhotoUrl = null;
    let ministryPhotoUrl = null;

    if (familyPhotoFile) {
        const timestamp = Date.now();
        familyPhotoUrl = await uploadImage(familyPhotoFile, `missionaries/${id || timestamp}/family.jpg`);
    }

    if (ministryPhotoFile) {
        const timestamp = Date.now();
        ministryPhotoUrl = await uploadImage(ministryPhotoFile, `missionaries/${id || timestamp}/ministry.jpg`);
    }

    const formData = {
        name: document.getElementById('name').value.trim(),
        englishName: document.getElementById('englishName').value.trim(),
        country: document.getElementById('country').value.trim(),
        city: document.getElementById('city').value.trim(),
        presbytery: document.getElementById('presbytery').value.trim(),
        organization: document.getElementById('organization').value.trim(),
        sentDate: document.getElementById('sentDate').value,
        status: document.getElementById('status').value,
        lat: parseFloat(document.getElementById('lat').value) || null,
        lng: parseFloat(document.getElementById('lng').value) || null,
        email: document.getElementById('email').value.trim(),
        localPhone: document.getElementById('localPhone').value.trim(),
        localAddress: document.getElementById('localAddress').value.trim(),
        prayerTopic: document.getElementById('prayerTopic').value.trim(),
        prayer: document.getElementById('prayer').value.trim(),
        summary: document.getElementById('summary').value.trim(),
        isActive: true
    };

    // 이미지 URL 추가 (업로드된 경우에만)
    if (familyPhotoUrl) formData.familyPhotoUrl = familyPhotoUrl;
    if (ministryPhotoUrl) formData.ministryPhotoUrl = ministryPhotoUrl;

    try {
        if (id) {
            await firebaseDB.updateMissionary(id, formData);
            AdminUtils.showToast('선교사 정보가 수정되었습니다.', 'success');
        } else {
            await firebaseDB.addMissionary(formData);
            AdminUtils.showToast('선교사가 추가되었습니다.', 'success');
        }

        AdminUtils.closeModal('missionaryModal');
        await loadMissionaries();
    } catch (error) {
        console.error('저장 오류:', error);
        AdminUtils.showToast('저장 중 오류가 발생했습니다.', 'error');
    }
}

// 선교사 아카이브 (복원 가능한 삭제)
async function deleteMissionary(id, name) {
    if (!AdminUtils.confirm(`"${name}" 선교사를 아카이브하시겠습니까? (복원 가능)`)) {
        return;
    }

    try {
        // isActive를 false로 설정하여 아카이브
        await firebaseDB.updateMissionary(id, {
            isActive: false,
            archivedAt: new Date().toISOString(),
            archivedBy: firebase.auth().currentUser?.email
        });
        AdminUtils.showToast('선교사가 아카이브되었습니다. (복원 가능)', 'success');
        await loadMissionaries();
    } catch (error) {
        console.error('아카이브 오류:', error);
        AdminUtils.showToast('아카이브 중 오류가 발생했습니다.', 'error');
    }
}

// 선교사 복원
async function restoreMissionary(id, name) {
    try {
        await firebaseDB.updateMissionary(id, {
            isActive: true,
            archivedAt: null,
            archivedBy: null,
            restoredAt: new Date().toISOString(),
            restoredBy: firebase.auth().currentUser?.email
        });
        AdminUtils.showToast(`"${name}" 선교사가 복원되었습니다.`, 'success');
        await loadMissionaries();
    } catch (error) {
        console.error('복원 오류:', error);
        AdminUtils.showToast('복원 중 오류가 발생했습니다.', 'error');
    }
}
