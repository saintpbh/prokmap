// support-upload.js - 후원 내역 엑셀 업로드 로직 (모달 버전)

let parsedData = [];
let uploadAllMissionaries = []; // 이름 충돌 방지
let uploadAllSupporters = [];

// 전역 함수로 노출
window.openSupportUploadModal = async function () {
    const modal = document.getElementById('uploadModal');
    if (modal) {
        modal.classList.add('active');
        // 모달 열릴 때 최신 데이터 로드
        await initSupportUpload();
    } else {
        console.error('uploadModal element not found');
    }
};

async function initSupportUpload() {
    try {
        await Promise.all([loadUploadMissionaries(), loadUploadSupporters()]);
        setupUploadEventListeners();

        // 초기화
        resetUploadUI();
    } catch (error) {
        console.error('초기화 오류:', error);
        AdminUtils.showToast('데이터를 불러오는데 실패했습니다.', 'error');
    }
}

function resetUploadUI() {
    document.getElementById('fileInput').value = '';
    parsedData = [];
    document.getElementById('previewSection').style.display = 'none';
    document.getElementById('uploadLoading').style.display = 'none';
    document.getElementById('headerMappingSection').style.display = 'none'; // 매핑 섹션 숨김
    document.getElementById('dropZone').style.display = 'block';

    // 통계 초기화
    document.getElementById('totalCount').textContent = '-';
    document.getElementById('matchSuccessCount').textContent = '-';
    document.getElementById('matchFailMissionaryCount').textContent = '-';
    document.getElementById('totalAmount').textContent = '-';
    document.getElementById('uploadBtn').disabled = true;
}

async function loadUploadMissionaries() {
    uploadAllMissionaries = await firebaseDB.getMissionaries();
}

async function loadUploadSupporters() {
    const snapshot = await firebase.database().ref('supporters').once('value');
    const data = snapshot.val();
    uploadAllSupporters = data ? Object.keys(data).map(key => ({ id: key, ...data[key] })) : [];
}

function setupUploadEventListeners() {
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const uploadBtn = document.getElementById('uploadBtn');

    if (!dropZone || !fileInput || !uploadBtn) return;

    // 이벤트 리스너 중복 등록 방지를 위해 기존 핸들러 제거 (간단히 덮어쓰기)
    dropZone.onclick = () => fileInput.click();

    dropZone.ondragover = (e) => {
        e.preventDefault();
        dropZone.style.borderColor = 'var(--primary-color)';
        dropZone.style.backgroundColor = '#e9ecef';
    };

    dropZone.ondragleave = (e) => {
        e.preventDefault();
        dropZone.style.borderColor = '#ddd';
        dropZone.style.backgroundColor = '#f8f9fa';
    };

    dropZone.ondrop = (e) => {
        e.preventDefault();
        dropZone.style.borderColor = '#ddd';
        dropZone.style.backgroundColor = '#f8f9fa';
        const files = e.dataTransfer.files;
        if (files.length > 0) handleUploadFile(files[0]);
    };

    fileInput.onchange = (e) => {
        if (e.target.files.length > 0) handleUploadFile(e.target.files[0]);
    };

    uploadBtn.onclick = uploadData;
}

function handleUploadFile(file) {
    if (!file) return;

    // UI 전환: 드롭존 숨기고 로딩 표시
    const dropZone = document.getElementById('dropZone');
    const loadingEl = document.getElementById('uploadLoading');

    if (dropZone) dropZone.style.display = 'none';
    if (loadingEl) loadingEl.style.display = 'block';

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });

            // 첫 번째 시트 사용
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];

            // JSON으로 변환
            const jsonData = XLSX.utils.sheet_to_json(worksheet);

            processUploadData(jsonData);

            // 로딩 숨김 (processUploadData에서 previewSection을 보여줌)
            if (loadingEl) loadingEl.style.display = 'none';

        } catch (err) {
            console.error('Excel Parsing Error:', err);
            let msg = '파일을 읽는 중 오류가 발생했습니다.';
            if (err.message && err.message.includes('Unrecognized code')) {
                msg = '올바른 엑셀 형식이 아니거나 암호화된 파일일 수 있습니다.';
            }
            AdminUtils.showToast(msg, 'error');
            resetUploadUI();
        }
    };
    reader.readAsArrayBuffer(file);
}

// 헤더 매핑 처리를 위한 변수
let rawUploadData = [];
let uploadHeaders = [];

