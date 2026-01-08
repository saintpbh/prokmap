import { firebaseDB } from '../../core/app-init.js';

export const certificateApi = {
    async fetchMissionaries() {
        return await firebaseDB.getMissionaries();
    }
};
