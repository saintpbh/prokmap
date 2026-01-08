/**
 * Firebase Database Helper Module
 */
export class FirebaseDB {
    constructor() {
        this.db = firebase.database();
    }

    // 선교사 목록 가져오기 (전체)
    async getMissionaries() {
        const snapshot = await this.db.ref('missionaries').once('value');
        const data = snapshot.val();
        if (!data) return [];

        return Object.keys(data).map(key => ({
            id: key,
            ...data[key]
        }));
    }

    // 선교사 목록 페이징 가져오기
    async getMissionariesPaged(pageSize = 20, lastKey = null) {
        let query = this.db.ref('missionaries').orderByKey();

        if (lastKey) {
            query = query.startAt(lastKey);
        }

        const limit = lastKey ? pageSize + 1 : pageSize;
        const snapshot = await query.limitToFirst(limit).once('value');
        const data = snapshot.val();

        if (!data) return { items: [], lastKey: null };

        let items = Object.keys(data).map(key => ({
            id: key,
            ...data[key]
        }));

        if (lastKey && items.length > 0) {
            items = items.filter(item => item.id !== lastKey);
        }

        const nextLastKey = items.length > 0 ? items[items.length - 1].id : null;

        return {
            items: items,
            lastKey: nextLastKey,
            hasMore: items.length >= pageSize
        };
    }

    // 선교사 추가
    async addMissionary(missionaryData) {
        const newRef = this.db.ref('missionaries').push();
        const timestamp = new Date().toISOString();

        await newRef.set({
            ...missionaryData,
            createdAt: timestamp,
            updatedAt: timestamp,
            createdBy: firebase.auth().currentUser?.email || 'unknown'
        });

        return newRef.key;
    }

    // 선교사 업데이트
    async updateMissionary(id, missionaryData) {
        const timestamp = new Date().toISOString();

        await this.db.ref(`missionaries/${id}`).update({
            ...missionaryData,
            updatedAt: timestamp
        });
    }

    // 선교사 삭제
    async deleteMissionary(id) {
        await this.db.ref(`missionaries/${id}`).remove();
    }

    // 뉴스레터 추가
    async addNewsletter(newsletterData) {
        const newRef = this.db.ref('newsletters').push();
        const timestamp = new Date().toISOString();

        await newRef.set({
            ...newsletterData,
            uploadDate: timestamp,
            uploadedBy: firebase.auth().currentUser?.email || 'unknown'
        });

        return newRef.key;
    }

    // 통계 가져오기
    async getStats() {
        const missionaries = await this.getMissionaries();

        const stats = {
            total: missionaries.length,
            countries: new Set(missionaries.map(m => m.country)).size,
            presbyteries: new Set(missionaries.map(m => m.presbytery).filter(p => p)).size,
            active: missionaries.filter(m => m.status === 'active').length
        };

        return stats;
    }
}
