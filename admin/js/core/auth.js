/**
 * Admin Authentication Module
 */
import { AdminUtils } from './utils.js';

export class AdminAuth {
    constructor() {
        this.currentUser = null;
        this.allowedEmails = ['saintpbh@gmail.com', 'prok.oikos@gmail.com'];
        this.dbAdmins = [];
    }

    async init() {
        // 1. 수동 관리자 로그인 세션 확인
        const manualSession = localStorage.getItem('adminSession');

        if (manualSession === 'true') {
            console.log('Manual admin session detected');
            this.currentUser = { email: 'admin' };
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
            }
        } catch (e) {
            console.warn('관리자 목록을 DB에서 가져오지 못했습니다. 기본 권한을 사용합니다.');
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
        const combinedAllowed = [...new Set([...this.allowedEmails, ...this.dbAdmins])];

        if (!combinedAllowed.includes(user.email)) {
            AdminUtils.showToast('접근 권한이 없습니다.', 'error');
            firebase.auth().signOut();
            return;
        }

        // 부트스트래핑
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

        if (!window.location.pathname.includes('login.html')) {
            this.displayUserInfo();
        } else {
            window.location.href = 'index.html';
        }
    }

    handleUserLogout() {
        if (localStorage.getItem('adminSession') === 'true') return;
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
            AdminUtils.showToast('로그인 실패: ' + error.message, 'error');
        }
    }

    async signOut() {
        try {
            await firebase.auth().signOut();
            window.location.href = 'login.html';
        } catch (error) {
            AdminUtils.showToast('로그아웃 실패: ' + error.message, 'error');
        }
    }
}
