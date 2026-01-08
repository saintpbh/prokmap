// Admin Panel - Common JavaScript
class AdminAuth {
    constructor() {
        this.currentUser = null;
        this.allowedEmails = ['saintpbh@gmail.com', 'prok.oikos@gmail.com'];
    }

    async init() {
        // 1. 수동 관리자 로그인 세션 확인
        const manualSession = localStorage.getItem('adminSession');

        if (manualSession === 'true') {
            console.log('Manual admin session detected');
            this.currentUser = { email: 'admin' }; // 가상의 유저 객체
            if (window.location.pathname.includes('login.html')) {
                window.location.href = 'index.html';
            } else {
                this.displayUserInfo();
            }
            return;
        }

        // 2. DB에서 관리자 목록 가져오기 시도
        try {
            const snapshot = await firebase.database().ref('admins').once('value');
            const data = snapshot.val();
            if (data) {
                this.dbAdmins = Object.values(data).map(a => a.email);
            } else {
                this.dbAdmins = [];
            }
        } catch (e) {
            console.warn('관리자 목록을 DB에서 가져오지 못했습니다. 기본 권한을 사용합니다.');
            this.dbAdmins = [];
        }

        // 3. Firebase Auth 상태 감지
        firebase.auth().onAuthStateChanged((user) => {
            if (user) {
                this.handleUserLogin(user);
            } else {
                this.handleUserLogout();
            }
        });
    }

    async handleUserLogin(user) {
        // 허용된 이메일 합치기
        const combinedAllowed = [...new Set([...this.allowedEmails, ...(this.dbAdmins || [])])];

        if (!combinedAllowed.includes(user.email)) {
            this.showToast('접근 권한이 없습니다.', 'error');
            firebase.auth().signOut();
            return;
        }

        // 부트스트래핑: 만약 DB에 관리자가 한 명도 없고 허용된 관리자가 접속했다면 DB에 추가
        if (this.dbAdmins.length === 0 && this.allowedEmails.includes(user.email)) {
            try {
                const adminRef = firebase.database().ref('admins');
                for (const email of this.allowedEmails) {
                    const key = email.replace(/\./g, ',');
                    await adminRef.child(key).set({
                        email: email,
                        addedAt: new Date().toISOString(),
                        addedBy: 'system'
                    });
                }
                console.log('Admin list bootstrapped to DB');
            } catch (e) {
                console.error('Failed to bootstrap admin list:', e);
            }
        }

        this.currentUser = user;

        // 로그인 페이지가 아니면 사용자 정보 표시
        if (!window.location.pathname.includes('login.html')) {
            this.displayUserInfo();
        } else {
            window.location.href = 'index.html'; // 로그인 상태면 메인으로
        }
    }

    handleUserLogout() {
        // 수동 로그인도 없는 경우에만 리다이렉트
        if (localStorage.getItem('adminSession') === 'true') return;

        // 로그인 페이지가 아니면 로그인 페이지로 리다이렉트
        if (!window.location.pathname.includes('login.html')) {
            window.location.href = 'login.html';
        }
    }

