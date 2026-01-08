// admins.js - 관리 권한 설정 페이지 로직

let allAdmins = [];

// 페이지 초기화
firebase.auth().onAuthStateChanged((user) => {
    if (user && adminAuth.allowedEmails.includes(user.email)) {
        initAdminsPage();
    }
});

async function initAdminsPage() {
    try {
        await loadAdmins();
        setupEventListeners();
    } catch (error) {
        console.error('페이지 초기화 오류:', error);
        AdminUtils.showToast('페이지를 불러오는 중 오류가 발생했습니다.', 'error');
    }
}

// 관리자 목록 로드
async function loadAdmins() {
    const tableEl = document.getElementById('adminsTable');
    AdminUtils.showLoading(tableEl);

    try {
        const snapshot = await firebase.database().ref('admins').once('value');
        const data = snapshot.val();
        allAdmins = data ? Object.values(data) : [];

        // 정렬
        allAdmins.sort((a, b) => a.email.localeCompare(b.email));

        renderAdminsTable();
    } catch (error) {
        AdminUtils.showError(tableEl, '데이터를 불러올 수 없습니다.');
        console.error(error);
    }
}

// 테이블 렌더링
function renderAdminsTable() {
    const tableEl = document.getElementById('adminsTable');

    if (allAdmins.length === 0) {
        tableEl.innerHTML = '<p style="text-align: center; padding: 2rem; color: #999;">관리자가 없습니다.</p>';
        return;
    }

    let html = `
        <table class="data-table">
            <thead>
                <tr>
                    <th>이메일 계정</th>
                    <th>추가일</th>
                    <th>관리</th>
                </tr>
            </thead>
            <tbody>
    `;

    allAdmins.forEach(admin => {
        const key = admin.email.replace(/\./g, ',');
        const isSystem = admin.addedBy === 'system' || adminAuth.allowedEmails.includes(admin.email);

        html += `
            <tr>
                <td><strong>${admin.email}</strong> ${isSystem ? '<span class="badge badge-success" style="font-size: 0.7rem; margin-left: 5px;">기본</span>' : ''}</td>
                <td>${admin.addedAt ? AdminUtils.formatDate(admin.addedAt) : '-'}</td>
                <td>
                    ${isSystem ? '<small style="color: #999;">시스템 계정은 삭제 불가</small>' : `
                        <button class="btn btn-danger btn-sm" onclick="deleteAdmin('${key}', '${admin.email}')">
                            <i class="fas fa-trash-alt"></i> 삭제
                        </button>
                    `}
                </td>
            </tr>
        `;
    });

    html += `
            </tbody>
        </table>
    `;

    tableEl.innerHTML = html;
}

// 모달 열기
window.openAddAdminModal = function () {
    document.getElementById('adminForm').reset();
    AdminUtils.openModal('adminModal');
};

// 관리자 삭제
window.deleteAdmin = async function (key, email) {
    AdminUtils.showConfirm(`"${email}" 관리자를 정말 삭제하시겠습니까?`, async (confirmed) => {
        if (confirmed) {
            try {
                await firebase.database().ref(`admins/${key}`).remove();
                AdminUtils.showToast('관리자가 삭제되었습니다.');
                loadAdmins();
            } catch (error) {
                console.error('삭제 오류:', error);
                AdminUtils.showToast('삭제 중 오류가 발생했습니다.', 'error');
            }
        }
    });
};

// 이벤트 리스너 설정
function setupEventListeners() {
    const form = document.getElementById('adminForm');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = document.getElementById('adminEmail').value.trim();
        if (!email) return;

        const key = email.replace(/\./g, ',');

        try {
            await firebase.database().ref(`admins/${key}`).set({
                email: email,
                addedAt: new Date().toISOString(),
                addedBy: firebase.auth().currentUser.email
            });

            AdminUtils.showToast('관리자가 성공적으로 추가되었습니다.');
            AdminUtils.closeModal('adminModal');
            loadAdmins();
        } catch (error) {
            console.error('저장 오류:', error);
            AdminUtils.showToast('저장 중 오류가 발생했습니다.', 'error');
        }
    });
}
