import { firebaseDB } from '../../core/app-init.js';

export const communicationApi = {
    async fetchGroups() {
        const snapshot = await firebaseDB.db.ref('missionaryGroups').once('value');
        const data = snapshot.val();
        return data ? Object.keys(data).map(key => ({ id: key, ...data[key] })) : [];
    },

    async fetchMissionaries() {
        return await firebaseDB.getMissionaries();
    },

    async fetchHistory(limit = 10) {
        const snapshot = await firebaseDB.db.ref('communications')
            .orderByChild('sentAt')
            .limitToLast(limit)
            .once('value');
        const data = snapshot.val();
        if (!data) return [];
        return Object.keys(data).map(key => ({
            id: key,
            ...data[key]
        })).reverse();
    },

    async saveCommunication(data) {
        await firebaseDB.db.ref('communications').push({
            ...data,
            sentAt: new Date().toISOString(),
            status: 'sent'
        });
    }
};
