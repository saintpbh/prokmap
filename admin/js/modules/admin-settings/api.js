import { firebaseDB } from '../../core/app-init.js';

export const adminApi = {
    async fetchAdmins() {
        const snapshot = await firebaseDB.db.ref('admins').once('value');
        const data = snapshot.val();
        return data ? Object.values(data) : [];
    },

    async saveAdmin(email, addedBy) {
        const key = email.replace(/\./g, ',');
        await firebaseDB.db.ref(`admins/${key}`).set({
            email: email,
            addedAt: new Date().toISOString(),
            addedBy: addedBy
        });
    },

    async deleteAdmin(key) {
        await firebaseDB.db.ref(`admins/${key}`).remove();
    }
};