function handleUploadFile(file) {
    if (!file) return;

    // UI 전환
    const dropZone = document.getElementById('dropZone');
    const loadingEl = document.getElementById('uploadLoading');

    if (dropZone) dropZone.style.display = 'none';
    if (loadingEl) loadingEl.style.display = 'block';

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = e.target.result;
            const workbook = XLSX.read(data, { type: 'binary' });

            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];

            // 1. 전체 데이터를 배열의 배열로 가져옴 (헤더 위치를 유연하게 찾기 위해)
            const rawArray = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });

            if (rawArray.length < 3) {
                throw new Error('데이터가 너무 적습니다. (최소 3행 이상 필요)');
            }

            // 2. 3번째 행 (인덱스 2)을 헤더로 사용 (사용자 요청: "3열에 항목 이름이 있어" -> 3행으로 해석)
            const headerRowIndex = 2;
            const headerRow = rawArray[headerRowIndex];

            if (!headerRow || headerRow.length === 0) {
                throw new Error('3번째 행에서 항목 이름을 찾을 수 없습니다.');
            }

            // 빈 헤더도 포함하고, 식별 가능한 이름을 부여
            uploadHeaders = headerRow.map((h, index) => {
                const headerName = String(h || '').trim();
                return headerName ? headerName : `(값 없음 - ${index + 1}열)`;
            });

            // 3. 데이터는 헤더 다음 행부터 시작
            // 헤더를 키로 사용하여 객체 배열로 변환
            rawUploadData = rawArray.slice(headerRowIndex + 1).map(row => {
                const obj = {};
                uploadHeaders.forEach((key, index) => {
                    // 키가 있고, 해당 인덱스에 데이터가 존재할 때만
                    if (key) {
                        obj[key] = row[index];
                    }
                });
                return obj;
            });

            if (rawUploadData.length === 0) {
                throw new Error('처리할 데이터가 없습니다.');
            }

            renderHeaderMappingUI();

            // 로딩 숨김
            if (loadingEl) loadingEl.style.display = 'none';

        } catch (err) {
            console.error('Excel Parsing Error:', err);
            let msg = '파일을 읽는 중 오류가 발생했습니다.';
            if (err.message && err.message.includes('Unrecognized code')) {
                msg = '올바른 엑셀 형식이 아니거나 암호화된 파일일 수 있습니다.';
            } else if (err.message) {
                msg = err.message;
            }
            AdminUtils.showToast(msg, 'error');
            resetUploadUI();
        }
    };
    reader.readAsBinaryString(file);
}

function renderHeaderMappingUI() {
    const mappingSection = document.getElementById('headerMappingSection');
    const selects = ['mapDate', 'mapSupporter', 'mapMissionary', 'mapAmount', 'mapTransferDate'];

    // 각 select 박스 초기화 및 옵션 추가
    selects.forEach(id => {
        const select = document.getElementById(id);
        if (!select) return;

        select.innerHTML = id === 'mapTransferDate' ? '<option value="">(입금일자와 동일)</option>' : '<option value="">선택해주세요</option>';

        uploadHeaders.forEach(header => {
            const option = document.createElement('option');
            option.value = header;
            option.textContent = header;
            select.appendChild(option);
        });

        // 자동 선택 시도 (키워드 기반)
        if (id !== 'mapTransferDate') {
            const keywords = {
                'mapDate': ['일자', 'Date', '날짜'],
                'mapSupporter': ['입금자', 'Depositor', '송금인', '후원자', '성명'],
                'mapMissionary': ['선교사', '프로그램', 'Missionary', '내용', '적요'],
                'mapAmount': ['입금액', 'Amount', '금액']
            }[id];

            const match = uploadHeaders.find(h => keywords.some(kw => h.includes(kw)));
            if (match) select.value = match;
        }
    });

    // 매핑 UI 표시
    if (mappingSection) mappingSection.style.display = 'block';

    // '다음' 버튼 이벤트 연결
    const applyBtn = document.getElementById('applyMappingBtn');
    if (applyBtn) applyBtn.onclick = applyMappingAndProcess;
}

function applyMappingAndProcess() {
    const mapDate = document.getElementById('mapDate').value;
    const mapSupporter = document.getElementById('mapSupporter').value;
    const mapMissionary = document.getElementById('mapMissionary').value;
    const mapAmount = document.getElementById('mapAmount').value;
    const mapTransferDate = document.getElementById('mapTransferDate').value; // Optional

    if (!mapDate || !mapSupporter || !mapMissionary || !mapAmount) {
        AdminUtils.showToast('필수 항목(입금일자, 후원자, 선교사, 입금액)을 모두 선택해주세요.', 'warning');
        return;
    }

    processUploadData(mapDate, mapSupporter, mapMissionary, mapAmount, mapTransferDate);
}

