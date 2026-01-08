/**
 * Missionary API Module
 */
import { firebaseDB } from '../../core/app-init.js';
import { AdminUtils } from '../../core/utils.js';
import { state } from './state.js';

export async function loadMissionaries(loadMore = false) {
    const tableEl = document.getElementById('missionariesTable');
    if (!loadMore) {
        AdminUtils.showLoading(tableEl);
        state.allMissionaries = [];
        state.lastKey = null;
    }

    try {
        const result = await firebaseDB.getMissionariesPaged(state.PAGE_SIZE, state.lastKey);

        if (loadMore) {
            state.allMissionaries = [...state.allMissionaries, ...result.items];
        } else {
            state.allMissionaries = result.items;
        }

        state.lastKey = result.lastKey;
        state.hasMore = result.hasMore;

        // Note: applyFilters will be called by UI module
        return state.allMissionaries;
    } catch (error) {
        if (!loadMore) AdminUtils.showError(tableEl, '데이터를 불러올 수 없습니다.');
        throw error;
    }
}

export async function loadSupporters() {
    try {
        const snapshot = await firebase.database().ref('supporters').once('value');
        const data = snapshot.val();
        state.allSupporters = data ? Object.keys(data).map(key => ({ id: key, ...data[key] })) : [];
        return state.allSupporters;
    } catch (error) {
        console.error('후원자 데이터 로드 실패:', error);
        return [];
    }
}

export async function saveMissionary(missionaryId, data) {
    try {
        if (missionaryId) {
            await firebaseDB.updateMissionary(missionaryId, data);
        } else {
            await firebaseDB.addMissionary(data);
        }
        return true;
    } catch (error) {
        console.error('선교사 저장 실패:', error);
        throw error;
    }
}

export async function deleteMissionary(id, name) {
    if (!AdminUtils.confirm(`"${name}" 선교사를 아카이브하시겠습니까? (복원 가능)`)) {
        return;
    }

    try {
        await firebaseDB.updateMissionary(id, {
            isActive: false,
            status: 'archived',
            archivedAt: new Date().toISOString(),
            archivedBy: firebase.auth().currentUser?.email
        });
        AdminUtils.showToast('선교사가 아카이브되었습니다. (복원 가능)', 'success');
        await loadMissionaries();
    } catch (error) {
        console.error('아카이브 오류:', error);
        AdminUtils.showToast('아카이브 중 오류가 발생했습니다.', 'error');
    }
}

export async function restoreMissionary(id, name) {
    const missionary = state.allMissionaries.find(m => m.id === id);
    if (!missionary) return;

    try {
        let updateData = {};
        let toastMsg = "";

        if (missionary.isDeleted) {
            updateData = {
                isDeleted: false,
                deletedAt: null,
                isActive: false,
                status: 'archived',
                restoredAt: new Date().toISOString()
            };
            toastMsg = `"${name}" 선교사가 휴지통에서 아카이브로 복원되었습니다.`;
        } else {
            updateData = {
                isActive: true,
                status: 'active',
                archivedAt: null,
                archivedBy: null,
                restoredAt: new Date().toISOString(),
                restoredBy: firebase.auth().currentUser?.email
            };
            toastMsg = `"${name}" 선교사가 활동 중으로 복원되었습니다.`;
        }

        await firebaseDB.updateMissionary(id, updateData);
        AdminUtils.showToast(toastMsg, 'success');
        await loadMissionaries();
    } catch (error) {
        console.error('복원 오류:', error);
        AdminUtils.showToast('복원 중 오류가 발생했습니다.', 'error');
    }
}

export async function moveToTrash(id, name, skipConfirm = false) {
    const execute = async () => {
        try {
            await firebaseDB.updateMissionary(id, {
                isDeleted: true,
                deletedAt: new Date().toISOString(),
                deletedBy: firebase.auth().currentUser?.email || 'unknown',
                isActive: false,
                status: 'deleted'
            });
            AdminUtils.showToast('선교사가 휴지통으로 이동되었습니다 (100일 후 영구 삭제)', 'success');
            await loadMissionaries();
        } catch (error) {
            console.error('휴지통 이동 오류:', error);
            AdminUtils.showToast('휴지통 이동 중 오류가 발생했습니다.', 'error');
        }
    };

    if (skipConfirm) {
        await execute();
    } else {
        AdminUtils.showConfirm(`"${name}" 선교사를 정말 삭제 하시겠습니까?\n삭제 100일 후 영구 삭제됩니다.`, (confirmed) => {
            if (confirmed) execute();
        });
    }
}

export async function backupData() {
    if (!confirm('현재 등록된 모든 선교사 데이터를 JSON 파일로 다운로드하시겠습니까?')) return;

    try {
        AdminUtils.showLoading(document.body);
        const snapshot = await firebase.database().ref('missionaries').once('value');
        const data = snapshot.val();

        if (!data) {
            alert('데이터가 없습니다.');
            document.querySelector('.spinner')?.remove();
            return;
        }

        const jsonString = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const today = new Date().toISOString().split('T')[0];
        const a = document.createElement('a');
        a.href = url;
        a.download = `missionaries_backup_${today}.json`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);

        document.querySelector('.spinner')?.remove();
        AdminUtils.showToast('데이터 백업이 완료되었습니다.', 'success');
    } catch (error) {
        console.error('백업 실패:', error);
        document.querySelector('.spinner')?.remove();
        AdminUtils.showToast('백업 중 오류가 발생했습니다.', 'error');
    }
}

// Global exposure for legacy buttons in table or header
window.deleteMissionary = deleteMissionary;
window.restoreMissionary = restoreMissionary;
window.moveToTrash = moveToTrash;
window.backupData = backupData;
