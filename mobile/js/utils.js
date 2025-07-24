// utils.js
// 모든 유틸 함수는 window에 등록

// 예시: 기존에 export function foo() 였다면 아래처럼 변환
// window.foo = function() { ... }

// 실제 함수 내용을 아래에 추가해 주세요.

window.isRecent = function(updateDate) {
    if (!updateDate) return false;
    const days = (new Date() - new Date(updateDate)) / (1000 * 60 * 60 * 24);
    return days < 60;
}

window.getLatLng = function(item, country, constants) {
    if (item.lat && item.lng && !isNaN(item.lat) && !isNaN(item.lng)) {
        return [parseFloat(item.lat), parseFloat(item.lng)];
    }
    if (constants.CITY_LATLNGS && item.city && constants.CITY_LATLNGS[item.city]) {
        return constants.CITY_LATLNGS[item.city];
    }
    return constants.LATLNGS[country] || [20, 0];
}

// Firebase에서 missionaries, news 데이터를 불러오는 fetchData 함수
window.fetchData = function(callback) {
  if (!window.firebase || !window.firebase.database) {
    callback(new Error('Firebase not initialized'));
    return;
  }
  const db = window.firebase.database();
  db.ref('missionaries').once('value')
    .then(snapshot => {
      const missionaries = [];
      snapshot.forEach(child => {
        missionaries.push(child.val());
      });
      db.ref('news').once('value')
        .then(newsSnap => {
          const news = [];
          newsSnap.forEach(child => {
            news.push(child.val());
          });
          callback(null, { missionaries, news });
        });
    })
    .catch(err => callback(err));
}; 