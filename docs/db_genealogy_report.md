# 📊 DB 연결 계통도 및 데이터 구조 리포트

이 문서는 프로젝트에서 사용 중인 모든 데이터베이스(RTDB, Firestore, Storage)의 저장 경로와 목적, 그리고 하드코딩된 주요 데이터를 정리한 리포트입니다.

## 1. Firebase Realtime Database (RTDB)
실시간 동기화가 필요한 주요 리전 데이터 및 설정 정보가 저장됩니다.

| 경로 (Path) | 주요 용도 | 주요 필드 | 관련 파일 |
| :--- | :--- | :--- | :--- |
| `missionaries/` | 전체 선교자 통합 명부 | `name`, `country`, `city`, `lat/lng`, `prayerTopic`, `familyMembers`, `status` | `missionaryMap.js`, `update.js` |
| `supporters/` | 후원자 정보 관리 | `name`, `phone`, `email`, `organization`, `address` | `supporters.js`, `support-upload.js` |
| `support_history/` | 후원 내역(트랜잭션) | `missionaryId`, `supporterId`, `amount`, `date`, `depositorName` | `support-upload.js` |
| `inquiries/` | 고객 문의/상담 내역 | `name`, `email`, `subject`, `content`, `date` | `detailPopup.js`, `inquiries.html` |
| `missionaryGroups/` | 선교사 그룹/소속 분류 | `name`, `description`, `missionaryIds` | `groups.html` |
| `newsletters/` | 뉴스레터 PDF 정보 | `name`, `prayer`, `date`, `url` | `setup.js`, `newsletters.html` |

## 2. Firebase Firestore (NoSQL)
뉴스레터 요약 및 외부 링크 등 문서 기반 데이터가 저장됩니다.

| 컬렉션 (Collection) | 주요 용도 | 주요 필드 | 관련 파일 |
| :--- | :--- | :--- | :--- |
| `newsletters` | 뉴스레터 메타데이터 | `missionaryName`, `summary`, `url`, `isExternalLink` | `setup.js` |
| `test` | DB 연결 확인용 | - | `firebase-config.js` |

## 3. Firebase Storage (파일 저장소)
이미지 및 문서 등 대용량 파일이 저장되는 버킷입니다.

| 경로 | 저장 내용 | 파일 이름 규칙 |
| :--- | :--- | :--- |
| `missionaries/{id}/` | 선교사별 사진/서류 | `familyPhoto_*.jpg`, `missionaryPhoto_*.jpg`, `document_*.pdf` |
| `newsletters/` | 뉴스레터 PDF 원본 | `{missionaryName}_{timestamp}.pdf` |

## 4. 하드코딩된 주요 데이터 (Hard-coded)
프로그램 코드 내에 고정값으로 정의된 데이터입니다.

| 파일 위치 | 데이터 종류 | 내용 |
| :--- | :--- | :--- |
| `js/missionaryMap.js` | 국가코드 매핑 | `COUNTRY_FLAGS` (국가명 <-> ISO 코드) |
| `js/setup.js` | 기본 문구 | 뉴스레터 업로드 시 기본 기도 제목 등 |
| `js/dataManager.js` | 필드 별칭(Alias) | `sent_date` -> `sentDate` 등 필드명 호환성 매핑 |

> [!NOTE]
> 최근 `admin/js/update_data_*.js` 파일들은 모두 삭제되어 더 이상 시스템에서 로드되지 않습니다. 모든 데이터는 위 1~3번 데이터베이스에서 동적으로 로드됩니다.
