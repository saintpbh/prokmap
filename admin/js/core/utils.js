/**
 * Admin UI Utilities Module
 */
export const AdminUtils = {
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
        if (!container) return;
        container.innerHTML = '<div class="spinner"></div>';
    },

    // 에러 메시지 표시
    showError(container, message) {
        if (!container) return;
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

        overlay.onclick = (e) => {
            if (e.target === overlay) {
                overlay.remove();
                if (callback) callback(false);
            }
        };
    },

    // 확인 다이얼로그 (브라우저 기본)
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
            const compressedFile = await imageCompression(file, options);
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
