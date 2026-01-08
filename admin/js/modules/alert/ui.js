import { state } from './state.js';

export const alertUi = {
    updateAlertStatus(alertText) {
        state.currentAlert = alertText;
        const statusEl = document.getElementById('alertStatus');
        const textEl = document.getElementById('currentAlertText');
        const inputEl = document.getElementById('emergencyAlertInput');

        if (alertText) {
            statusEl.style.display = 'block';
            textEl.textContent = alertText;
            inputEl.value = alertText;
        } else {
            statusEl.style.display = 'none';
        }
    }
};
