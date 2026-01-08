// missionaries.js - 선교사 관리 페이지 로직

let map;
let marker;
let allMissionaries = [];
let allSupporters = []; // 후원자 데이터
let filteredMissionaries = [];
let lastKey = null;
let hasMore = true;
const PAGE_SIZE = 50;

// 페이지 초기화
firebase.auth().onAuthStateChanged((user) => {
    if (user && adminAuth.allowedEmails.includes(user.email)) {
        setTimeout(initMissionariesPage, 500);
    }
});

async function initMissionariesPage() {
    try {
        await Promise.all([loadMissionaries(), loadSupporters()]);
        initMap();
        initFilters();
        setupEventListeners();
    } catch (error) {
        console.error('페이지 초기화 오류:', error);
        AdminUtils.showToast('페이지를 불러오는 중 오류가 발생했습니다.', 'error');
    }
}

// 선교사 목록 로드
async function loadMissionaries(loadMore = false) {
    const tableEl = document.getElementById('missionariesTable');
    if (!loadMore) {
        AdminUtils.showLoading(tableEl);
        allMissionaries = [];
        lastKey = null;
    }

    try {
        const result = await firebaseDB.getMissionariesPaged(PAGE_SIZE, lastKey);
        const newItems = result.items;
        lastKey = result.lastKey;
        hasMore = result.hasMore;

        // --- 휴지통 100일 자동 삭제 로직 추가 (필요 시 전체 데이터 대상이므로 나중에 별도 스케줄러 권장되나 여기 유지) ---
        const now = new Date();
        const oneHundredDaysAgo = new Date(now.getTime() - (100 * 24 * 60 * 60 * 1000));
        const cleanupPromises = [];

        const processedItems = newItems.filter(m => {
            if (m.isDeleted && m.deletedAt) {
                const deletedDate = new Date(m.deletedAt);
                if (deletedDate < oneHundredDaysAgo) {
                    cleanupPromises.push(firebase.database().ref(`missionaries/${m.id}`).remove());
                    return false;
                }
            }
            return true;
        });

        if (cleanupPromises.length > 0) {
            await Promise.all(cleanupPromises);
        }
        // ------------------------------------

        allMissionaries = [...allMissionaries, ...processedItems];

        // 정렬은 전체 데이터 로드 시에면 의미가 있으나, 현재 조각들에 대해서도 수행
        // allMissionaries.sort((a, b) => (a.name || '').localeCompare(b.name || ''));

        applyFilters();
        populateFilterOptions();
    } catch (error) {
        if (!loadMore) AdminUtils.showError(tableEl, '데이터를 불러올 수 없습니다.');
        throw error;
    }
}

