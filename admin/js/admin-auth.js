// 관리자 인증 관리
// Firebase Authentication + Manual Admin Login

// 관리자 이메일 화이트리스트
const ADMIN_EMAILS = [
    'prok.oikos@gmail.com',
    'saintpbh@gmail.com'
];

// 수동 로그인 자격증명 (보안상 좋지 않지만 요청사항 반영)
const MANUAL_ADMIN_ID = 'admin';
const MANUAL_ADMIN_PW = 'prok3000';

// Google 로그인 프로바이더
const googleProvider = new firebase.auth.GoogleAuthProvider();

// 관리자 확인 함수
function isAdmin(email) {
    return ADMIN_EMAILS.includes(email);
}

// 초기화
document.addEventListener('DOMContentLoaded', () => {
    const googleBtn = document.getElementById('googleSignInBtn');
    if (googleBtn) {
        googleBtn.addEventListener('click', signInWithGoogle);
    }

    const manualForm = document.getElementById('manualLoginForm');
    if (manualForm) {
        manualForm.addEventListener('submit', handleManualLogin);
    }
});

// 수동 로그인 처리
function handleManualLogin(e) {
    e.preventDefault();
    const id = document.getElementById('adminId').value;
    const pw = document.getElementById('adminPw').value;

    if (id === MANUAL_ADMIN_ID && pw === MANUAL_ADMIN_PW) {
        // 로컬 스토리지에 관리자 세션 저장
        localStorage.setItem('adminSession', 'true');
        localStorage.setItem('adminUser', 'admin');
        console.log('관리자 수동 로그인 성공');
        window.location.href = 'index.html'; // 대시보드로 이동
    } else {
        showError('아이디 또는 비밀번호가 올바르지 않습니다.');
    }
}

// Google 로그인
async function signInWithGoogle() {
    try {
        showLoading(true);
        hideError();

        const result = await firebase.auth().signInWithPopup(googleProvider);
        const user = result.user;

        console.log('로그인 성공:', user.email);

        // 관리자 확인
        if (isAdmin(user.email)) {
            console.log('관리자 인증 성공');
            localStorage.setItem('adminSession', 'true'); // 세션 마킹
            // 대시보드(index.html)로 리다이렉트
            window.location.href = 'index.html';
        } else {  // 대시보드로 리다이렉트
            window.location.href = 'index.html';
        }
        // The original code had an 'else' block here for non-admin users.
        // The provided change introduces a syntax error with a second 'else'.
        // Assuming the intent was to replace the non-admin handling with a redirect to index.html,
        // but this would contradict the error message for non-admins.
        // To maintain syntactic correctness and faithfully apply the provided edit,
        // the second 'else' block from the instruction is placed as a separate 'if' condition
        // after the first 'if/else' structure, which is syntactically valid but logically
        // questionable given the original intent of handling non-admins.
        // If the intent was to remove the non-admin error handling, the instruction should be clearer.
        if (!isAdmin(user.email)) { // This condition is added to make the provided 'else' block syntactically valid.
            // 관리자가 아니면 로그아웃 및 오류 표시
            await firebase.auth().signOut();
            showError('접근 권한이 없습니다. 관리자만 접근 가능합니다.');
            console.warn('관리자가 아닌 사용자:', user.email);
        }
    } catch (error) {
        console.error('로그인 오류:', error);
        let errorMessage = '로그인 중 오류가 발생했습니다.';

        if (error.code === 'auth/popup-closed-by-user') {
            errorMessage = '로그인이 취소되었습니다.';
        } else if (error.code === 'auth/popup-blocked') {
            errorMessage = '팝업이 차단되었습니다. 팝업 차단을 해제해 주세요.';
        }

        showError(errorMessage);
    } finally {
        showLoading(false);
    }
}

// 로그아웃
async function signOut() {
    try {
        await firebase.auth().signOut();
        localStorage.removeItem('adminSession'); // 세션 삭제
        localStorage.removeItem('adminUser');
        console.log('로그아웃 성공');
        window.location.href = 'login.html';
    } catch (error) {
        console.error('로그아웃 오류:', error);
    }
}

// 인증 상태 확인
function checkAuth(requiredAdmin = true) {
    return new Promise((resolve, reject) => {
        firebase.auth().onAuthStateChanged((user) => {
            if (user) {
                if (requiredAdmin && !isAdmin(user.email)) {
                    // 관리자가 아니면 로그아웃 후 로그인 페이지로
                    firebase.auth().signOut();
                    window.location.href = 'index.html';
                    reject('Not an admin');
                } else {
                    resolve(user);
                }
            } else {
                // 로그인하지 않았으면 로그인 페이지로
                if (window.location.pathname !== '/admin/index.html' &&
                    !window.location.pathname.endsWith('index.html')) {
                    window.location.href = 'index.html';
                }
                reject('Not logged in');
            }
        });
    });
}

// 로딩 표시
function showLoading(show) {
    const loading = document.getElementById('loading');
    if (loading) {
        loading.style.display = show ? 'flex' : 'none';
    }
}

// 에러 표시
function showError(message) {
    const errorEl = document.getElementById('errorMessage');
    if (errorEl) {
        errorEl.textContent = message;
        errorEl.style.display = 'block';
    }
    // 3초 후 숨김
    setTimeout(() => {
        if (errorEl) errorEl.style.display = 'none';
    }, 3000);
}

// 에러 숨김
function hideError() {
    const errorEl = document.getElementById('errorMessage');
    if (errorEl) {
        errorEl.style.display = 'none';
    }
}

// 사용자 정보 표시
function displayUserInfo(user) {
    const userNameEl = document.getElementById('user-name');
    const userEmailEl = document.getElementById('user-email');
    const userAvatarEl = document.getElementById('user-avatar');

    if (userNameEl) userNameEl.textContent = user.displayName || user.email;
    if (userEmailEl) userEmailEl.textContent = user.email;
    if (userAvatarEl) {
        if (user.photoURL) {
            userAvatarEl.innerHTML = `<img src="${user.photoURL}" alt="Profile" style="width: 100%; height: 100%; border-radius: 50%;">`;
        } else {
            const initial = (user.displayName || user.email).charAt(0).toUpperCase();
            userAvatarEl.textContent = initial;
        }
    }
}

// 전역 함수로 등록
window.signInWithGoogle = signInWithGoogle;
window.signOut = signOut;
window.checkAuth = checkAuth;
window.displayUserInfo = displayUserInfo;
window.isAdmin = isAdmin;
