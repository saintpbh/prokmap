// Admin Panel - Common JavaScript
class AdminAuth {
    constructor() {
        this.currentUser = null;
        this.allowedEmails = ['saintpbh@gmail.com', 'prok.oikos@gmail.com'];
    }

    async init() {
        // Firebase Auth 상태 감지
        firebase.auth().onAuthStateChanged((user) => {
            if (user) {
                this.handleUserLogin(user);
            } else {
                this.handleUserLogout();
            }
        });
    }

    handleUserLogin(user) {
        // 허용된 이메일인지 확인
        if (!this.allowedEmails.includes(user.email)) {
            this.showToast('접근 권한이 없습니다.', 'error');
            firebase.auth().signOut();
            return;
        }

        this.currentUser = user;

        // 로그인 페이지가 아니면 사용자 정보 표시
        if (!window.location.pathname.includes('login.html')) {
            this.displayUserInfo();
        }
    }

    handleUserLogout() {
        // 로그인 페이지가 아니면 로그인 페이지로 리다이렉트
        if (!window.location.pathname.includes('login.html')) {
            window.location.href = 'login.html';
        }
    }

    displayUserInfo() {
        const userEmailEl = document.getElementById('userEmail');
        if (userEmailEl && this.currentUser) {
            userEmailEl.textContent = this.currentUser.email;
        }
    }

    async signInWithGoogle() {
        const provider = new firebase.auth.GoogleAuthProvider();
        try {
            await firebase.auth().signInWithPopup(provider);
        } catch (error) {
            this.showToast('로그인 실패: ' + error.message, 'error');
        }
    }

    async signOut() {
        try {
            await firebase.auth().signOut();
            window.location.href = 'login.html';
        } catch (error) {
            this.showToast('로그아웃 실패: ' + error.message, 'error');
        }
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.remove();
        }, 3000);
    }
}

// 유틸리티 함수들
const AdminUtils = {
    // 날짜 포맷팅
    formatDate(dateString) {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    },

    // 로딩 스피너 표시
    showLoading(container) {
        container.innerHTML = '<div class="spinner"></div>';
    },

    // 에러 메시지 표시
    showError(container, message) {
        container.innerHTML = `<div class="error-message">❌ ${message}</div>`;
    },

    // 토스트 메시지
    showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <span>${type === 'success' ? '✅' : '❌'}</span>
            <span>${message}</span>
        `;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.remove();
        }, 3000);
    },

    // 확인 다이얼로그
    confirm(message) {
        return window.confirm(message);
    },

    // 모달 열기
    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('active');
        }
    },

    // 모달 닫기
    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
        }
    }
};

// Firebase 데이터베이스 헬퍼
class FirebaseDB {
    constructor() {
        this.db = firebase.database();
    }

    // 선교사 목록 가져오기
    async getMissionaries() {
        const snapshot = await this.db.ref('missionaries').once('value');
        const data = snapshot.val();
        if (!data) return [];

        return Object.keys(data).map(key => ({
            id: key,
            ...data[key]
        }));
    }

    // 선교사 추가
    async addMissionary(missionaryData) {
        const newRef = this.db.ref('missionaries').push();
        const timestamp = new Date().toISOString();

        await newRef.set({
            ...missionaryData,
            createdAt: timestamp,
            updatedAt: timestamp,
            createdBy: firebase.auth().currentUser?.email || 'unknown'
        });

        return newRef.key;
    }

    // 선교사 업데이트
    async updateMissionary(id, missionaryData) {
        const timestamp = new Date().toISOString();

        await this.db.ref(`missionaries/${id}`).update({
            ...missionaryData,
            updatedAt: timestamp
        });
    }

    // 선교사 삭제
    async deleteMissionary(id) {
        await this.db.ref(`missionaries/${id}`).remove();
    }

    // 뉴스레터 추가
    async addNewsletter(newsletterData) {
        const newRef = this.db.ref('newsletters').push();
        const timestamp = new Date().toISOString();

        await newRef.set({
            ...newsletterData,
            uploadDate: timestamp,
            uploadedBy: firebase.auth().currentUser?.email || 'unknown'
        });

        return newRef.key;
    }

    // 통계 가져오기
    async getStats() {
        const missionaries = await this.getMissionaries();

        const stats = {
            total: missionaries.length,
            countries: new Set(missionaries.map(m => m.country)).size,
            presbyteries: new Set(missionaries.map(m => m.presbytery).filter(p => p)).size,
            active: missionaries.filter(m => m.status === 'active').length
        };

        return stats;
    }
}

// 전역 변수
let adminAuth;
let firebaseDB;

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', () => {
    adminAuth = new AdminAuth();
    adminAuth.init();

    firebaseDB = new FirebaseDB();

    // 로그아웃 버튼 이벤트
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            adminAuth.signOut();
        });
    }

    // 모달 닫기 버튼들
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const modal = e.target.closest('.modal');
            if (modal) {
                modal.classList.remove('active');
            }
        });
    });

    // 모달 외부 클릭 시 닫기
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    });
});
