import { firebaseDB } from '../../core/app-init.js';

export const groupApi = {
    async fetchGroups() {
        const snapshot = await firebaseDB.db.ref('missionaryGroups').once('value');
        const data = snapshot.val();
        return data ? Object.keys(data).map(key => ({ id: key, ...data[key] })) : [];
    },

    async fetchMissionaries() {
        return await firebaseDB.getMissionaries();
    },

    async saveGroup(id, data) {
        if (id) {
            await firebaseDB.db.ref(`missionaryGroups/${id}`).update({
                ...data,
                updatedAt: new Date().toISOString()
            });
        } else {
            const timestamp = new Date().toISOString();
            await firebaseDB.db.ref('missionaryGroups').push({
                ...data,
                createdAt: timestamp,
                updatedAt: timestamp
            });
        }
    },

    async deleteGroup(id) {
        await firebaseDB.db.ref(`missionaryGroups/${id}`).remove();
    }
};
