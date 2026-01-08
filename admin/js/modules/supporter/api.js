/**
 * Supporter API Module
 */
import { firebaseDB } from '../../core/app-init.js';
import { state } from './state.js';

export async function fetchSupporters() {
    const snapshot = await firebase.database().ref('supporters').once('value');
    const data = snapshot.val();
    state.allSupporters = data ? Object.keys(data).map(key => ({ id: key, ...data[key] })) : [];
    state.filteredSupporters = [...state.allSupporters];
    return state.allSupporters;
}

export async function fetchMissionariesForSupporter() {
    state.allMissionaries = await firebaseDB.getMissionaries();
    return state.allMissionaries;
}

export async function saveSupporterData(id, formData) {
    if (id) {
        await firebase.database().ref(`supporters/${id}`).update(formData);
    } else {
        const newData = { ...formData, createdAt: new Date().toISOString() };
        await firebase.database().ref('supporters').push(newData);
    }
}

export async function deleteSupporterData(id) {
    await firebase.database().ref(`supporters/${id}`).remove();
}
