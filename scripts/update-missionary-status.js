// 모든 선교사 상태를 '활동중'으로 업데이트하는 스크립트
// 사용법: Firebase Console에서 JavaScript 콘솔에 붙여넣기

// Firebase Realtime Database 참조
const db = firebase.database();
const missionariesRef = db.ref('missionaries');

async function updateAllMissionaryStatus() {
    try {
        console.log('모든 선교사 상태 업데이트를 시작합니다...');

        // 모든 선교사 데이터 가져오기
        const snapshot = await missionariesRef.once('value');
        const missionaries = snapshot.val();

        if (!missionaries) {
            console.log('선교사 데이터가 없습니다.');
            return;
        }

        const updates = {};
        let count = 0;

        // 각 선교사의 status를 'active'로 설정
        Object.keys(missionaries).forEach(key => {
            updates[`missionaries/${key}/status`] = 'active';
            count++;
        });

        // 일괄 업데이트
        await db.ref().update(updates);

        console.log(`✅ 완료! ${count}명의 선교사 상태가 '활동중'으로 업데이트되었습니다.`);

    } catch (error) {
        console.error('업데이트 실패:', error);
    }
}

// 실행
updateAllMissionaryStatus();
