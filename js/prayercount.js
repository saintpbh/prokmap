// prayercount.js
// Firebase에서 실시간 중보기도자(접속자) 수를 가져오는 모듈 (window 방식)

// Firebase App 및 Database SDK가 이미 로드되어 있다고 가정
// (mobile.html에서 CDN 또는 별도 스크립트로 로드 필요)

window.initPrayerCount = function(firebaseApp, onCountChange) {
  if (!firebaseApp || !window.firebase) {
    console.warn('Firebase가 로드되지 않았습니다.');
    return;
  }
  
  try {
    const db = window.firebase.database();
    
    // 1. 고유 ID 생성 (브라우저별, 세션별)
    let userId = sessionStorage.getItem('prayerUserId');
    if (!userId) {
      userId = 'user_' + Math.random().toString(36).substr(2, 9);
      sessionStorage.setItem('prayerUserId', userId);
    }
    const userRef = db.ref('prayerUsers/' + userId);

    // 2. 접속 시 true 기록
    userRef.set({
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      page: window.location.pathname
    });

    // 3. onDisconnect로 자동 삭제
    userRef.onDisconnect().remove();

    // 4. prayerCount는 prayerUsers 하위 노드 개수로 계산
    const usersRef = db.ref('prayerUsers');
    let lastCount = null;
    
    usersRef.on('value', (snapshot) => {
      const users = snapshot.val() || {};
      const count = Object.keys(users).length;
      
             console.log('중보기도자 수 업데이트:', count, '명');
       
       // 접근성 안내
       if (window.announceToScreenReader) {
           window.announceToScreenReader(`현재 ${count}명의 중보기도자가 함께 기도하고 있습니다`);
       }
       
       // DOM 요소 업데이트
       const prayerCountDiv = document.getElementById('prayer-count-info');
      if (prayerCountDiv) {
        prayerCountDiv.innerHTML = `<span class="prayer-icon">🙏</span>현재 <span class="prayer-count-number">${count}</span>명의 중보기도자가 함께 기도하고 있습니다.`;
        
        // 숫자 글로우 애니메이션
        const numberSpan = prayerCountDiv.querySelector('.prayer-count-number');
        if (numberSpan) {
          numberSpan.style.animation = 'none';
          void numberSpan.offsetWidth; // 리플로우 강제
          numberSpan.style.animation = 'prayerNumberGlow 1.2s';
          
          // 숫자가 증가할 때 stun 효과
          if (lastCount !== null && count > lastCount) {
            numberSpan.classList.add('stun');
            setTimeout(() => numberSpan.classList.remove('stun'), 700);
          }
        }
      } else {
        console.warn('prayer-count-info 요소를 찾을 수 없습니다.');
      }
      
      if (typeof onCountChange === 'function') onCountChange(count);
      lastCount = count;
    });

    // 주기적으로 사용자 상태 갱신 (연결 유지)
    setInterval(() => {
      if (db && userId) {
        userRef.update({
          timestamp: Date.now()
        });
      }
    }, 30000); // 30초마다

    // 오래된 사용자 정리 (5분 이상 비활성)
    setInterval(() => {
      cleanupInactiveUsers(db);
    }, 60000); // 1분마다

    console.log('중보기도자 수 기능 초기화 완료');
    
  } catch (error) {
    console.error('중보기도자 수 기능 초기화 실패:', error);
  }
};

// 비활성 사용자 정리 함수
function cleanupInactiveUsers(db) {
  const now = Date.now();
  const inactiveThreshold = 5 * 60 * 1000; // 5분

  db.ref('prayerUsers').once('value').then((snapshot) => {
    const users = snapshot.val() || {};
    Object.keys(users).forEach(userKey => {
      const user = users[userKey];
      if (now - user.timestamp > inactiveThreshold) {
        db.ref('prayerUsers').child(userKey).remove();
        console.log('비활성 사용자 제거:', userKey);
      }
    });
  });
}

window.removePrayerCountListener = function(firebaseApp) {
  // (옵션) 리스너 해제용, 필요시 구현
  if (firebaseApp && window.firebase) {
    const db = window.firebase.database();
    db.ref('prayerUsers').off();
    console.log('중보기도자 수 리스너 해제됨');
  }
}; 