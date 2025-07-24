// PcWeb Firebase 설정 및 초기화
const firebaseConfig = {
  apiKey: "AIzaSyCrJIhyTYQ4bTUW4jarFqluD97xKao2kF0",
  authDomain: "prokworldmap.firebaseapp.com",
  databaseURL: "https://prokworldmap-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "prokworldmap",
  storageBucket: "prokworldmap.appspot.com",
  messagingSenderId: "728381830842",
  appId: "1:728381830842:web:ea9541db40f3710891f483",
  measurementId: "G-0MK0N145WP"
};

// Firebase SDK가 로드되었는지 확인하고 초기화
function initializeFirebase() {
  if (typeof firebase === 'undefined') {
    console.warn('Firebase SDK가 아직 로드되지 않았습니다. 잠시 후 다시 시도합니다.');
    setTimeout(initializeFirebase, 100);
    return;
  }

  // Firebase 초기화 (중복 설정 방지)
  let app;
  if (!firebase.apps.length) {
    app = firebase.initializeApp(firebaseConfig);
  } else {
    app = firebase.app();
  }

  // Firebase 서비스 초기화 (안전한 초기화)
  let auth, db, firestore;

  try {
    if (firebase.auth) {
      auth = firebase.auth();
    }
    if (firebase.database) {
      db = firebase.database();
    }
    if (firebase.firestore) {
      firestore = firebase.firestore();
    }
  } catch (error) {
    console.warn('Firebase 서비스 초기화 중 일부 서비스를 사용할 수 없습니다:', error);
  }

  // Firebase 서비스 내보내기
  window.firebaseServices = {
    auth,
    db,
    firestore
  };

  // Firestore 연동 (v9 호환, window.db로 전역 등록)
  if (firebase.firestore) {
    window.db = firebase.firestore();
  }

  console.log('PcWeb Firebase 초기화 완료');
}

// Firebase 초기화 실행
initializeFirebase();

// Firebase 연결 상태 확인
window.checkFirebaseConnection = function() {
  return new Promise((resolve, reject) => {
    if (!window.firebase) {
      reject(new Error('Firebase SDK가 로드되지 않았습니다.'));
      return;
    }
    
    // Firebase가 초기화되었는지 확인
    if (!firebase.apps.length) {
      reject(new Error('Firebase가 초기화되지 않았습니다.'));
      return;
    }
    
    try {
      // Realtime Database 연결 확인
      if (firebase.database) {
        const db = firebase.database();
        db.ref('.info/connected').once('value')
          .then(snapshot => {
            const connected = snapshot.val();
            if (connected) {
              console.log('Firebase Realtime Database 연결됨');
              resolve(true);
            } else {
              console.log('Firebase Realtime Database 연결 안됨');
              // Firestore 연결 시도
              if (firebase.firestore) {
                const firestore = firebase.firestore();
                firestore.collection('test').limit(1).get()
                  .then(() => {
                    console.log('Firebase Firestore 연결됨');
                    resolve(true);
                  })
                  .catch(() => {
                    console.log('Firebase 연결 확인 실패');
                    resolve(false); // 연결 실패해도 앱은 계속 작동
                  });
              } else {
                resolve(false); // 연결 실패해도 앱은 계속 작동
              }
            }
          })
          .catch(err => {
            console.error('Firebase 연결 확인 실패:', err);
            resolve(false); // 연결 실패해도 앱은 계속 작동
          });
      } else {
        // Realtime Database가 없으면 Firestore만 확인
        if (firebase.firestore) {
          const firestore = firebase.firestore();
          firestore.collection('test').limit(1).get()
            .then(() => {
              console.log('Firebase Firestore 연결됨');
              resolve(true);
            })
            .catch(() => {
              console.log('Firebase Firestore 연결 안됨');
              resolve(false); // 연결 실패해도 앱은 계속 작동
            });
        } else {
          resolve(false); // 연결 실패해도 앱은 계속 작동
        }
      }
    } catch (error) {
      console.error('Firebase 연결 확인 중 오류:', error);
      resolve(false); // 연결 실패해도 앱은 계속 작동
    }
  });
};

// 페이지 로드 시 Firebase 연결 확인
document.addEventListener('DOMContentLoaded', function() {
  window.checkFirebaseConnection()
    .then(() => {
      console.log('Firebase 연결 성공');
    })
    .catch(err => {
      console.error('Firebase 연결 실패:', err);
    });
}); 