import { firebaseDB } from '../../core/app-init.js';

export const alertApi = {
    subscribeToAlert(callback) {
        firebaseDB.db.ref('settings/emergencyAlert').on('value', snapshot => {
            callback(snapshot.val());
        });
    },

    async broadcastAlert(text) {
        await firebaseDB.db.ref('settings/emergencyAlert').set(text);
    },

    async clearAlert() {
        await firebaseDB.db.ref('settings/emergencyAlert').remove();
    }
};