function processUploadData(dateKey, depositorKey, missionaryKey, amountKey, transferDateKey) {
    const mappingSection = document.getElementById('headerMappingSection');
    if (mappingSection) mappingSection.style.display = 'none';

    // 로딩 표시 (다시 보여줌)
    const loadingEl = document.getElementById('uploadLoading');
    if (loadingEl) loadingEl.style.display = 'block';

    // 약간의 지연을 주어 UI 렌더링 확보
    setTimeout(() => {
        parsedData = rawUploadData.map(row => {
            const rawDate = row[dateKey];
            const depositorName = row[depositorKey];
            const missionaryNameRaw = row[missionaryKey];
            const amount = row[amountKey];
            const rawTransferDate = transferDateKey ? row[transferDateKey] : rawDate;

            // 매칭 로직
            const matchedMissionary = matchUploadMissionary(missionaryNameRaw);
            const matchedSupporter = matchUploadSupporter(depositorName);

            // 일자 포맷팅 Helper
            const formatDate = (val) => {
                if (!val) return null;
                if (typeof val === 'number') {
                    // Excel Date Serial Number
                    const dateObj = new Date(Math.round((val - 25569) * 86400 * 1000));
                    return dateObj.toISOString().split('T')[0];
                } else if (val instanceof Date) {
                    return val.toISOString().split('T')[0];
                } else {
                    // String check (YYYY.MM.DD or YYYY-MM-DD)
                    const strVal = String(val).trim();
                    // 간단한 정규식으로 - 또는 . 을 -로 통일
                    return strVal.replace(/\./g, '-');
                }
            };

            const formattedDate = formatDate(rawDate);
            const formattedTransferDate = formatDate(rawTransferDate);

            return {
                date: formattedDate,
                transferDate: formattedTransferDate, // 송금일자 추가
                depositorName: depositorName,
                matchedSupporter: matchedSupporter,
                missionaryNameRaw: missionaryNameRaw,
                matchedMissionary: matchedMissionary,
                amount: amount,
                isValid: matchedMissionary && amount
            };
        });

        renderUploadPreview();

        if (loadingEl) loadingEl.style.display = 'none';
    }, 100);
}

function matchUploadMissionary(rawName) {
    if (!rawName) return null;

    // 1. 정확한 이름 매칭
    let match = uploadAllMissionaries.find(m => m.name === rawName);
    if (match) return match;

    // 2. 특수문자 제거 후 매칭
    const cleanName = rawName.toString().replace(/[0-9\/\(\)\s]/g, '').trim();
    match = uploadAllMissionaries.find(m => m.name === cleanName);
    if (match) return match;

    // 3. 포함 여부 확인
    match = uploadAllMissionaries.find(m => rawName.toString().includes(m.name));
    if (match) return match;

    return null;
}

function matchUploadSupporter(rawName) {
    if (!rawName) return null;

    // 1. 정확한 이름
    let match = uploadAllSupporters.find(s => s.name === rawName);
    if (match) return match;

    // 2. 숫자 등 제거
    const cleanName = rawName.toString().replace(/[0-9\s]/g, '').trim();
    if (cleanName.length >= 2) {
        match = uploadAllSupporters.find(s => s.name === cleanName || (s.church && s.church.includes(cleanName)));
        if (match) return match;
    }

    // 신규
    return {
        isNew: true,
        name: cleanName || rawName,
        id: null
    };
}

function renderUploadPreview() {
    const tbody = document.getElementById('previewTableBody');
    const previewSection = document.getElementById('previewSection');
    const uploadBtn = document.getElementById('uploadBtn');

    if (!tbody) return;

    tbody.innerHTML = '';

    let successCount = 0;
    let failMissionaryCount = 0;
    let totalAmount = 0;

    parsedData.forEach(item => {
        const tr = document.createElement('tr');
        let statusHtml = '';

        // 상태판단
        if (!item.matchedMissionary) {
            statusHtml += '<span class="status-badge status-error" style="background:#ffebee; color:#c62828; padding:0.2rem 0.5rem; border-radius:4px;">선교사 미확인</span>';
            failMissionaryCount++;
        } else if (!item.matchedSupporter) {
            statusHtml += '<span class="status-badge status-error" style="background:#ffebee; color:#c62828; padding:0.2rem 0.5rem; border-radius:4px;">입금자 미확인</span>';
        } else {
            if (item.matchedSupporter.isNew) {
                statusHtml += '<span class="status-badge status-warning" style="background:#fff3e0; color:#ef6c00; padding:0.2rem 0.5rem; border-radius:4px;">신규 후원자</span>';
            } else {
                statusHtml += '<span class="status-badge status-success" style="background:#e8f5e9; color:#2e7d32; padding:0.2rem 0.5rem; border-radius:4px;">매칭 성공</span>';
            }
            if (item.amount) successCount++;
        }

        if (item.amount) totalAmount += parseInt(item.amount) || 0;

        // 매칭 후원자 표시 로직 개선
        let matchedSupporterDisplay = '-';
        if (item.matchedSupporter) {
            matchedSupporterDisplay = item.matchedSupporter.isNew
                ? `<span style="color:#ef6c00; font-weight:bold;">${item.matchedSupporter.name} (신규)</span>`
                : item.matchedSupporter.name;
        }

        tr.innerHTML = `
            <td>${item.date || '-'}</td>
            <td>${item.depositorName || '-'}</td>
            <td>${matchedSupporterDisplay}</td>
            <td>${item.missionaryNameRaw || '-'}</td>
            <td>${item.matchedMissionary ? item.matchedMissionary.name : '<span style="color:red">미확인</span>'}</td>
            <td>${item.amount ? parseInt(item.amount).toLocaleString() : '0'}</td>
            <td>${statusHtml}</td>
        `;
        tbody.appendChild(tr);
    });

    document.getElementById('totalCount').textContent = parsedData.length + '건';
    document.getElementById('matchSuccessCount').textContent = successCount + '건';
    document.getElementById('matchFailMissionaryCount').textContent = failMissionaryCount + '건';
    document.getElementById('totalAmount').textContent = totalAmount.toLocaleString() + '원';

    uploadBtn.disabled = successCount === 0;
    previewSection.style.display = 'block';
}

