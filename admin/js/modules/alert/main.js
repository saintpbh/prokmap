import { adminAuth } from '../../core/app-init.js';
import { alertUi } from './ui.js';
import { alertApi } from './api.js';
import { AdminUtils } from '../../core/utils.js';

document.addEventListener('DOMContentLoaded', () => {
    initAlertPage();
});

function initAlertPage() {
    firebase.auth().onAuthStateChanged((user) => {
        if (user && adminAuth.allowedEmails.includes(user.email)) {
            alertApi.subscribeToAlert(alertUi.updateAlertStatus);
            setupEventListeners();
        }
    });
}

function setupEventListeners() {
    window.broadcastAlert = async () => {
        const text = document.getElementById('emergencyAlertInput').value.trim();
        if (!text) {
            AdminUtils.showToast('공지할 내용을 입력해주세요.', 'warning');
            return;
        }

        try {
            await alertApi.broadcastAlert(text);
            AdminUtils.showToast('긴급 알림이 즉시 송출되었습니다.', 'success');
        } catch (error) {
            console.error('알림 송출 오류:', error);
            AdminUtils.showToast('알림 송출에 실패했습니다.', 'error');
        }
    };

    window.clearAlert = async () => {
        try {
            await alertApi.clearAlert();
            AdminUtils.showToast('긴급 알림이 해제되었습니다.', 'success');
        } catch (error) {
            console.error('알림 해제 오류:', error);
            AdminUtils.showToast('알림 해제에 실패했습니다.', 'error');
        }
    };
}