// 후원자 목록 로드
async function loadSupporters() {
    try {
        const snapshot = await firebase.database().ref('supporters').once('value');
        const data = snapshot.val();
        allSupporters = data ? Object.keys(data).map(key => ({ id: key, ...data[key] })) : [];
        renderMissionariesTable(); // 후원자 데이터 로드 후 테이블 갱신 (선교사 데이터보다 늦게 로드될 경우 대비)
    } catch (error) {
        console.error('후원자 데이터 로드 실패:', error);
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
                    <th>후원자</th>
                    <th>상태</th>
                    <th>마지막 업데이트</th>
                    <th style="text-align: center;">작업</th>
                </tr>
            </thead>
            <tbody>
                ${filteredMissionaries.map(m => {
        // 후원자 정보 계산
        const mySupporters = allSupporters.filter(s => (s.missionaryIds || []).includes(m.id));
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
                            m.status === 'vacation' ? '#fff3cd' : '#f8d7da'
                    }; 
                                    color: ${m.status === 'active' ? '#155724' :
                        m.status === 'sabbatical' ? '#383d41' :
                            m.status === 'vacation' ? '#856404' : '#721c24'
                    }; font-weight: bold;"
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
    }).join('')}
            </tbody>
        </table>
        ${hasMore ? `
            <div style="text-align: center; margin-top: 1.5rem; padding-bottom: 2rem;">
                <button class="btn btn-outline" id="loadMoreBtn" onclick="loadMoreMissionaries()" style="padding: 0.8rem 2rem; font-weight: bold;">
                    <i class="fas fa-chevron-down"></i> 더 보기
                </button>
            </div>
        ` : ''}
    `;
}

window.loadMoreMissionaries = async function () {
    const btn = document.getElementById('loadMoreBtn');
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 로딩 중...';
    }
    await loadMissionaries(true);
};

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
    const showTrash = document.getElementById('showTrash')?.checked;

    filteredMissionaries = allMissionaries.filter(m => {
        // 휴지통 필터 (삭제된 데이터는 휴지통 보기 시에만 표시)
        if (showTrash) {
            if (!m.isDeleted) return false;
        } else {
            if (m.isDeleted) return false;

            // 아카이브 필터 (isDeleted 아님)
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

// 지도 초기화 (Lazy Loading)
async function initMap() {
    if (typeof L === 'undefined') {
        AdminUtils.showLoading(document.getElementById('map'));
        try {
            // CSS 로드
            if (!document.querySelector('link[href*="leaflet.css"]')) {
                const link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = 'https://unpkg.com/leaflet@1.7.1/dist/leaflet.css';
                document.head.appendChild(link);
            }

            // JS 로드
            await new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = 'https://unpkg.com/leaflet@1.7.1/dist/leaflet.js';
                script.onload = resolve;
                script.onerror = reject;
                document.body.appendChild(script);
            });

            document.getElementById('map').innerHTML = ''; // 로딩 제거
        } catch (error) {
            console.error('Leaflet 로드 실패:', error);
            document.getElementById('map').innerHTML = '지도를 불러올 수 없습니다.';
            return;
        }
    }

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

    // 모달이 열려있어서 map 사이즈가 제대로 계산되지 않는 경우를 대비
    setTimeout(() => {
        map.invalidateSize();
    }, 100);
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

    // 도시 입력 시 자동 좌표 검색 (Auto-GPS)
    const cityInput = document.getElementById('city');
    if (cityInput) {
        cityInput.addEventListener('change', async function () {
            const city = this.value.trim();
            const country = document.getElementById('country').value.trim();

            if (!city) return;

            // 이미 좌표가 있으면 덮어쓸지 확인하지 않고, 비어있거나 사용자 편의를 위해 자동 검색 (단, 기존 값이 있다면 물어보는게 좋을 수도 있지만, 요청은 '자동 입력'임)
            // 사용자 경험: 입력 후 Tab 누르면 자동으로 지도 이동하면 좋음.

            try {
                const query = country ? `${city}, ${country}` : city;
                const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`);
                const data = await response.json();

                if (data && data.length > 0) {
                    const lat = parseFloat(data[0].lat);
                    const lon = parseFloat(data[0].lon);

                    document.getElementById('lat').value = lat.toFixed(4);
                    document.getElementById('lng').value = lon.toFixed(4);
                    setMapMarker(lat, lon);

                    AdminUtils.showToast(`'${city}'의 위치를 찾았습니다.`, 'info');
                } else {
                    AdminUtils.showToast(`'${city}'의 위치를 찾을 수 없습니다.`, 'warning');
                }
            } catch (error) {
                console.error('GPS 검색 실패:', error);
            }
        });
    }

    // 백업 버튼 이벤트
    const backupDataBtn = document.getElementById('backupDataBtn');
    if (backupDataBtn) {
        backupDataBtn.addEventListener('click', backupData);
    }
}

// 업데이트 링크 생성 및 복사
async function generateUpdateLink() {
    const id = document.getElementById('missionaryId').value;
    if (!id) return;

    try {
        const missionary = allMissionaries.find(m => m.id === id);
        let key = missionary.accessKey;

        // 키가 없으면 새로 생성해서 저장
        if (!key) {
            key = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
            await firebaseDB.updateMissionary(id, { accessKey: key });

            // 로컬 데이터도 갱신
            missionary.accessKey = key;
        }

        const link = `${window.location.origin}/update.html?id=${id}&key=${key}`;

        await navigator.clipboard.writeText(link);
        alert(`업데이트 링크가 클립보드에 복사되었습니다!\n\n${link}`);

    } catch (error) {
        console.error('링크 생성 실패:', error);
        alert('링크 생성 중 오류가 발생했습니다.');
    }
}

// 추가 모달 열기
function openAddModal() {
    document.getElementById('modalTitle').textContent = '선교사 추가';
    document.getElementById('missionaryForm').reset();
    document.getElementById('missionaryId').value = '';

    // 가족 목록 초기화
    document.getElementById('familyListBody').innerHTML = '';

    // 추가 모드에서는 링크 버튼과 아카이브 버튼 숨김
    const linkBtn = document.getElementById('createLinkBtn');
    if (linkBtn) linkBtn.style.display = 'none';

    const archiveBtn = document.getElementById('archiveBtn');
    if (archiveBtn) archiveBtn.style.display = 'none';

    const deleteBtn = document.getElementById('deleteBtn');
    if (deleteBtn) deleteBtn.style.display = 'none';

    if (marker) {
        map.removeLayer(marker);
        marker = null;
    }
    map.setView([20, 0], 2);

    AdminUtils.openModal('missionaryModal');

    // 모달이 열린 후 지도 크기 재계산 (300ms 후)
    setTimeout(() => {
        if (map) {
            map.invalidateSize();
            map.setView([20, 0], 2);
        }
    }, 300);
}

