/**
 * 기도 팝업 모듈 v2.0
 * 모던 글래스모피즘 디자인과 향상된 기능
 */

class PrayerPopupManager {
    constructor() {
        this.currentIndex = 0;
        this.interval = null;
        this.isRunning = false;
        this.isPaused = false;
        this.forcePaused = false; // 강제 일시정지 상태
        this.autoRestartTimer = null; // 자동 재시작 타이머
        this.missionaries = [];
        this.currentPopup = null;
        this.animationDuration = 4000; // 4초
        this.fadeDuration = 300; // 페이드 애니메이션 시간
        this.autoRestartDelay = 3000; // 자동 재시작 지연 시간 (3초)
        this.isVisible = true; // 비주얼/인비주얼 상태 (true: 비주얼, false: 인비주얼)
    }

    // 순회 시작
    startRotation() {
        if (this.isRunning) return;
        
        // 선교사 데이터 가져오기
        this.missionaries = window.MissionaryMap?.state?.missionaries || [];
        
        if (this.missionaries.length === 0) {
            console.warn('선교사 데이터가 없습니다.');
            return;
        }

        this.isRunning = true;
        this.isPaused = false;
        this.currentIndex = 0;
        
        // 첫 번째 팝업 즉시 표시
        this.showNextPrayerPopup();
        
        // 인터벌 설정
        this.interval = setInterval(() => {
            this.showNextPrayerPopup();
        }, this.animationDuration);
        
        console.log('기도 팝업 순회 시작:', this.missionaries.length + '명의 선교사');
    }

