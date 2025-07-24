# Missionary Map App (모바일 전용)

이 폴더는 **모바일 전용 선교사 파송지도 웹앱** 소스만을 독립적으로 관리합니다. PC(데스크탑) 버전과 완전히 분리되어 있으며, 모바일만의 UI/UX, 데이터 흐름, 빌드/배포 구조를 가집니다.

---

## 📁 폴더 구조

```
/mobile/
  ├── index.html           # 모바일 앱 진입점(메인 HTML)
  ├── logo.svg             # 앱 로고
  ├── css/
  │    ├── mobile.css      # 모바일 전용 메인 스타일
  │    └── mobile-detail.css # 상세/팝업 등 추가 스타일
  └── js/
       ├── utils.js        # 유틸리티 및 데이터 로딩(fetchData 등)
       ├── countryBackgrounds.js # 국가별 배경/플래그
       ├── newsletterPopup.js    # 뉴스레터 팝업
       └── ui/
            ├── detailPopup.js
            ├── mobileDetailPopup.js
            ├── MobileMissionarySwiper.js
            ├── floatingMissionary.js
            ├── CountryStatsDetail.js
            └── PresbyteryStatsDetail.js
```

---

## 🚀 실행 방법

1. **Firebase 연동 필요**
   - `index.html`을 직접 브라우저에서 열면 바로 실행됩니다.
   - Firebase 실시간 DB에 missionaries, news 데이터가 있어야 정상 동작합니다.

2. **PC 코드/리소스 불필요**
   - 이 폴더만 복사/배포해도 모바일 앱이 완전히 동작합니다.

3. **테스트**
   - 모바일 기기 또는 브라우저(개발자 도구 모바일 모드)에서 `index.html`을 열어 확인

---

## 🛠️ 개발/수정 방법

- **모든 JS/CSS/이미지 등은 mobile 폴더 내에서만 관리**
- 데이터 로딩은 `js/utils.js`의 `window.fetchData` 함수로 Firebase에서 직접 불러옴
- UI/컴포넌트는 `js/ui/` 내 JS 파일에서만 관리
- PC 버전 코드, DataManager, uiManager 등은 전혀 사용하지 않음

---

## 📦 배포 방법

- `/mobile` 폴더 전체를 웹서버 또는 별도 도메인에 업로드
- `index.html`이 앱 진입점
- PWA, 독립 모바일 웹앱 등으로 확장 가능

---

## 📊 데이터 흐름

- missionaries, news 등은 Firebase 실시간 DB에서 직접 fetch
- fetchData → 캐시(window.cachedMissionaries 등) → 각 UI 컴포넌트에서 직접 사용
- 모든 통계/상세/스와이퍼/팝업 등은 모바일 데이터만 사용

---

## 📝 기타

- PC 버전과 완전 분리, 상호 영향 없음
- 문의/이슈: 담당자 또는 저장소 이슈 트래커 이용 