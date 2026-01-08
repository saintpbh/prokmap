// update.js
document.addEventListener('DOMContentLoaded', async () => {
    // 1. URL 파라미터 파싱
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    const key = urlParams.get('key');

    if (!id || !key) {
        showError('유효하지 않은 링크입니다.');
        return;
    }

    // 2. 데이터 로드 및 검증
    try {
        await checkAccess(id, key);
        loadMissionaryData(id);
    } catch (error) {
        console.error(error);
        showError('데이터를 불러오는 중 오류가 발생했습니다.');
    }

    // 3. 폼 제출 이벤트
    document.getElementById('updateForm').addEventListener('submit', handleUpdate);
});

async function checkAccess(id, key) {
    // Firebase 익명 로그인 (누구나 읽기 가능하지만 쓰기는 규칙 필요)
    // 보안 규칙에서 .write는 accessKey 일치 시 허용으로 설정해야 함

    // 1. 선교사 데이터 로드
    const snapshot = await firebase.database().ref(`missionaries/${id}`).once('value');
    const data = snapshot.val();

    if (!data) {
        throw new Error('선교사 데이터가 없습니다.');
    }

    // 2. Access Key 검증
    if (data.accessKey !== key) {
        showError('접근 권한이 없는 링크입니다.');
        throw new Error('Invalid Access Key');
    }

    // 3. 전역 변수 저장
    window.currentMissionary = data;
    window.missionaryId = id;
}

function loadMissionaryData(id) {
    const data = window.currentMissionary;

    document.getElementById('loadingMessage').style.display = 'none';
    document.getElementById('updateForm').style.display = 'block';

    // --- 기본 정보 (Read Only) ---
    document.getElementById('nameDisplay').textContent = `${data.name} (${data.englishName || ''})`;
    document.getElementById('locationDisplay').textContent = `${data.country} / ${data.city || ''}`;
    document.getElementById('orgDisplay').textContent = `${data.presbytery || ''} / ${data.organization || ''}`;

    // --- Tab 1: 사역 보고 ---
    document.getElementById('summaryPrayer').value = data.summaryPrayer || '';
    document.getElementById('prayerTopic').value = data.prayerTopic || '';
    document.getElementById('prayer').value = data.prayer || '';
    document.getElementById('summary').value = data.summary || '';
    document.getElementById('ministryReport').value = data.ministryReport || '';

    // 문서 파일 목록
    if (data.reportFiles) {
        const fileList = document.getElementById('fileList');
        fileList.innerHTML = '<div style="margin-top:0.5rem; font-weight:bold;">기존 자료:</div>';
        data.reportFiles.forEach(file => {
            fileList.innerHTML += `
                <div style="font-size:0.9rem; margin-top:0.2rem;">
                    <a href="${file.url}" target="_blank"><i class="fas fa-file"></i> ${file.name}</a>
                    <span style="color:#999; font-size:0.8em;">(${new Date(file.date).toLocaleDateString()})</span>
                </div>
            `;
        });
    }

    // --- Tab 2: 사역 소개 (New) ---
    document.getElementById('ministryVision').value = data.ministryVision || ''; // 사역 비전
    document.getElementById('videoLink').value = data.videoLink || ''; // 동영상 링크

    // --- Tab 3: 개인정보 ---
    document.getElementById('mobile').value = data.mobile || data.localPhone || ''; // 모바일 (구 localPhone 호환)
    document.getElementById('koreaPhone').value = data.koreaPhone || '';
    document.getElementById('phoneChurch').value = data.phoneChurch || '';
    document.getElementById('phoneHome').value = data.phoneHome || '';
    document.getElementById('localAddress').value = data.localAddress || '';
    document.getElementById('healthStatus').value = data.healthStatus || 'healthy';

    // 가족 리스트
    const tbody = document.getElementById('familyListBody');
    tbody.innerHTML = '';
    if (data.familyMembers && Array.isArray(data.familyMembers)) {
        data.familyMembers.forEach(fam => addFamilyRow(fam));
    }
}

// 가족 행 추가
window.addFamilyRow = function (data = {}) {
    const tbody = document.getElementById('familyListBody');
    const tr = document.createElement('tr');

    tr.innerHTML = `
        <td><input type="text" class="form-input family-name" placeholder="이름" value="${data.name || ''}" style="width: 100%;"></td>
        <td>
            <input type="text" class="form-input family-relation" placeholder="관계" value="${data.relation || ''}" style="margin-bottom: 2px; width: 100%;">
            <select class="form-select family-gender" style="width: 100%;">
                <option value="M" ${data.gender === 'M' ? 'selected' : ''}>남</option>
                <option value="F" ${data.gender === 'F' ? 'selected' : ''}>여</option>
            </select>
        </td>
        <td><input type="date" class="form-input family-dob" value="${data.dob || ''}" style="width: 100%;"></td>
        <td>
            <input type="tel" class="form-input family-phone" placeholder="연락처" value="${data.phone || ''}" style="margin-bottom: 2px; width: 100%;">
            <input type="email" class="form-input family-email" placeholder="이메일" value="${data.email || ''}" style="width: 100%;">
        </td>
        <td style="text-align: center;">
            <button type="button" class="btn btn-danger btn-sm" onclick="removeFamilyRow(this)" title="삭제">
                <i class="fas fa-trash"></i>
            </button>
        </td>
    `;
    tbody.appendChild(tr);
};

window.removeFamilyRow = function (btn) {
    if (confirm('이 가족 구성원을 삭제하시겠습니까?')) {
        btn.closest('tr').remove();
    }
};