    // 순회 중지
    stopRotation() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
        if (this.autoRestartTimer) {
            clearTimeout(this.autoRestartTimer);
            this.autoRestartTimer = null;
        }
        this.isRunning = false;
        this.isPaused = false;
        this.forcePaused = false;
        this.closeCurrentPopup();
        console.log('기도 팝업 순회 중지');
    }

    // 일시정지
    pause() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
        this.isPaused = true;
        console.log('기도 팝업 일시정지');
        
        // 현재 표시 중인 팝업 닫기
        this.closeCurrentPopup();
    }

    // 재개
    resume() {
        if (this.isPaused && this.isRunning) {
            this.interval = setInterval(() => {
                this.showNextPrayerPopup();
            }, this.animationDuration);
            this.isPaused = false;
            console.log('기도 팝업 재개');
        }
    }

    // 강제 일시정지 (다른 UI 요소가 활성화될 때)
    forcePause() {
        this.pause();
        this.forcePaused = true;
        
        // 현재 표시 중인 팝업 즉시 닫기 (강력한 정리)
        this.closeCurrentPopup();
        
        // 추가로 DOM에서 모든 기도 팝업 관련 요소 정리
        setTimeout(() => {
            const allPrayerElements = document.querySelectorAll('.prayer-popup-v2, .prayer-popup, .floating-prayer-popup');
            allPrayerElements.forEach(element => {
                element.remove();
            });
        }, 50);
        
        // 자동 재시작 타이머 정리
        if (this.autoRestartTimer) {
            clearTimeout(this.autoRestartTimer);
            this.autoRestartTimer = null;
        }
        console.log('기도 팝업 강제 일시정지 및 팝업 완전 정리');
    }

    // 강제 일시정지 해제
    forceResume() {
        // 국가별/노회별 파송현황 모드가 아닐 때만 재개
        const isInDetailMode = window.missionaryMapInstance && 
                             (window.missionaryMapInstance.state.fixedCountry || 
                              window.missionaryMapInstance.state.fixedPresbytery || 
                              window.missionaryMapInstance.state.isPaused);
        
        if (isInDetailMode) {
            console.log('국가별/노회별 파송현황 모드: 기도 팝업 재개 건너뜀');
            // 현재 표시 중인 팝업도 닫기
            this.closeCurrentPopup();
            return;
        }
        
        if (this.forcePaused) {
            this.forcePaused = false;
            this.resume();
            // 즉시 다음 팝업 표시
            setTimeout(() => {
                this.showNextPrayerPopup();
            }, 100);
            console.log('기도 팝업 강제 일시정지 해제 및 즉시 표시');
        } else if (this.isPaused) {
            // 일반 일시정지 상태라면 재개
            this.resume();
            // 즉시 다음 팝업 표시
            setTimeout(() => {
                this.showNextPrayerPopup();
            }, 100);
            console.log('기도 팝업 일반 일시정지 해제 및 즉시 표시');
        } else if (!this.isRunning) {
            // 실행 중이지 않다면 시작
            this.startRotation();
            console.log('기도 팝업 새로 시작');
        }
    }

    // 수동으로 팝업 닫기 (3초 후 자동 재시작, 단 특정 모드에서는 재시작 안함)
    manualClose() {
        this.closeCurrentPopup();
        
        // 자동 재시작 타이머 설정
        if (this.autoRestartTimer) {
            clearTimeout(this.autoRestartTimer);
        }
        
        this.autoRestartTimer = setTimeout(() => {
            // 자동 재시작 조건 체크
            const isInDetailMode = window.missionaryMapInstance && 
                                 (window.missionaryMapInstance.state.fixedCountry || 
                                  window.missionaryMapInstance.state.fixedPresbytery || 
                                  window.missionaryMapInstance.state.isPaused);
            
            const isCountryListVisible = window.countryMissionaryList && 
                                       window.countryMissionaryList.isVisible;
            
            // 다음 조건에서만 자동 재시작:
            // 1. 기도 팝업이 실행 중이고
            // 2. 강제 일시정지 상태가 아니고
            // 3. 국가별/노회별 파송현황 모드가 아니고
            // 4. 국가별 선교사 리스트가 표시되지 않았을 때
            if (this.isRunning && !this.forcePaused && !isInDetailMode && !isCountryListVisible) {
                console.log('기도 팝업 자동 재시작');
                this.showNextPrayerPopup();
                
                // 인터벌 재설정
                if (this.interval) {
                    clearInterval(this.interval);
                }
                this.interval = setInterval(() => {
                    this.showNextPrayerPopup();
                }, this.animationDuration);
            } else {
                if (isInDetailMode) {
                    console.log('국가별/노회별 파송현황 모드: 기도 팝업 자동 재시작 건너뜀');
                } else if (isCountryListVisible) {
                    console.log('국가별 선교사 리스트 표시 중: 기도 팝업 자동 재시작 건너뜀');
                } else if (this.forcePaused) {
                    console.log('강제 일시정지 상태: 기도 팝업 자동 재시작 건너뜀');
                }
            }
            this.autoRestartTimer = null;
        }, this.autoRestartDelay);
    }

    // 비주얼 상태로 설정 (팝업 표시)
    setVisible() {
        this.isVisible = true;
        console.log('기도 팝업 비주얼 상태로 설정');
    }

    // 인비주얼 상태로 설정 (팝업 숨김)
    setInvisible() {
        this.isVisible = false;
        // 현재 표시 중인 팝업 즉시 닫기
        this.closeCurrentPopup();
        console.log('기도 팝업 인비주얼 상태로 설정');
    }

    // 현재 상태 확인
    getStatus() {
        const isInDetailMode = window.missionaryMapInstance && 
                             (window.missionaryMapInstance.state.fixedCountry || 
                              window.missionaryMapInstance.state.isPaused);
        
        const isCountryListVisible = window.countryMissionaryList && 
                                   window.countryMissionaryList.isVisible;
        
        return {
            isRunning: this.isRunning,
            isPaused: this.isPaused,
            forcePaused: this.forcePaused || false,
            currentIndex: this.currentIndex,
            totalMissionaries: this.missionaries.length,
            isInDetailMode: isInDetailMode,
            isCountryListVisible: isCountryListVisible,
            canAutoRestart: this.isRunning && !this.forcePaused && !isInDetailMode && !isCountryListVisible
        };
    }

    // 다음 기도 팝업 표시
    showNextPrayerPopup() {
        if (this.missionaries.length === 0) return;
        
        // 국가별/노회별 파송현황 모드에서는 팝업 표시하지 않음
        const isInDetailMode = window.missionaryMapInstance && 
                             (window.missionaryMapInstance.state.fixedCountry || 
                              window.missionaryMapInstance.state.fixedPresbytery);
        
        if (isInDetailMode) {
            console.log('국가별/노회별 파송현황 모드: 기도 팝업 표시 건너뜀');
            // 다음 인덱스로 이동만 수행
            this.currentIndex = (this.currentIndex + 1) % this.missionaries.length;
            return;
        }
        
        // 인비주얼 상태라면 팝업 표시하지 않음
        if (!this.isVisible) {
            console.log('기도 팝업 인비주얼 상태: 팝업 표시 건너뜀');
            // 다음 인덱스로 이동만 수행
            this.currentIndex = (this.currentIndex + 1) % this.missionaries.length;
            return;
        }
        
        // 현재 팝업 닫기
        this.closeCurrentPopup();
        
        // 다음 선교사 선택
        const missionary = this.missionaries[this.currentIndex];
        
        // 기도 팝업 생성 및 표시
        const popupElement = this.createPrayerPopup({
            flagUrl: this.getFlagUrl(missionary.country),
            name: missionary.name,
            country: missionary.country,
            city: missionary.city || '',
            missionary
        });
        
        // 팝업을 지도 컨테이너에 추가
        const mapContainer = document.getElementById('map');
        if (mapContainer) {
            mapContainer.appendChild(popupElement);
        } else {
            document.body.appendChild(popupElement);
        }
        
        // 마커 위치에 말풍선 표시
        this.setPopupPosition(popupElement, missionary);
        
        // 현재 팝업 참조 저장
        this.currentPopup = popupElement;
        
        // 다음 인덱스로 이동
        this.currentIndex = (this.currentIndex + 1) % this.missionaries.length;
    }

    // 현재 팝업 닫기
    closeCurrentPopup() {
        let hasRemoved = false;
        
        if (this.currentPopup) {
            this.currentPopup.remove();
            this.currentPopup = null;
            hasRemoved = true;
        }
        
        // 모든 기도 팝업 정리 (강력한 안전장치)
        const existingPopups = document.querySelectorAll('.prayer-popup-v2');
        if (existingPopups.length > 0) {
            existingPopups.forEach(popup => {
                popup.remove();
            });
            hasRemoved = true;
        }
        
        // 추가로 다른 기도 팝업 클래스들도 정리
        const otherPrayerPopups = document.querySelectorAll('.prayer-popup, .floating-prayer-popup');
        if (otherPrayerPopups.length > 0) {
            otherPrayerPopups.forEach(popup => {
                popup.remove();
            });
            hasRemoved = true;
        }
        
        // 실제로 팝업을 제거했을 때만 로그 출력
        if (hasRemoved) {
            console.log('기도 팝업 완전 정리 완료');
        }
    }

    // 국기 URL 생성
    getFlagUrl(country) {
        const flagCode = window.MissionaryMap?.constants?.COUNTRY_FLAGS?.[country];
        return flagCode ? `https://flagcdn.com/w40/${flagCode}.png` : '';
    }

    // 말풍선 위치 설정
    setPopupPosition(popupElement, missionary) {
        if (!window.MissionaryMap?.map) return;
        
        // 선교사의 지도 좌표 가져오기
        const latlng = window.MissionaryMap.getLatLng(missionary, missionary.country);
        if (!latlng) return;
        
        // 지도 좌표를 화면 픽셀 좌표로 변환
        const point = window.MissionaryMap.map.latLngToContainerPoint(latlng);
        
        // 팝업의 실제 크기 가져오기
        const popupRect = popupElement.getBoundingClientRect();
        const popupWidth = popupRect.width;
        const popupHeight = popupRect.height;
        const tailHeight = 12;
        
        // 팝업 위치 계산 (마커 위에 배치)
        const left = point.x - (popupWidth / 2);
        const top = point.y - popupHeight - tailHeight - 10;
        
        // 화면 경계 체크
        const mapRect = window.MissionaryMap.map.getContainer().getBoundingClientRect();
        const adjustedLeft = Math.max(10, Math.min(left, mapRect.width - popupWidth - 10));
        const adjustedTop = Math.max(10, Math.min(top, mapRect.height - popupHeight - 10));
        
        // 팝업 위치 설정
        popupElement.style.left = adjustedLeft + 'px';
        popupElement.style.top = adjustedTop + 'px';
    }

    // 기도 팝업 생성
    createPrayerPopup({ flagUrl, name, country, city, missionary }) {
        const wrapper = document.createElement('div');
        wrapper.className = 'prayer-popup-v2';
        
        // 기본 기도 내용
        let prayer = this.getMissionaryPrayerTopic(name);
        
        wrapper.innerHTML = `
            <div class="popup-close-btn" title="기도 팝업 닫기 (3초 후 자동 재시작)">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </div>
            
            <div class="popup-header">
                <div class="popup-avatar">
                    <img src="${flagUrl}" alt="${country} 국기" class="popup-flag">
                </div>
                <div class="popup-info">
                    <div class="popup-name">${name}</div>
                    <div class="popup-location">${country}${city ? ` · ${city}` : ''}</div>
                </div>
            </div>
            
            <div class="popup-content">
                <div class="popup-prayer-label">기도 요청</div>
                <div class="popup-prayer-text">${prayer}</div>
            </div>
            
            <div class="popup-action">
                <button class="prayer-action-btn" title="기도에 동참하기">
                    <span class="prayer-icon">🙏</span>
                    <span class="prayer-text">기도하기</span>
                </button>
            </div>
        `;

        // Firestore에서 최신 뉴스레터 요약 가져오기
        this.loadLatestNewsletterSummary(wrapper, name);
        
        // 이벤트 리스너 추가
        this.addEventListeners(wrapper, { name, country, city, missionary });
        
        return wrapper;
    }

    // Firestore에서 최신 뉴스레터 요약 로드
    async loadLatestNewsletterSummary(popupElement, missionaryName) {
        // Firebase 인덱스 오류 방지를 위해 기본 기도 제목 사용
        const prayerText = popupElement.querySelector('.popup-prayer-text');
        if (prayerText) {
            const defaultPrayer = this.getMissionaryPrayerTopic(missionaryName);
            prayerText.textContent = defaultPrayer;
        }
        
        // Firebase 쿼리는 나중에 인덱스가 설정된 후에 활성화
        /*
        if (!window.firebase?.firestore) {
            console.log('Firestore가 초기화되지 않았습니다.');
            return;
        }
        
        try {
            const firestore = window.firebase.firestore();
            
            // Firestore 연결 상태 확인
            if (!firestore) {
                console.log('Firestore 인스턴스를 가져올 수 없습니다.');
                return;
            }
            
            // 먼저 newsletterSummaries 컬렉션에서 시도 (누구나 읽기 가능)
            let summary = null;
            try {
                const summarySnapshot = await firestore
                    .collection('newsletterSummaries')
                    .where('missionaryName', '==', missionaryName)
                    .orderBy('date', 'desc')
                    .limit(1)
                    .get();
                
                if (!summarySnapshot.empty) {
                    const doc = summarySnapshot.docs[0];
                    const data = doc.data();
                    if (data.summary && data.summary.trim() !== '') {
                        summary = data.summary.length > 80 ? 
                            data.summary.substring(0, 80) + '...' : data.summary;
                    }
                }
            } catch (error) {
                console.log('Firebase 인덱스가 설정되지 않았습니다. 기본 기도 제목을 사용합니다.');
            }
            
            // 결과 표시
            const prayerText = popupElement.querySelector('.popup-prayer-text');
            if (prayerText) {
                if (summary) {
                    prayerText.textContent = summary;
                } else {
                    prayerText.textContent = '현지 사역과 복음 전파를 위해 기도해 주세요.';
                }
            }
            
        } catch (error) {
            console.log('뉴스레터 요약 로드 중 오류:', error.message);
            const prayerText = popupElement.querySelector('.popup-prayer-text');
            if (prayerText) {
                prayerText.textContent = '현지 사역과 복음 전파를 위해 기도해 주세요.';
            }
        }
        */
    }

    // 이벤트 리스너 추가
    addEventListeners(popupElement, missionaryData) {
        // 마우스 오버/아웃 이벤트
        popupElement.addEventListener('mouseenter', () => {
            this.pause();
        });
        
        popupElement.addEventListener('mouseleave', () => {
            this.resume();
        });
        
        // 닫기 버튼 클릭
        const closeBtn = popupElement.querySelector('.popup-close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.manualClose(); // 수동 닫기 (3초 후 자동 재시작)
            });
        }
        
        // 기도하기 버튼 클릭
        const prayerBtn = popupElement.querySelector('.prayer-action-btn');
        if (prayerBtn) {
            prayerBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                e.stopPropagation();
                await this.handlePrayerClick(prayerBtn, missionaryData);
            });
        }
    }

    // 애니메이션과 함께 팝업 닫기
    closePopupWithAnimation(popupElement) {
        popupElement.classList.add('popup-closing');
        
        setTimeout(() => {
            this.closeCurrentPopup();
            
            // 순환 재시작
            if (this.isRunning) {
                this.isPaused = false;
                this.showNextPrayerPopup();
                
                if (this.interval) {
                    clearInterval(this.interval);
                }
                this.interval = setInterval(() => {
                    this.showNextPrayerPopup();
                }, this.animationDuration);
            }
        }, this.fadeDuration);
    }

    // 기도 클릭 처리
    async handlePrayerClick(buttonElement, missionaryData) {
        // 클릭 피드백
        buttonElement.classList.add('prayer-clicked');
        
        try {
            // 로딩 상태
            buttonElement.disabled = true;
            buttonElement.classList.add('prayer-loading');
            
            // 기도 처리
            if (window.handlePrayerClick) {
                const success = await window.handlePrayerClick(missionaryData);
                
                if (success) {
                    // 성공 피드백
                    buttonElement.classList.add('prayer-success');
                    this.showPrayerNotification(missionaryData.name);
                } else {
                    // 실패 피드백
                    buttonElement.classList.add('prayer-error');
                }
            } else {
                buttonElement.classList.add('prayer-error');
            }
        } catch (error) {
            console.error('기도 처리 오류:', error);
            buttonElement.classList.add('prayer-error');
        } finally {
            // 상태 복원
            setTimeout(() => {
                buttonElement.disabled = false;
                buttonElement.classList.remove('prayer-clicked', 'prayer-loading', 'prayer-success', 'prayer-error');
            }, 1500);
        }
    }

    // 기도 알림 표시
    showPrayerNotification(missionaryName) {
        // 기존 알림 시스템 활용
        if (window.showPrayerNotification) {
            window.showPrayerNotification(missionaryName);
        }
    }

    // 선교사 기도 제목 가져오기
    getMissionaryPrayerTopic(missionaryName) {
        if (window.MissionaryMap?.state?.missionaries) {
            const missionary = window.MissionaryMap.state.missionaries.find(m => 
                m.name && m.name.trim() === missionaryName.trim()
            );
            
            if (missionary) {
                if (missionary.summary && missionary.summary.trim() !== '') {
                    return missionary.summary.length > 80 ? 
                        missionary.summary.substring(0, 80) + '...' : missionary.summary;
                }
                return missionary.prayer || '현지 사역과 복음 전파를 위해 기도해 주세요.';
            }
        }
        return '현지 사역과 복음 전파를 위해 기도해 주세요.';
    }

    // 상태 확인
    isActive() {
        return this.isRunning;
    }

    // 설정 업데이트
    updateSettings(settings) {
        if (settings.animationDuration) {
            this.animationDuration = settings.animationDuration;
        }
        if (settings.fadeDuration) {
            this.fadeDuration = settings.fadeDuration;
        }
    }
}

