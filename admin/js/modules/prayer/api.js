/**
 * Prayer API Module
 */
import { firebaseDB } from '../../core/app-init.js';
import { state } from './state.js';

export async function loadPrayerMissionaries() {
    state.allMissionaries = await firebaseDB.getMissionaries();
    state.allMissionaries.sort((a, b) => a.name.localeCompare(b.name));
    state.filteredMissionaries = [...state.allMissionaries];
    return state.allMissionaries;
}

export async function updatePrayerData(id, updateData) {
    await firebaseDB.updateMissionary(id, {
        ...updateData,
        updatedAt: new Date().toISOString()
    });

    // Update local state
    const idx = state.allMissionaries.findIndex(m => m.id === id);
    if (idx !== -1) {
        state.allMissionaries[idx] = { ...state.allMissionaries[idx], ...updateData };
    }
}