function showError(msg) {
    document.getElementById('loadingMessage').style.display = 'none';
    document.getElementById('updateForm').style.display = 'none';
    document.getElementById('errorMessage').style.display = 'block';

    const errText = document.querySelector('#errorMessage h3');
    if (errText) errText.textContent = msg;
}

// --- 저장 로직 ---
async function handleUpdate(e) {
    e.preventDefault();
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<div class="spinner" style="width: 20px; height: 20px; border-width: 2px;"></div> 저장 중...';

    // Image Compression Lazy Load
    let imageCompression;
    try {
        const module = await import('https://cdn.jsdelivr.net/npm/browser-image-compression@2.0.2/dist/browser-image-compression.js');
        imageCompression = window.imageCompression;
    } catch (err) {
        console.warn('Image compression lib failed to load', err);
    }

    try {
        const id = window.missionaryId;
        const updates = {};

        // 1. Text Fields Update
        updates.summaryPrayer = document.getElementById('summaryPrayer').value.trim();
        updates.prayerTopic = document.getElementById('prayerTopic').value.trim();
        updates.prayer = document.getElementById('prayer').value.trim();
        updates.summary = document.getElementById('summary').value.trim();

        updates.ministryReport = document.getElementById('ministryReport').value.trim();

        // 사역 소개 탭
        updates.ministryVision = document.getElementById('ministryVision').value;
        updates.videoLink = document.getElementById('videoLink').value;

        // 개인정보 탭
        updates.mobile = document.getElementById('mobile').value;
        updates.localPhone = document.getElementById('mobile').value; // 구 호환
        updates.koreaPhone = document.getElementById('koreaPhone').value;
        updates.phoneChurch = document.getElementById('phoneChurch').value;
        updates.phoneHome = document.getElementById('phoneHome').value;
        updates.localAddress = document.getElementById('localAddress').value;
        updates.healthStatus = document.getElementById('healthStatus').value;

        updates.lastUpdate = new Date().toISOString();

        // 2. Family Members Array
        const familyMembers = [];
        document.querySelectorAll('#familyListBody tr').forEach(tr => {
            const name = tr.querySelector('.family-name').value.trim();
            if (name) {
                familyMembers.push({
                    name: name,
                    relation: tr.querySelector('.family-relation').value.trim(),
                    gender: tr.querySelector('.family-gender').value,
                    dob: tr.querySelector('.family-dob').value,
                    phone: tr.querySelector('.family-phone').value.trim(),
                    email: tr.querySelector('.family-email').value.trim()
                });
            }
        });
        updates.familyMembers = familyMembers;

        // 3. File Uploads

        // A) Family/Profile Photo (Personal Tab)
        const familyFile = document.getElementById('familyPhoto').files[0];
        if (familyFile) {
            updates.familyPhotoUrl = await uploadFile(id, familyFile, 'family', imageCompression);
        }

        // B) Ministry Photos (Intro Tab)
        const ministryFiles = document.getElementById('ministryPhoto').files;
        if (ministryFiles && ministryFiles.length > 0) {
            if (ministryFiles.length > 3) throw new Error('사역 사진은 최대 3장까지만 가능합니다.');

            const ministryPhotoUrls = [];
            for (let i = 0; i < ministryFiles.length; i++) {
                const url = await uploadFile(id, ministryFiles[i], `ministry_${Date.now()}_${i}`, imageCompression);
                ministryPhotoUrls.push(url);
            }
            updates.ministryMapPhotos = ministryPhotoUrls; // 배열
            updates.ministryPhotoUrl = ministryPhotoUrls[0]; // 대표 사진 Legacy
        }

        // C) Report Documents (Report Tab)
        const reportFiles = document.getElementById('reportFiles').files;
        if (reportFiles && reportFiles.length > 0) {
            if (reportFiles.length > 5) throw new Error('자료 파일은 최대 5개까지만 가능합니다.');

            // 기존 리스트 + 새 파일
            let currentFiles = (window.currentMissionary.reportFiles || []).slice();

            for (let i = 0; i < reportFiles.length; i++) {
                const file = reportFiles[i];
                const path = `reports/${id}/${Date.now()}_${file.name}`;
                const url = await uploadRawFile(path, file);
                currentFiles.push({
                    name: file.name,
                    url: url,
                    date: new Date().toISOString()
                });
            }
            updates.reportFiles = currentFiles;
        }

        // 4. Perform DB Update
        await firebase.database().ref(`missionaries/${id}`).update(updates);

        alert('성공적으로 저장되었습니다! 관리자 승인 후 반영됩니다.');
        location.reload();

    } catch (error) {
        console.error('Update failed:', error);
        alert('저장 실패: ' + error.message);
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
    }
}

// 이미지 업로드 (압축 지원)
async function uploadFile(id, file, type, compressor) {
    let uploadFile = file;
    if (compressor && file.type.startsWith('image/')) {
        try {
            uploadFile = await compressor(file, { maxSizeMB: 1, maxWidthOrHeight: 1920 });
        } catch (e) { console.warn('Compression failed', e); }
    }

    const ref = firebase.storage().ref(`missionaries/${id}/${type}_${Date.now()}.jpg`);
    await ref.put(uploadFile);
    return await ref.getDownloadURL();
}

// 일반 파일 업로드 (압축 없음)
async function uploadRawFile(path, file) {
    const ref = firebase.storage().ref(path);
    await ref.put(file);
    return await ref.getDownloadURL();
}
