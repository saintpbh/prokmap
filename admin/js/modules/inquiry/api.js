import { firebaseDB } from '../../core/app-init.js';

export const inquiryApi = {
    async fetchInquiries() {
        const snapshot = await firebaseDB.db.ref('inquiries').once('value');
        const data = snapshot.val();
        if (!data) return [];

        return Object.keys(data).map(key => ({
            id: key,
            ...data[key]
        })).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    },

    async updateStatus(id, newStatus) {
        await firebaseDB.db.ref(`inquiries/${id}/status`).set(newStatus);
    }
};
