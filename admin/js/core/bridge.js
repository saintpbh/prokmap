/**
 * Legacy Bridge Module
 * Connects modern ES modules to the global window object for backward compatibility.
 */
import { AdminUtils } from './utils.js';
import { FirebaseDB } from './database.js';
import { AdminAuth } from './auth.js';

// Attach to window for legacy support
window.AdminUtils = AdminUtils;
window.FirebaseDB = FirebaseDB;
window.AdminAuth = AdminAuth;

// Initialize global instances if not already created
if (!window.firebaseDB) {
    window.firebaseDB = new FirebaseDB();
}

if (!window.adminAuth) {
    window.adminAuth = new AdminAuth();
    // adminAuth.init() is usually called by the page or common logic
}

console.log('🚀 Modern Core Modules loaded and bridged.');