// 수정 모달 열기
async function editMissionary(id) {
    const missionary = allMissionaries.find(m => m.id === id);
    if (!missionary) return;

    document.getElementById('modalTitle').textContent = '선교사 수정';
    document.getElementById('missionaryId').value = id;

    // 링크 생성 버튼 보이기 및 이벤트 연결
    const linkBtn = document.getElementById('createLinkBtn');
    if (linkBtn) {
        linkBtn.style.display = 'block';
        linkBtn.onclick = generateUpdateLink;
    }

    // 수정 모달에서는 삭제 버튼과 아카이브 버튼 초기화
    const archiveBtn = document.getElementById('archiveBtn');
    const deleteBtn = document.getElementById('deleteBtn');

    if (archiveBtn) {
        archiveBtn.style.display = 'block';
        archiveBtn.disabled = false;
        archiveBtn.style.opacity = '1';
        archiveBtn.style.background = ''; // Reset

        if (missionary.isDeleted) {
            archiveBtn.style.display = 'none';
        } else if (missionary.isActive === false) {
            archiveBtn.innerHTML = '<i class="fas fa-undo"></i> 복원';
            archiveBtn.classList.remove('btn-warning');
            archiveBtn.classList.add('btn-success');
            archiveBtn.onclick = () => {
                AdminUtils.closeModal('missionaryModal');
                restoreMissionary(id, missionary.name);
            };
        } else {
            archiveBtn.innerHTML = '<i class="fas fa-archive"></i> 아카이브';
            archiveBtn.classList.add('btn-warning');
            archiveBtn.classList.remove('btn-success');
            archiveBtn.onclick = () => {
                AdminUtils.closeModal('missionaryModal');
                deleteMissionary(id, missionary.name);
            };
        }
    }

    if (deleteBtn) {
        deleteBtn.style.display = 'block';
        deleteBtn.disabled = false;
        deleteBtn.style.opacity = '1';

        if (missionary.isDeleted) {
            deleteBtn.innerHTML = '<i class="fas fa-trash-alt"></i> 휴지통 상태';
            deleteBtn.disabled = true;
            deleteBtn.style.opacity = '0.6';
        } else {
            deleteBtn.innerHTML = '<i class="fas fa-trash-alt"></i> 삭제';
            deleteBtn.onclick = () => {
                const missionName = missionary.name;
                console.log('Delete button clicked for:', id, missionName);
                AdminUtils.showConfirm(`"${missionName}" 선교사를 정말 삭제 하시겠습니까?\n삭제 100일 후 영구 삭제됩니다.`, async (confirmed) => {
                    if (confirmed) {
                        console.log('Delete confirmed by user via custom modal for:', id);
                        AdminUtils.closeModal('missionaryModal');
                        await moveToTrash(id, missionName, true);
                    } else {
                        console.log('Delete cancelled by user via custom modal for:', id);
                    }
                });
            };
        }
    }

    // 폼 필드 채우기 (healthStatus 및 새 전화번호 필드 추가)
    // localPhone 필드는 하위 호환성을 위해 유지하되, UI에는 표시하지 않거나 mobile로 매핑 고려
    const fields = ['name', 'englishName', 'country', 'city', 'presbytery', 'organization',
        'sentDate', 'status', 'healthStatus', 'lat', 'lng', 'email', 'localAddress',
        'phoneChurch', 'phoneHome', 'mobile', 'koreaPhone', // 새 필드
        'prayerTopic', 'prayer', 'summary'];

    fields.forEach(field => {
        const value = missionary[field] || '';
        const el = document.getElementById(field);
        if (el) el.value = value;
    });

    // 기존 localPhone 데이터가 있고 mobile이 없다면 mobile에 표시 (마이그레이션 UI)
    if (missionary.localPhone && !missionary.mobile) {
        const mobileEl = document.getElementById('mobile');
        if (mobileEl) mobileEl.value = missionary.localPhone;
    }

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

    // 가족 목록 초기화 및 채우기
    const familyListBody = document.getElementById('familyListBody');
    familyListBody.innerHTML = '';
    if (missionary.familyMembers && Array.isArray(missionary.familyMembers)) {
        missionary.familyMembers.forEach(member => {
            addFamilyRow(member);
        });
    }

    AdminUtils.openModal('missionaryModal');

    // 모달이 열린 후 지도 크기 재계산 (300ms 후)
    setTimeout(() => {
        if (map) {
            map.invalidateSize();
            // 위치가 있으면 거기로 이동, 없으면 기본 위치
            const lat = parseFloat(document.getElementById('lat').value);
            const lng = parseFloat(document.getElementById('lng').value);

            if (!isNaN(lat) && !isNaN(lng)) {
                setMapMarker(lat, lng);
            } else {
                map.setView([20, 0], 2);
            }
        }
    }, 300);
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

// --- 가족 정보 관리 로직 ---

window.addFamilyRow = function (data = {}) {
    const listBody = document.getElementById('familyListBody');
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
};

window.removeFamilyRow = function (btn) {
    if (confirm('이 가족 구성원을 삭제하시겠습니까?')) {
        btn.closest('.family-row-grid').remove();
    }
};


// Firebase Storage에 이미지 업로드 (AdminUtils 통합 사용)
async function uploadImage(file, path) {
    return await AdminUtils.uploadImage(file, path);
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

    // 가족 정보 수집
    const familyMembers = [];
    document.querySelectorAll('#familyListBody .family-row-grid').forEach(row => {
        const name = row.querySelector('.family-name').value.trim();
        if (name) { // 이름이 있는 경우만 저장
            familyMembers.push({
                name: name,
                relation: row.querySelector('.family-relation').value.trim(),
                gender: row.querySelector('.family-gender').value,
                dob: row.querySelector('.family-dob').value,
                phone: row.querySelector('.family-phone').value.trim(),
                email: row.querySelector('.family-email').value.trim()
            });
        }
    });

    const formData = {
        name: document.getElementById('name').value.trim(),
        englishName: document.getElementById('englishName').value.trim(),
        country: document.getElementById('country').value.trim(),
        city: document.getElementById('city').value.trim(),
        presbytery: document.getElementById('presbytery').value.trim(),
        organization: document.getElementById('organization').value.trim(),
        sentDate: document.getElementById('sentDate').value,
        status: document.getElementById('status').value,
        healthStatus: document.getElementById('healthStatus').value, // healthStatus 추가
        lat: parseFloat(document.getElementById('lat').value) || null,
        lng: parseFloat(document.getElementById('lng').value) || null,
        email: document.getElementById('email').value.trim(),
        // 전화번호 상세 필드
        phoneChurch: document.getElementById('phoneChurch').value.trim(),
        phoneHome: document.getElementById('phoneHome').value.trim(),
        mobile: document.getElementById('mobile').value.trim(),
        koreaPhone: document.getElementById('koreaPhone').value.trim(),
        localPhone: document.getElementById('mobile').value.trim(), // 레거시 호환

        localAddress: document.getElementById('localAddress').value.trim(),
        prayerTopic: document.getElementById('prayerTopic').value.trim(),
        prayer: document.getElementById('prayer').value.trim(),
        summary: document.getElementById('summary').value.trim(),

        familyMembers: familyMembers, // 가족 정보 저장

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
        // isActive를 false로 설정하여 아카이브 및 상태 코드를 'archived'로 고정
        await firebaseDB.updateMissionary(id, {
            isActive: false,
            status: 'archived', // 상태를 '아카이브 됨'으로 변경
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

// 선교사 복원 (아카이브 -> 활성화 OR 휴지통 -> 아카이브)
async function restoreMissionary(id, name) {
    const missionary = allMissionaries.find(m => m.id === id);
    if (!missionary) return;

    try {
        let updateData = {};
        let toastMsg = "";

        if (missionary.isDeleted) {
            // 휴지통에서 살릴 때 -> 아카이브 상태로 (유저 요청: 살리면 아카이브로)
            updateData = {
                isDeleted: false,
                deletedAt: null,
                isActive: false,
                status: 'archived',
                restoredAt: new Date().toISOString()
            };
            toastMsg = `"${name}" 선교사가 휴지통에서 아카이브로 복원되었습니다.`;
        } else {
            // 아카이브에서 살릴 때 -> 활동중 상태로
            updateData = {
                isActive: true,
                status: 'active',
                archivedAt: null,
                archivedBy: null,
                restoredAt: new Date().toISOString(),
                restoredBy: firebase.auth().currentUser?.email
            };
            toastMsg = `"${name}" 선교사가 활동 중으로 복원되었습니다.`;
        }

        await firebaseDB.updateMissionary(id, updateData);
        AdminUtils.showToast(toastMsg, 'success');
        await loadMissionaries();
    } catch (error) {
        console.error('복원 오류:', error);
        AdminUtils.showToast('복원 중 오류가 발생했습니다.', 'error');
    }
}

// 선교사 휴지통으로 이동 (100일 후 삭제 대기)
async function moveToTrash(id, name, skipConfirm = false) {
    console.log('moveToTrash called for:', id, name, 'skipConfirm:', skipConfirm);

    if (skipConfirm) {
        return executeTrashRemoval(id);
    }

    AdminUtils.showConfirm(`"${name}" 선교사를 정말 삭제 하시겠습니까?\n삭제 100일 후 영구 삭제됩니다.`, (confirmed) => {
        if (confirmed) {
            executeTrashRemoval(id);
        }
    });
}

// 내부 실제 삭제 로직
async function executeTrashRemoval(id) {
    try {
        console.log('Starting Firebase update for moveToTrash:', id);
        const updateData = {
            isDeleted: true,
            deletedAt: new Date().toISOString(),
            deletedBy: firebase.auth().currentUser?.email || 'unknown',
            isActive: false,
            status: 'deleted'
        };
        console.log('Update data:', updateData);

        await firebaseDB.updateMissionary(id, updateData);
        console.log('Firebase update successful for moveToTrash');

        AdminUtils.showToast('선교사가 휴지통으로 이동되었습니다 (100일 후 영구 삭제)', 'success');
        await loadMissionaries();
    } catch (error) {
        console.error('휴지통 이동 오류:', error);
        AdminUtils.showToast('휴지통 이동 중 오류가 발생했습니다: ' + error.message, 'error');
    }
}

// 선교사 완전 삭제 (DB에서 제거) - 자동 클린업 외에 직접 버튼 필요 시 사용 위해 이름 유지
async function permanentDeleteMissionary(id, name) {
    if (!AdminUtils.confirm(`"${name}" 선교사 정보를 정말로 '완전 삭제'하시겠습니까?\n이 작업은 되돌릴 수 없으며 모든 관련 데이터가 삭제됩니다.`)) {
        return;
    }

    try {
        await firebase.database().ref(`missionaries/${id}`).remove();
        AdminUtils.showToast(`"${name}" 선교사 정보가 완전 삭제되었습니다.`, 'success');
        await loadMissionaries();
    } catch (error) {
        console.error('완전 삭제 오류:', error);
        AdminUtils.showToast('완전 삭제 중 오류가 발생했습니다.', 'error');
    }
}

// 선교사 상태 직접 변경 (Active, Vacation, Returned)
async function updateMissionaryStatus(id, newStatus) {
    const statusMap = {
        'active': '활동중',
        'sabbatical': '안식년',
        'vacation': '휴가',
        'returned': '귀국'
    };

    try {
        await firebaseDB.updateMissionary(id, {
            status: newStatus,
            updatedAt: new Date().toISOString()
        });

        AdminUtils.showToast(`상태가 '${statusMap[newStatus]}'(으)로 변경되었습니다.`, 'success');

        // 전체 목록 로드 대신 로컬 데이터 업데이트 후 리렌더링 (성능 최적화)
        const index = allMissionaries.findIndex(m => m.id === id);
        if (index !== -1) {
            allMissionaries[index].status = newStatus;
            applyFilters(); // 필터 적용하여 테이블 갱신
        } else {
            await loadMissionaries(); // fallback
        }
    } catch (error) {
        console.error('상태 변경 오류:', error);
        AdminUtils.showToast('상태 변경 중 오류가 발생했습니다.', 'error');
        await loadMissionaries(); // 롤백을 위해 새로고침
    }
}

// 테이블에서 바로 링크 복사
async function copyUpdateLink(id, event) {
    if (event) event.stopPropagation();

    try {
        const missionary = allMissionaries.find(m => m.id === id);
        if (!missionary) return;

        let key = missionary.accessKey;

        // 키가 없으면 새로 생성
        if (!key) {
            key = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
            await firebaseDB.updateMissionary(id, { accessKey: key });
            missionary.accessKey = key; // 로컬 업데이트
        }

        const link = `${window.location.origin}/update.html?id=${id}&key=${key}`;
        await navigator.clipboard.writeText(link);

        // 토스트 메시지로 알림
        AdminUtils.showToast(`'${missionary.name}' 선교사의 업데이트 링크가 복사되었습니다!`, 'success');

    } catch (error) {
        console.error('링크 복사 실패:', error);
        AdminUtils.showToast('링크 생성 중 오류가 발생했습니다.', 'error');
    }
}

// 전역 노출
window.copyUpdateLink = copyUpdateLink;
window.updateMissionaryStatus = updateMissionaryStatus;
// 전체 데이터 백업 (JSON 다운로드)
async function backupData() {
    if (!confirm('현재 등록된 모든 선교사 데이터를 JSON 파일로 다운로드하시겠습니까?')) return;

    try {
        AdminUtils.showLoading(document.body); // 전체 화면 로딩

        const snapshot = await firebase.database().ref('missionaries').once('value');
        const data = snapshot.val();

        if (!data) {
            alert('데이터가 없습니다.');
            document.querySelector('.spinner').remove(); // 로딩 제거
            return;
        }

        // JSON 파일 생성 및 다운로드
        const jsonString = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const today = new Date().toISOString().split('T')[0];
        const a = document.createElement('a');
        a.href = url;
        a.download = `missionaries_backup_${today}.json`;
        document.body.appendChild(a);
        a.click();

        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        if (document.querySelector('.spinner')) document.querySelector('.spinner').remove();
        AdminUtils.showToast('데이터 백업이 완료되었습니다.', 'success');

    } catch (error) {
        console.error('백업 실패:', error);
        if (document.querySelector('.spinner')) document.querySelector('.spinner').remove();
        AdminUtils.showToast('백업 중 오류가 발생했습니다.', 'error');
    }
}
// --- 추가된 기능 로직 (상세보기, 필터, 후원내역) ---

// 1. 선교사 상세 정보 모달
window.openDetailModal = function (id) {
    const m = allMissionaries.find(missionary => missionary.id === id);
    if (!m) return;

    const contentEl = document.getElementById('missionaryDetailContent');
    const healthIcon = m.healthStatus === 'weak' ? '🩹 허약' :
        m.healthStatus === 'treatment' ? '🏥 치료 중' :
            m.healthStatus === 'critical' ? '🚨 위독' : '💪 건강';

    // 이모지 매핑
    const statusMap = {
        'active': '<span class="status-badge status-success">활동 중</span>',
        'sabbatical': '<span class="status-badge" style="background:#e2e3e5; color:#383d41;">안식년</span>',
        'vacation': '<span class="status-badge status-warning">휴가</span>',
        'returned': '<span class="status-badge status-error">귀국</span>'
    };

    contentEl.innerHTML = `
        <div style="display: flex; gap: 2rem; margin-bottom: 2rem; flex-wrap: wrap;">
            <div style="flex: 1; min-width: 250px;">
                <h2 style="margin-top:0; color: #2c3e50;">${m.name} <small style="font-weight:normal; color:#666; font-size: 0.6em;">(${m.englishName || '-'})</small></h2>
                <div style="display: grid; grid-template-columns: auto 1fr; gap: 0.5rem 1rem; margin-bottom: 1rem;">
                    <span style="color:#666;">국가/도시:</span> <span>${m.country} / ${m.city || '-'}</span>
                    <span style="color:#666;">상태:</span> <span>${statusMap[m.status] || m.status} | ${healthIcon}</span>
                    <span style="color:#666;">파송일:</span> <span>${m.sentDate || '-'}</span>
                    <span style="color:#666;">소속:</span> <span>${m.presbytery || '-'} / ${m.organization || '-'}</span>
                </div>
                <hr style="border: 0; border-top: 1px solid #eee; margin: 1rem 0;">
                <div style="line-height: 1.8;">
                    <p style="margin: 0.2rem 0;"><i class="fas fa-envelope" style="width: 20px; color: #3498db;"></i> ${m.email || '-'}</p>
                    
                    <div style="display: grid; grid-template-columns: auto 1fr; gap: 0.2rem 1rem; margin: 0.5rem 0;">
                        ${m.mobile ? `<span><i class="fas fa-mobile-alt" style="width: 20px; color: #2ecc71;"></i> 휴대폰:</span> <span>${m.mobile}</span>` : ''}
                        ${m.phoneChurch ? `<span><i class="fas fa-church" style="width: 20px; color: #9b59b6;"></i> 교회:</span> <span>${m.phoneChurch}</span>` : ''}
                        ${m.phoneHome ? `<span><i class="fas fa-home" style="width: 20px; color: #e67e22;"></i> 사택:</span> <span>${m.phoneHome}</span>` : ''}
                        ${m.koreaPhone ? `<span><i class="fas fa-phone-alt" style="width: 20px; color: #e74c3c;"></i> 한국:</span> <span>${m.koreaPhone}</span>` : ''}
                        ${!m.mobile && !m.phoneChurch && !m.phoneHome && !m.koreaPhone && m.localPhone ? `<span><i class="fas fa-phone" style="width: 20px; color: #95a5a6;"></i> 전화:</span> <span>${m.localPhone}</span>` : ''}
                    </div>

                    <p style="margin: 0.2rem 0;"><i class="fas fa-map-marker-alt" style="width: 20px; color: #e74c3c;"></i> ${m.localAddress || '-'}</p>
                </div>
            </div>
            <div style="width: 150px; flex-shrink: 0; margin: 0 auto;">
                ${m.profileImage ? `<img src="${m.profileImage}" style="width:100%; border-radius:8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">` :
            (m.familyPhotoUrl ? `<img src="${m.familyPhotoUrl}" style="width:100%; border-radius:8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">` :
                '<div style="width:100%; height:150px; background:#f1f2f6; border-radius:8px; display:flex; align-items:center; justify-content:center; color:#999; flex-direction:column;"><i class="fas fa-user" style="font-size:2rem; margin-bottom:0.5rem;"></i>사진 없음</div>')}
            </div>
        </div>
        
                <div style="background: #f8f9fa; padding: 1.5rem; border-radius: 8px; margin-bottom: 1.5rem; border-left: 4px solid #6c5ce7;">
            <h4 style="margin-top: 0; color: #6c5ce7; display: flex; align-items: center;"><i class="fas fa-pray" style="margin-right: 0.5rem;"></i> 기도 제목</h4>
            <p style="white-space: pre-line; margin-bottom: 0;">${m.prayerTopic || '등록된 기도 제목이 없습니다.'}</p>
        </div>

        ${m.familyMembers && m.familyMembers.length > 0 ? `
            <div style="margin-bottom: 1.5rem;">
                <h4 style="color: #2c3e50; border-bottom: 2px solid #eee; padding-bottom: 0.5rem;">👨‍👩‍👧‍👦 가족 사항</h4>
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1rem;">
                    ${m.familyMembers.map(fam => `
                        <div style="background: white; border: 1px solid #eee; padding: 0.8rem; border-radius: 6px;">
                            <div style="font-weight: bold; color: #2c3e50;">${fam.name} <small style="color: #666; font-weight: normal;">(${fam.relation || '-'})</small></div>
                            <div style="font-size: 0.9em; color: #555; margin-top: 0.4rem;">
                                ${fam.dob ? `<div>🎂 ${fam.dob}</div>` : ''}
                                ${fam.phone ? `<div>📞 ${fam.phone}</div>` : ''}
                                ${fam.email ? `<div>✉️ ${fam.email}</div>` : ''}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        ` : ''}

        <div>
            <h4 style="color: #2c3e50; border-bottom: 2px solid #eee; padding-bottom: 0.5rem;">📰 최근 소식</h4>
            <div style="padding: 1rem; background: white; border: 1px solid #eee; border-radius: 8px;">
                <p style="white-space: pre-line; margin: 0;">${m.summary || '등록된 소식이 없습니다.'}</p>
                ${m.newsletterUrl ? `
                    <div style="margin-top: 1rem; text-align: right;">
                        <a href="${m.newsletterUrl}" target="_blank" class="btn btn-sm" style="display: inline-flex; align-items: center; gap: 0.5rem; background-color: #e74c3c; color: white; text-decoration: none; padding: 0.5rem 1rem; border-radius: 4px; font-weight: bold; transition: background 0.2s;">
                            <i class="fas fa-file-pdf"></i> 뉴스레터 보기
                        </a>
                    </div>
                ` : ''}
            </div>
        </div>
    `;

    AdminUtils.openModal('missionaryDetailModal');
};

// 2. 국가 필터링
window.filterByCountry = function (countryName) {
    if (!countryName) return;

    // 검색창의 국가 필터 값 변경
    const filterSelect = document.getElementById('countryFilter');
    if (filterSelect) {
        // 옵션 존재 여부 확인 없이 일단 값 설정 시도
        filterSelect.value = countryName;

        // 값이 설정되지 않았다면(목록에 없는 경우) 검색창 활용
        if (filterSelect.value !== countryName) {
            AdminUtils.showToast(`'${countryName}' 필터가 목록에 없어 검색어로 찾습니다.`, 'info');
            const searchInput = document.getElementById('searchInput');
            if (searchInput) {
                searchInput.value = countryName;
                searchInput.dispatchEvent(new Event('input')); // 검색 트리거
            }
        } else {
            filterSelect.dispatchEvent(new Event('change')); // 필터 변경 트리거
        }
    }
};


// 3. 후원자 리스트 모달 & 기간 필터
let currentMissionaryIdForSupport = null;
let allSupportHistory = [];

window.openSupporterListModal = async function (missionaryId) {
    if (!missionaryId) return;
    currentMissionaryIdForSupport = missionaryId;

    const m = allMissionaries.find(x => x.id === missionaryId);
    if (!m) return;

    // 모달 타이틀 설정
    const modalEl = document.getElementById('supporterListModal');
    modalEl.querySelector('h3').innerHTML = `<i class="fas fa-hand-holding-heart"></i> ${m.name} 선교사 후원 내역`;

    // 날짜 필터 초기화
    initDateFilters();

    // 로딩 및 모달 열기
    const listContent = document.getElementById('supporterListContent');
    const tableBody = document.getElementById('supporterListBody');
    tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 2rem;"><div class="spinner"></div>데이터를 불러오는 중...</td></tr>';

    AdminUtils.openModal('supporterListModal');

    try {
        // 캐싱된 데이터가 없으면 로드
        if (allSupportHistory.length === 0) {
            // 전체 로드 (데이터 양에 따라 최적화 필요)
            const snapshot = await firebase.database().ref('support_history').once('value');
            const data = snapshot.val();
            allSupportHistory = data ? Object.keys(data).map(k => ({ id: k, ...data[k] })) : [];
        }

        filterSupporterList();

    } catch (err) {
        console.error(err);
        tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center; color: red;">데이터 로드 실패</td></tr>';
    }
};

window.initDateFilters = function () {
    const yearSelect = document.getElementById('supporterFilterYear');
    const monthSelect = document.getElementById('supporterFilterMonth');

    if (!yearSelect) return;

    const today = new Date();
    const currentYear = today.getFullYear();

    let yearOpts = '<option value="">전체 (년)</option>';
    for (let y = currentYear; y >= 2020; y--) {
        yearOpts += `<option value="${y}">${y}년</option>`;
    }
    yearSelect.innerHTML = yearOpts;

    monthSelect.value = "";

    // 기본값: 현재 연도 (너무 많으면 보기 힘드므로)
    // yearSelect.value = currentYear; 
};

window.filterSupporterList = function () {
    const year = document.getElementById('supporterFilterYear').value;
    const month = document.getElementById('supporterFilterMonth').value;

    const listBody = document.getElementById('supporterListBody');
    const totalEl = document.getElementById('totalSupportAmount');

    if (!currentMissionaryIdForSupport) return;

    // 1. 해당 선교사로 필터링 (missionaryId)
    // support_history에는 missionaryId가 저장되어 있음.
    let filtered = allSupportHistory.filter(h => h.missionaryId === currentMissionaryIdForSupport);

    // 2. 기간 필터 적용
    if (year) {
        filtered = filtered.filter(h => {
            // date format: YYYY-MM-DD or YYYY.MM.DD
            const d = new Date(h.date);
            return d.getFullYear() === parseInt(year);
        });
    }
    if (month) {
        filtered = filtered.filter(h => {
            const d = new Date(h.date);
            return (d.getMonth() + 1) === parseInt(month);
        });
    }

    // 3. 집계 (후원자별)
    // 요구사항: 후원자명, 후원횟수, 총 후원금, 최근 후원일
    const summary = {};
    let grandTotal = 0;

    filtered.forEach(item => {
        // 입금자명 우선, 없으면 후원자명
        const name = item.depositorName || item.supporterName || '익명';
        if (!summary[name]) {
            summary[name] = { count: 0, total: 0, lastDate: '' };
        }

        const amount = parseInt(item.amount) || 0;
        summary[name].count++;
        summary[name].total += amount;
        grandTotal += amount;

        if (!summary[name].lastDate || item.date > summary[name].lastDate) {
            summary[name].lastDate = item.date;
        }
    });

    // 정렬 (총 후원금 내림차순)
    const sortedList = Object.entries(summary).sort((a, b) => b[1].total - a[1].total);

    // 렌더링
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

// --- 선교사 선택 (가족 추가용) ---
window.openMissionarySelector = function () {
    AdminUtils.openModal('missionarySelectorModal');
    document.getElementById('selectorSearch').value = '';
    searchMissionariesForSelector();
};

window.searchMissionariesForSelector = function () {
    const query = document.getElementById('selectorSearch').value.toLowerCase();
    const listDiv = document.getElementById('selectorList');

    // global missionaries array
    const filtered = allMissionaries.filter(m =>
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

window.selectMissionaryForFamily = function (id, name, phone, email) {
    // modal confirm 제거 (사용자 요청: 즉시 추가)

    addFamilyRow({
        name: name,
        phone: phone,
        email: email,
        readonly: true
    });

    AdminUtils.closeModal('missionarySelectorModal');
};
