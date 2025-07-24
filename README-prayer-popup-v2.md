# 기도 팝업 모듈 v2.0

## 📋 개요

기도 팝업 모듈 v2.0은 선교사 기도 요청을 표시하는 새로운 디자인과 기능을 제공합니다. 기존 시스템과 완전히 호환되면서도 향상된 사용자 경험을 제공합니다.

## 🎨 디자인 특징

### 모던 글래스모피즘 2.0
- **부드러운 블러 효과**: 20px backdrop-filter로 현대적인 느낌
- **미세한 애니메이션**: 부드러운 페이드 인/아웃과 호버 효과
- **향상된 가독성**: 더 나은 타이포그래피와 색상 대비
- **반응형 디자인**: 모바일과 데스크톱 모두 최적화

### 주요 개선사항
- ✅ 더 큰 아바타 (44px)와 명확한 정보 레이아웃
- ✅ 전체 너비 기도하기 버튼으로 사용성 향상
- ✅ 상태별 버튼 애니메이션 (로딩, 성공, 실패)
- ✅ 다크 모드 완전 지원
- ✅ 접근성 개선 (포커스 스타일, 모션 감소 지원)

## 📁 파일 구조

```
PcWeb/
├── js/ui/
│   ├── prayerPopup.js          # 새로운 기도 팝업 모듈
│   └── prayerPopupAdapter.js   # 기존 시스템 호환 어댑터
├── css/
│   └── prayerPopup.css         # 새로운 스타일시트
├── prayer-popup-test.html      # 테스트 페이지
└── README-prayer-popup-v2.md   # 이 파일
```

## 🚀 사용법

### 1. 기본 사용법

```html
<!-- CSS 로드 -->
<link rel="stylesheet" href="css/prayerPopup.css">

<!-- JavaScript 로드 -->
<script src="js/ui/prayerPopup.js"></script>
<script src="js/ui/prayerPopupAdapter.js"></script>
```

### 2. 새로운 모듈 직접 사용

```javascript
// 새로운 PrayerPopupManager 인스턴스 생성
const prayerManager = new PrayerPopupManager();

// 순회 시작
prayerManager.startRotation();

// 순회 중지
prayerManager.stopRotation();

// 일시정지/재개
prayerManager.pause();
prayerManager.resume();

// 단일 팝업 생성
const popup = prayerManager.createPrayerPopup({
    flagUrl: "https://flagcdn.com/w40/jp.png",
    name: "김선교",
    country: "일본",
    city: "도쿄",
    missionary: missionaryData
});
```

### 3. 기존 시스템과 호환

```javascript
// 기존 함수들 그대로 사용 가능
startPrayerRotation();
stopPrayerRotation();
isPrayerRotationActive();

// 기존 createMinimalPrayerPopup 함수도 자동으로 새로운 디자인 사용
const popup = createMinimalPrayerPopup({
    flagUrl, name, country, missionary
});
```

## 🔧 설정 옵션

### PrayerPopupManager 설정

```javascript
const prayerManager = new PrayerPopupManager();

// 설정 업데이트
prayerManager.updateSettings({
    animationDuration: 4000,  // 순회 간격 (밀리초)
    fadeDuration: 300         // 페이드 애니메이션 시간 (밀리초)
});
```

## 🎯 주요 기능

### 1. 자동 순회 시스템
- 4초마다 선교사 기도 팝업 자동 순환
- 마우스 오버 시 일시정지, 마우스 아웃 시 재개
- 닫기 버튼 클릭 시 순환 재시작

### 2. Firestore 통합
- 선교사별 최신 뉴스레터 요약 자동 로드
- 실시간 데이터 업데이트 지원

### 3. 기도 클릭 처리
- 비동기 기도 처리 지원
- 로딩, 성공, 실패 상태별 시각적 피드백
- 기도 알림 시스템 연동

### 4. 반응형 디자인
- 모바일 최적화 (300px 너비)
- 터치 친화적 인터페이스
- 다양한 화면 크기 지원

## 🎨 CSS 클래스

### 주요 클래스
- `.prayer-popup-v2`: 메인 팝업 컨테이너
- `.popup-header`: 헤더 섹션 (아바타 + 정보)
- `.popup-content`: 기도 내용 섹션
- `.popup-action`: 액션 버튼 섹션
- `.prayer-action-btn`: 기도하기 버튼

### 상태 클래스
- `.popup-closing`: 닫기 애니메이션
- `.prayer-loading`: 로딩 상태
- `.prayer-success`: 성공 상태
- `.prayer-error`: 오류 상태

## 🧪 테스트

테스트 페이지를 통해 모든 기능을 확인할 수 있습니다:

```bash
# 브라우저에서 열기
open PcWeb/prayer-popup-test.html
```

### 테스트 기능
- ✅ 순회 시작/중지/일시정지/재개
- ✅ 단일 팝업 표시
- ✅ 마커 클릭 시 팝업 표시
- ✅ 기도 클릭 처리 시뮬레이션
- ✅ 반응형 디자인 확인

## 🔄 기존 시스템과의 호환성

### 완전 호환
- 기존 `startPrayerRotation()`, `stopPrayerRotation()` 함수
- 기존 `createMinimalPrayerPopup()` 함수
- 기존 `FloatingPrayerManager` 클래스 인터페이스

### 자동 전환
- 어댑터를 통해 기존 코드 수정 없이 새로운 디자인 적용
- 기존 CSS와 충돌하지 않는 독립적인 스타일

## 🎯 성능 최적화

### 렌더링 최적화
- CSS 애니메이션 활용으로 GPU 가속
- 불필요한 DOM 조작 최소화
- 메모리 누수 방지를 위한 적절한 이벤트 정리

### 로딩 최적화
- 필요한 시점에만 모듈 초기화
- 지연 로딩으로 초기 페이지 로드 시간 단축

## 🐛 문제 해결

### 일반적인 문제들

1. **팝업이 표시되지 않음**
   ```javascript
   // MissionaryMap 객체 확인
   console.log(window.MissionaryMap?.state?.missionaries);
   ```

2. **Firestore 연결 오류**
   ```javascript
   // Firebase 초기화 확인
   console.log(window.firebase?.firestore);
   ```

3. **스타일이 적용되지 않음**
   ```html
   <!-- CSS 파일 경로 확인 -->
   <link rel="stylesheet" href="css/prayerPopup.css">
   ```

### 디버깅 모드

```javascript
// 디버깅 정보 활성화
const prayerManager = new PrayerPopupManager();
prayerManager.debug = true;
```

## 📈 향후 계획

### v2.1 예정 기능
- [ ] 애니메이션 커스터마이징 옵션
- [ ] 다국어 지원
- [ ] 키보드 네비게이션 개선
- [ ] 성능 모니터링 도구

### v3.0 계획
- [ ] Web Components 기반 재구성
- [ ] TypeScript 지원
- [ ] 더 많은 테마 옵션
- [ ] 플러그인 시스템

## 📞 지원

문제가 발생하거나 개선 제안이 있으시면 이슈를 등록해 주세요.

---

**버전**: 2.0.0  
**최종 업데이트**: 2024년 12월  
**호환성**: 기존 시스템 100% 호환 