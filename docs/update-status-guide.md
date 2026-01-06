# 선교사 상태 업데이트 가이드

## 목적
모든 선교사의 상태를 '활동중'(active)으로 일괄 업데이트하는 방법을 안내합니다.

---

## 📋 사전 준비

### 필요한 권한
- Firebase 프로젝트에 대한 **편집자** 또는 **소유자** 권한
- Firebase Console 접근 권한

### 접속 정보
- Firebase Console URL: https://console.firebase.google.com/project/prokmap
- 프로젝트 이름: prokmap

---

## 🚀 실행 방법

### Step 1: Firebase Console 접속

1. 브라우저에서 Firebase Console 열기
   - URL: https://console.firebase.google.com/project/prokmap/database

2. 왼쪽 메뉴에서 **Realtime Database** 클릭

3. 데이터베이스가 표시되면 준비 완료

---

### Step 2: 브라우저 개발자 도구 열기

1. **F12** 키를 누르거나, 다음 방법 중 하나 사용:
   - Windows/Linux: `Ctrl + Shift + I`
   - Mac: `Cmd + Option + I`
   - 브라우저 메뉴 → 도구 → 개발자 도구

2. **Console** 탭 클릭

---

### Step 3: 스크립트 복사 및 실행

아래 스크립트를 **전체 복사**하여 Console에 붙여넣고 **Enter** 키를 누릅니다:

```javascript
// 모든 선교사 상태를 '활동중'으로 업데이트
(async function() {
    try {
        console.log('🚀 선교사 상태 업데이트를 시작합니다...');
        
        const db = firebase.database();
        const missionariesRef = db.ref('missionaries');
        
        // 모든 선교사 데이터 가져오기
        const snapshot = await missionariesRef.once('value');
        const missionaries = snapshot.val();
        
        if (!missionaries) {
            console.log('❌ 선교사 데이터가 없습니다.');
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
        console.log(`📝 ${count}명의 선교사 상태를 업데이트합니다...`);
        await db.ref().update(updates);
        
        console.log(`✅ 완료! ${count}명의 선교사 상태가 '활동중'으로 업데이트되었습니다.`);
        
        // 결과 확인
        console.log('📊 업데이트된 선교사 목록:');
        Object.keys(missionaries).slice(0, 5).forEach(key => {
            console.log(`  - ${missionaries[key].name}: active`);
        });
        if (count > 5) {
            console.log(`  ... 그 외 ${count - 5}명`);
        }
        
    } catch (error) {
        console.error('❌ 업데이트 실패:', error);
        console.error('오류 상세:', error.message);
    }
})();
```

---

### Step 4: 결과 확인

스크립트 실행 후 Console에 다음과 같은 메시지가 표시됩니다:

```
🚀 선교사 상태 업데이트를 시작합니다...
📝 XX명의 선교사 상태를 업데이트합니다...
✅ 완료! XX명의 선교사 상태가 '활동중'으로 업데이트되었습니다.
📊 업데이트된 선교사 목록:
  - 홍길동: active
  - 김철수: active
  ...
```

---

## 🔍 업데이트 확인

### 방법 1: Firebase Console에서 확인

1. Realtime Database 탭에서 `missionaries` 노드 확장
2. 임의의 선교사 선택
3. `status` 필드가 `"active"`로 표시되는지 확인

### 방법 2: 관리자 페이지에서 확인

1. https://prokmap.web.app/admin 접속
2. 선교사 관리 메뉴 클릭
3. 선교사 목록에서 상태 확인 (추후 UI 추가 예정)

---

## ⚠️ 주의사항

### 데이터 백업
- 중요한 작업이므로 실행 전 Firebase Console에서 데이터 내보내기 권장
- Realtime Database → (⋮) 메뉴 → **데이터 내보내기 (JSON)**

### 권한 확인
- Firebase Console에 로그인한 계정이 프로젝트 편집 권한이 있는지 확인
- 권한이 없으면 "Permission denied" 오류 발생

### 네트워크 연결
- 스크립트 실행 중 인터넷 연결이 끊어지지 않도록 주의
- 업데이트가 진행 중일 때 페이지를 새로고침하지 마세요

---

## 🐛 문제 해결

### "firebase is not defined" 오류
**원인**: Firebase Console이 아닌 다른 페이지에서 실행
**해결**: Firebase Console의 Realtime Database 페이지에서 실행

### "Permission denied" 오류
**원인**: Firebase 프로젝트 접근 권한 없음
**해결**: 프로젝트 소유자에게 권한 요청

### 일부 선교사만 업데이트됨
**원인**: 네트워크 중단 또는 스크립트 오류
**해결**: 스크립트를 다시 실행 (중복 업데이트는 문제없음)

---

## 📝 스크립트 설명

### 주요 동작
1. Firebase Realtime Database에서 모든 선교사 데이터 가져오기
2. 각 선교사의 `status` 필드를 `'active'`로 설정
3. `update()` 메서드로 일괄 업데이트
4. 업데이트 결과를 Console에 출력

### 데이터 구조
```json
{
  "missionaries": {
    "missionary_001": {
      "name": "홍길동",
      "country": "태국",
      "status": "active"  ← 이 필드가 추가/업데이트됨
    },
    ...
  }
}
```

---

## 📞 지원

문제가 발생하면 다음 정보를 준비하여 문의하세요:
- Firebase Console에 표시되는 오류 메시지 (스크린샷)
- Console 탭의 오류 로그
- 사용 중인 브라우저 및 버전

---

## ✅ 완료 체크리스트

- [ ] Firebase Console 접속 확인
- [ ] 개발자 도구 Console 탭 열기
- [ ] 스크립트 복사 및 붙여넣기
- [ ] Enter 키로 실행
- [ ] "✅ 완료!" 메시지 확인
- [ ] Realtime Database에서 status 필드 확인
- [ ] (선택) 데이터 백업 확인

---

**마지막 업데이트**: 2026-01-06
**스크립트 위치**: `/scripts/update-missionary-status.js`