async function uploadData() {
    const validData = parsedData.filter(item => item.matchedMissionary && item.amount);

    if (validData.length === 0) {
        AdminUtils.showToast('저장할 데이터가 없습니다.', 'warning');
        return;
    }

    if (!confirm(`${validData.length}건의 후원 내역을 저장하시겠습니까?\n(신규 후원자는 자동으로 등록됩니다)`)) return;

    // 로딩 표시
    const uploadBtn = document.getElementById('uploadBtn');
    const originalBtnText = uploadBtn.innerHTML;
    uploadBtn.disabled = true;
    uploadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 저장 중...';

    let success = 0;
    let fail = 0;
    const newSupportersMap = new Map();

    for (const item of validData) {
        try {
            let supporterId = item.matchedSupporter.id;
            let supporterName = item.matchedSupporter.name;

            // 신규 후원자 등록
            if (item.matchedSupporter.isNew) {
                if (newSupportersMap.has(supporterName)) {
                    supporterId = newSupportersMap.get(supporterName);
                } else {
                    const newSupporterData = {
                        name: supporterName,
                        createdAt: new Date().toISOString(),
                        notes: '엑셀 업로드로 자동 등록됨',
                        type: 'regular',
                        amount: parseInt(item.amount) || 0, // 초기 후원금 설정
                        missionaryIds: [item.matchedMissionary.id] // 선교사 연결
                    };
                    const newRef = await firebase.database().ref('supporters').push(newSupporterData);
                    supporterId = newRef.key;
                    newSupportersMap.set(supporterName, supporterId);
                }
            } else {
                // 기존 후원자: 선교사 연결 업데이트 (없으면 추가)
                const existingSupporterRef = firebase.database().ref(`supporters/${supporterId}`);
                const snapshot = await existingSupporterRef.get();
                if (snapshot.exists()) {
                    const data = snapshot.val();
                    let currentMissionaryIds = data.missionaryIds || [];
                    if (!currentMissionaryIds.includes(item.matchedMissionary.id)) {
                        currentMissionaryIds.push(item.matchedMissionary.id);
                        await existingSupporterRef.update({ missionaryIds: currentMissionaryIds });
                    }

                    // 금액이 0이면 업데이트 (선택사항)
                    if (!data.amount && !data.monthlyAmount) {
                        await existingSupporterRef.update({ amount: parseInt(item.amount) || 0 });
                    }
                }
            }

            const record = {
                date: item.date,
                amount: parseInt(item.amount) || 0,
                depositorName: item.depositorName,
                supporterId: supporterId,
                supporterName: supporterName,
                missionaryNameRaw: item.missionaryNameRaw,
                missionaryId: item.matchedMissionary.id,
                missionaryName: item.matchedMissionary.name,
                createdAt: new Date().toISOString()
            };

            await firebase.database().ref('support_history').push(record);

            await firebase.database().ref(`supporters/${supporterId}`).update({
                lastDonationDate: item.date,
                updatedAt: new Date().toISOString()
            });

            success++;
        } catch (e) {
            console.error(e);
            fail++;
        }
    }

    AdminUtils.showToast(`${success}건 저장 완료!`, 'success');

    // 모달 닫기
    document.getElementById('uploadModal').classList.remove('active');

    // 목록 새로고침
    if (window.loadSupporters) {
        await window.loadSupporters();
    } else {
        location.reload();
    }

    // 버튼 복구
    uploadBtn.innerHTML = originalBtnText;
    uploadBtn.disabled = false;
}
