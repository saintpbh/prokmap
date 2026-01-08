import { firebaseDB } from '../../core/app-init.js';

export const prokApi = {
    async fetchMissionaries() {
        return await firebaseDB.getMissionaries();
    },

    async uploadToProk(formData) {
        const res = await fetch('/api/prok-upload', {
            method: 'POST',
            body: formData
        });
        return await res.json();
    }
};
