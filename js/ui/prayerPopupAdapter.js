/**
 * 기도 팝업 모듈 어댑터
 * 기존 시스템과 새로운 PrayerPopupManager를 연결
 */

// 기존 FloatingPrayerManager를 새로운 PrayerPopupManager로 교체
class PrayerPopupAdapter {
    constructor() {
        this.prayerManager = null;
        this.isInitialized = false;
    }

    // 초기화
    init() {
        if (this.isInitialized) return;

        // 새로운 PrayerPopupManager 인스턴스 생성
        if (typeof PrayerPopupManager !== 'undefined') {
            this.prayerManager = new PrayerPopupManager();
            this.isInitialized = true;
            console.log('기도 팝업 어댑터 초기화 완료');
        } else {
            console.error('PrayerPopupManager가 로드되지 않았습니다.');
        }
    }

    // 기존 FloatingPrayerManager 메서드 호환성
    startRotation() {
        this.init();
        if (this.prayerManager) {
            this.prayerManager.startRotation();
        }
    }

    stopRotation() {
        if (this.prayerManager) {
            this.prayerManager.stopRotation();
        }
    }

    pause() {
        if (this.prayerManager) {
            this.prayerManager.pause();
        }
    }

    resume() {
        if (this.prayerManager) {
            this.prayerManager.resume();
        }
    }

    isActive() {
        return this.prayerManager ? this.prayerManager.isActive() : false;
    }

    closeCurrentPopup() {
        if (this.prayerManager) {
            this.prayerManager.closeCurrentPopup();
        }
    }

    showNextPrayerPopup() {
        if (this.prayerManager) {
            this.prayerManager.showNextPrayerPopup();
        }
    }
}

// 전역 변수 교체 (기존 호환성 유지)
let floatingPrayerManager = null;

// 페이지 로드 시 자동으로 새로운 모듈 활성화
// window.prayerPopupManager는 prayerPopup.js에서 이미 생성됨
document.addEventListener('DOMContentLoaded', () => {
    // window.prayerPopupManager가 이미 존재하는지 확인
    if (window.prayerPopupManager) {
        console.log('기도 팝업 모듈 v2.0이 정상적으로 로드되었습니다.');

        // 어댑터는 필요시에만 생성 (호환성 유지)
        if (!window.floatingPrayerManager) {
            floatingPrayerManager = new PrayerPopupAdapter();
            window.floatingPrayerManager = floatingPrayerManager;
            console.log('기도 팝업 어댑터 초기화 완료');
        }
    } else {
        console.warn('기도 팝업 모듈이 로드되지 않았습니다.');
    }
});

// 전역 함수들은 prayerPopup.js에서 정의됨 (중복 방지)

// 기존 createMinimalPrayerPopup 함수 대체
function createMinimalPrayerPopup({ flagUrl, name, country, missionary }) {
    if (!floatingPrayerManager) {
        floatingPrayerManager = new PrayerPopupAdapter();
    }

    if (floatingPrayerManager.prayerManager) {
        return floatingPrayerManager.prayerManager.createPrayerPopup({
            flagUrl,
            name,
            country,
            city: missionary?.city || '',
            missionary
        });
    }

    // 폴백: 기본 팝업 생성
    return createFallbackPrayerPopup({ flagUrl, name, country, missionary });
}

// 폴백 팝업 생성 (기존 스타일 유지)
function createFallbackPrayerPopup({ flagUrl, name, country, missionary }) {
    const wrapper = document.createElement('div');
    wrapper.className = 'minimal-prayer-popup';

    let prayer = getMissionaryPrayerTopic(name);

    wrapper.innerHTML = `
        <div class="close-button" title="기도 팝업 닫기">×</div>
        <div class="profile-section">
            <div class="profile-image-container">
                <img src="${flagUrl}" alt="국기" class="popup-flag">
            </div>
            <div class="name-info">
                <span class="popup-name">${name}</span>
                <span class="popup-country">${country}</span>
            </div>
        </div>
        <div class="prayer-content">
            <div class="prayer-title">기도 요청</div>
            <div class="popup-prayer">${prayer}</div>
            <div class="prayer-icon clickable-prayer-icon" title="기도에 동참하기">🙏</div>
        </div>
    `;

    // 이벤트 리스너 추가
    addFallbackEventListeners(wrapper, { name, country, missionary });

    return wrapper;
}

// 폴백 이벤트 리스너
function addFallbackEventListeners(wrapper, missionaryData) {
    // 마우스 오버/아웃 이벤트
    wrapper.addEventListener('mouseenter', () => {
        if (floatingPrayerManager) {
            floatingPrayerManager.pause();
        }
    });

    wrapper.addEventListener('mouseleave', () => {
        if (floatingPrayerManager) {
            floatingPrayerManager.resume();
        }
    });

    // 닫기 버튼 클릭
    const closeButton = wrapper.querySelector('.close-button');
    if (closeButton) {
        closeButton.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();

            wrapper.style.animation = 'minimal-fade-out 0.3s ease-out forwards';

            setTimeout(() => {
                if (floatingPrayerManager) {
                    floatingPrayerManager.closeCurrentPopup();

                    if (floatingPrayerManager.isActive()) {
                        floatingPrayerManager.resume();
                        floatingPrayerManager.showNextPrayerPopup();
                    }
                }
            }, 300);
        });
    }

    // 기도손 클릭
    const prayerIcon = wrapper.querySelector('.prayer-icon');
    if (prayerIcon) {
        prayerIcon.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();

            if (window.handlePrayerClick) {
                try {
                    const success = await window.handlePrayerClick(missionaryData);
                    if (success && window.showPrayerNotification) {
                        window.showPrayerNotification(missionaryData.name);
                    }
                } catch (error) {
                    console.error('기도 클릭 처리 오류:', error);
                }
            }
        });
    }
}

// 기존 함수들 유지 (호환성)
function getMissionaryPrayerTopic(missionaryName) {
    if (window.MissionaryMap?.state?.missionaries) {
        const missionary = window.MissionaryMap.state.missionaries.find(m =>
            m.name && m.name.trim() === missionaryName.trim()
        );

        if (missionary) {
            // 기도제목 우선순위: prayerTopic > prayer > summary
            if (missionary.prayerTopic && missionary.prayerTopic.trim() !== '') {
                return missionary.prayerTopic.length > 60 ?
                    missionary.prayerTopic.substring(0, 60) + '...' : missionary.prayerTopic;
            }
            if (missionary.prayer && missionary.prayer.trim() !== '') {
                return missionary.prayer.length > 60 ?
                    missionary.prayer.substring(0, 60) + '...' : missionary.prayer;
            }
            if (missionary.summary && missionary.summary.trim() !== '') {
                return missionary.summary.length > 60 ?
                    missionary.summary.substring(0, 60) + '...' : missionary.summary;
            }
            return missionary.prayer || '현지 사역과 복음 전파를 위해 기도해 주세요.';
        }
    }
    return '현지 사역과 복음 전파를 위해 기도해 주세요.';
}

// 모듈 내보내기
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PrayerPopupAdapter;
} 