    displayUserInfo() {
        const userEmailEl = document.getElementById('userEmail');
        if (userEmailEl) {
            if (localStorage.getItem('adminUser') === 'admin') {
                userEmailEl.textContent = 'Administrator';
            } else if (this.currentUser) {
                userEmailEl.textContent = this.currentUser.email;
            }
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

    // 확인 다이얼로그 (커스텀 전용)
    showConfirm(message, callback) {
        // 기존 모달이 있다면 제거
        const existing = document.querySelector('.confirm-modal-overlay');
        if (existing) existing.remove();

        const overlay = document.createElement('div');
        overlay.className = 'confirm-modal-overlay';
        overlay.innerHTML = `
            <div class="confirm-modal-content">
                <div class="confirm-modal-message">${message}</div>
                <div class="confirm-modal-buttons">
                    <button class="confirm-modal-btn cancel">취소</button>
                    <button class="confirm-modal-btn confirm">확인</button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        overlay.querySelector('.cancel').onclick = () => {
            overlay.remove();
            if (callback) callback(false);
        };

        overlay.querySelector('.confirm').onclick = () => {
            overlay.remove();
            if (callback) callback(true);
        };

        // 외부 클릭 시 취소
        overlay.onclick = (e) => {
            if (e.target === overlay) {
                overlay.remove();
                if (callback) callback(false);
            }
        };
    },

    // 확인 다이얼로그 (브라우저 기본 - 하위 호환용)
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
    },

    // 모바일 메뉴 초기화
    initMobileMenu() {
        const header = document.querySelector('.admin-header h1');
        if (!header) return;

        if (!document.querySelector('.mobile-menu-btn')) {
            const btn = document.createElement('button');
            btn.className = 'mobile-menu-btn';
            btn.innerHTML = '<i class="fas fa-bars"></i>';
            btn.type = 'button';
            btn.style.background = 'none';
            btn.style.border = 'none';
            btn.style.marginRight = '0.5rem';
            btn.style.cursor = 'pointer';
            btn.style.color = 'var(--primary-color)';

            header.insertBefore(btn, header.firstChild);

            btn.addEventListener('click', () => {
                const sidebar = document.querySelector('.sidebar');
                if (sidebar) {
                    sidebar.classList.toggle('active');
                }
            });
        }
    },

    // 이미지 압축 (Promise 기반)
    async compressImage(file, options = { maxSizeMB: 1, maxWidthOrHeight: 1920, useWebWorker: true }) {
        if (typeof imageCompression === 'undefined') {
            console.warn('browser-image-compression 라이브러리가 로드되지 않았습니다.');
            return file;
        }
        try {
            console.log(`[이미지 압축 시작] 원본: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
            const compressedFile = await imageCompression(file, options);
            console.log(`[이미지 압축 완료] 압축: ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`);
            return compressedFile;
        } catch (error) {
            console.error('이미지 압축 오류:', error);
            return file;
        }
    },

    // 공통 이미지 업로드 (압축 포함)
    async uploadImage(file, path) {
        if (!file) return null;

        const compressedFile = await this.compressImage(file);

        const storageRef = firebase.storage().ref().child(path);
        const snapshot = await storageRef.put(compressedFile);
        return await snapshot.ref.getDownloadURL();
    }
};

// Firebase 데이터베이스 헬퍼
class FirebaseDB {
    constructor() {
        this.db = firebase.database();
    }

    // 선교사 목록 가져오기 (전체 - 레거시/검색용)
    async getMissionaries() {
        // 성능을 위해 최근 업데이트 순으로 가져오기 시도
        const snapshot = await this.db.ref('missionaries').once('value');
        const data = snapshot.val();
        if (!data) return [];

        return Object.keys(data).map(key => ({
            id: key,
            ...data[key]
        }));
    }

    // 선교사 목록 페이징 가져오기
    async getMissionariesPaged(pageSize = 20, lastKey = null) {
        let query = this.db.ref('missionaries').orderByKey();

        if (lastKey) {
            query = query.startAt(lastKey);
        }

        // lastKey가 있으면 1개 더 가져와서 중복 제거
        const limit = lastKey ? pageSize + 1 : pageSize;
        const snapshot = await query.limitToFirst(limit).once('value');
        const data = snapshot.val();

        if (!data) return { items: [], lastKey: null };

        let items = Object.keys(data).map(key => ({
            id: key,
            ...data[key]
        }));

        // lastKey 중복 제거 및 다음 lastKey 추출
        if (lastKey && items.length > 0) {
            items = items.filter(item => item.id !== lastKey);
        }

        const nextLastKey = items.length > 0 ? items[items.length - 1].id : null;

        return {
            items: items,
            lastKey: nextLastKey,
            hasMore: items.length >= pageSize
        };
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

    // 모바일 메뉴 버튼 초기화
    AdminUtils.initMobileMenu();

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
