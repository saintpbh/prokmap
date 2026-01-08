/**
 * Global App Initialization Module
 */
import { AdminAuth } from './auth.js';
import { FirebaseDB } from './database.js';
import { AdminUtils } from './utils.js';

// Setup Bridge (Backward Compatibility)
window.AdminUtils = AdminUtils;
window.FirebaseDB = FirebaseDB;
window.AdminAuth = AdminAuth;

// Global Instances
export const adminAuth = new AdminAuth();
export const firebaseDB = new FirebaseDB();

window.adminAuth = adminAuth;
window.firebaseDB = firebaseDB;

// Common Page Setup
export function initCommon() {
    adminAuth.init();
    AdminUtils.initMobileMenu();

    // Logout Button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.onclick = () => adminAuth.signOut();
    }

    // Modal Events
    setupModalEvents();
}

function setupModalEvents() {
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.onclick = (e) => {
            const modal = e.target.closest('.modal');
            if (modal) modal.classList.remove('active');
        };
    });

    document.querySelectorAll('.modal').forEach(modal => {
        modal.onclick = (e) => {
            if (e.target === modal) modal.classList.remove('active');
        };
    });
}

// Auto-init on load if requested or just setup
document.addEventListener('DOMContentLoaded', () => {
    // We check for a data-auto-init attribute on the script tag if we want to control this
    initCommon();
});