// 전역 인스턴스 생성
if (!window.prayerPopupManager) {
    window.prayerPopupManager = new PrayerPopupManager();
}

// 전역 함수들 (기존 호환성 유지)
function startPrayerRotation() {
    if (window.prayerPopupManager) {
        window.prayerPopupManager.startRotation();
    }
}

function stopPrayerRotation() {
    if (window.prayerPopupManager) {
        window.prayerPopupManager.stopRotation();
    }
}

function isPrayerRotationActive() {
    return window.prayerPopupManager ? window.prayerPopupManager.isActive() : false;
}

// 편의 함수들
window.pausePrayerRotation = () => {
    if (window.prayerPopupManager) {
        window.prayerPopupManager.forcePause();
    }
};

window.resumePrayerRotation = () => {
    if (window.prayerPopupManager) {
        window.prayerPopupManager.forceResume();
    }
};

window.getPrayerRotationStatus = () => {
    return window.prayerPopupManager ? window.prayerPopupManager.getStatus() : null;
};

// 기도 팝업 수동 닫기 (3초 후 자동 재시작)
window.manualClosePrayerPopup = () => {
    if (window.prayerPopupManager) {
        window.prayerPopupManager.manualClose();
    }
};

// 기도 팝업 설정 업데이트
window.updatePrayerPopupSettings = (settings) => {
    if (window.prayerPopupManager) {
        window.prayerPopupManager.updateSettings(settings);
    }
};

// 모듈 내보내기
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PrayerPopupManager;
} 