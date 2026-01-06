// 관리자 인증 관리
// Firebase Authentication을 사용한 Google 로그인

// 관리자 이메일 화이트리스트
const ADMIN_EMAILS = [
    'prok.oikos@gmail.com'
];

// Google 로그인 프로바이더
const googleProvider = new firebase.auth.GoogleAuthProvider();

// 관리자 확인 함수
function isAdmin(email) {
    return ADMIN_EMAILS.includes(email);
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
            // 대시보드로 리다이렉트
            window.location.href = 'dashboard.html';
        } else {
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
        console.log('로그아웃 성공');
        window.location.href = 'index.html';
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

// UI 헬퍼 함수
function showLoading(show) {
    const loadingEl = document.getElementById('loading');
    if (loadingEl) {
        loadingEl.style.display = show ? 'block' : 'none';
    }
}

function showError(message) {
    const errorEl = document.getElementById('error-message');
    if (errorEl) {
        errorEl.textContent = message;
        errorEl.classList.add('show');
    }
}

function hideError() {
    const errorEl = document.getElementById('error-message');
    if (errorEl) {
        errorEl.classList.remove('show');
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
window.signInWithGoogle = signIn WithGoogle;
window.signOut = signOut;
window.checkAuth = checkAuth;
window.displayUserInfo = displayUserInfo;
window.isAdmin = isAdmin;
