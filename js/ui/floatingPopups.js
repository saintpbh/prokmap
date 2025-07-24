// 플로팅 팝업 시스템 (기도팝업 제외)
// 기도팝업은 새로운 PrayerPopupManager로 대체됨

// 플로팅 리스트 팝업 생성 (국가별 선교사 목록)
function createFloatingListPopup({ flagUrl, country, missionaryList }) {
    const wrapper = document.createElement('div');
    wrapper.className = 'floating-list-popup';
    
    const missionaryItems = missionaryList.map(missionary => `
        <div class="missionary-item" onclick="showMissionaryDetail('${missionary.name}')">
            <span class="missionary-name">${missionary.name}</span>
            <span class="missionary-city">${missionary.city || ''}</span>
        </div>
    `).join('');
    
    wrapper.innerHTML = `
        <div class="popup-header">
            <img src="${flagUrl}" alt="${country} 국기" class="country-flag">
            <span class="country-name">${country}</span>
            <button class="close-btn" onclick="closeFloatingPopup()">×</button>
        </div>
        <div class="missionary-list">
            ${missionaryItems}
        </div>
    `;
    
    return wrapper;
}

// 플로팅 이름 팝업 생성 (간단한 정보)
function createFloatingNamePopup({ name, city, ministry }) {
    const wrapper = document.createElement('div');
    wrapper.className = 'floating-name-popup';
    
    wrapper.innerHTML = `
        <div class="popup-content">
            <h3>${name}</h3>
            <p>${city || ''}</p>
            <p>${ministry || ''}</p>
            <button class="close-btn" onclick="closeFloatingPopup()">×</button>
        </div>
    `;
    
    return wrapper;
}

// 플로팅 팝업 닫기
function closeFloatingPopup() {
    const popups = document.querySelectorAll('.floating-list-popup, .floating-name-popup');
    popups.forEach(popup => popup.remove());
}

// 선교사 상세 정보 표시
function showMissionaryDetail(missionaryName) {
    // 상세 팝업 표시 로직
    if (window.showDetailPopup) {
        // elements 객체 생성 또는 가져오기
        const elements = {
            detailPopup: document.getElementById('detail-popup') || 
                        document.querySelector('.detail-popup') ||
                        document.createElement('div'),
            mapContainer: document.getElementById('map') || 
                         document.querySelector('.map-container') ||
                         document.body
        };
        
        // detailPopup이 새로 생성된 경우 스타일 설정
        if (!elements.detailPopup.id && !elements.detailPopup.className) {
            elements.detailPopup.id = 'detail-popup';
            elements.detailPopup.className = 'detail-popup';
            elements.detailPopup.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.5);
                display: none;
                z-index: 1000;
            `;
            document.body.appendChild(elements.detailPopup);
        }
        
        // MissionaryMap에서 선교사 정보 가져오기
        const missionaryInfo = {};
        if (window.MissionaryMap && window.MissionaryMap.state && window.MissionaryMap.state.missionaries) {
            // missionaryName이 문자열인지 확인
            const searchName = typeof missionaryName === 'string' ? missionaryName.trim() : String(missionaryName || '').trim();
            
            const missionary = window.MissionaryMap.state.missionaries.find(m => 
                m.name && typeof m.name === 'string' && m.name.trim() === searchName
            );
            if (missionary) {
                missionaryInfo[missionaryName] = missionary;
            }
        }
        
        // showDetailPopup 호출
        window.showDetailPopup(missionaryName, null, missionaryInfo, elements);
    } else {
        console.error('showDetailPopup 함수를 찾을 수 없습니다.');
    }
}

// 선교사 기도 제목 가져오기
function getMissionaryPrayerTopic(missionaryName) {
    if (window.MissionaryMap?.state?.missionaries) {
        // missionaryName이 문자열인지 확인
        const searchName = typeof missionaryName === 'string' ? missionaryName.trim() : String(missionaryName || '').trim();
        
        const missionary = window.MissionaryMap.state.missionaries.find(m => 
            m.name && typeof m.name === 'string' && m.name.trim() === searchName
        );
        
        if (missionary) {
            if (missionary.summary && missionary.summary.trim() !== '') {
                return missionary.summary.length > 60 ? 
                    missionary.summary.substring(0, 60) + '...' : missionary.summary;
            }
            return missionary.prayer || '현지 사역과 복음 전파를 위해 기도해 주세요.';
        }
    }
    return '현지 사역과 복음 전파를 위해 기도해 주세요.';
}

// 기도 안내 팝업 큐 관리
let prayerNotificationQueue = [];
let isProcessingQueue = false;

// 기도 안내 팝업 표시 함수 (큐 시스템 적용)
function showPrayerNotification(missionaryName) {
    // 큐에 추가
    prayerNotificationQueue.push(missionaryName);
    
    // 큐 처리 시작
    if (!isProcessingQueue) {
        processNotificationQueue();
    }
}

// 기도 안내 팝업 큐 처리
function processNotificationQueue() {
    if (prayerNotificationQueue.length === 0) {
        isProcessingQueue = false;
        return;
    }
    
    isProcessingQueue = true;
    const missionaryName = prayerNotificationQueue.shift();
    
    const notification = document.getElementById('prayer-notification');
    const messageElement = notification?.querySelector('.prayer-message');
    
    if (!notification || !messageElement) {
        console.warn('기도 안내 팝업 요소를 찾을 수 없습니다.');
        // 다음 큐 처리
        setTimeout(() => processNotificationQueue(), 100);
        return;
    }
    
    // 메시지 설정
    messageElement.textContent = `${missionaryName} 선교사님을 위해 기도합니다!`;
    
    // 기존 타이머가 있으면 제거
    if (notification.hideTimer) {
        clearTimeout(notification.hideTimer);
    }
    
    // 팝업 표시
    notification.classList.remove('hidden');
    notification.classList.add('show');
    
    // 1.5초 후 자동 숨김 (빠른 순환을 위해 시간 단축)
    notification.hideTimer = setTimeout(() => {
        hidePrayerNotification();
        // 0.3초 후 다음 큐 처리
        setTimeout(() => processNotificationQueue(), 300);
    }, 1500);
}

// 기도 안내 팝업 숨김 함수
function hidePrayerNotification() {
    const notification = document.getElementById('prayer-notification');
    if (notification) {
        notification.classList.remove('show');
        notification.classList.add('hidden');
        
        // 타이머 정리
        if (notification.hideTimer) {
            clearTimeout(notification.hideTimer);
            notification.hideTimer = null;
        }
    }
}

// 기도 안내 팝업 큐 상태 확인
function getPrayerNotificationQueueStatus() {
    return {
        queueLength: prayerNotificationQueue.length,
        isProcessing: isProcessingQueue
    };
}

// 기도 안내 팝업 큐 초기화
function clearPrayerNotificationQueue() {
    prayerNotificationQueue = [];
    isProcessingQueue = false;
    hidePrayerNotification();
}

// 전역 함수로 등록
window.createFloatingListPopup = createFloatingListPopup;
window.createFloatingNamePopup = createFloatingNamePopup;
window.closeFloatingPopup = closeFloatingPopup;
window.showMissionaryDetail = showMissionaryDetail;
window.getMissionaryPrayerTopic = getMissionaryPrayerTopic;
window.showPrayerNotification = showPrayerNotification;
window.hidePrayerNotification = hidePrayerNotification;
window.getPrayerNotificationQueueStatus = getPrayerNotificationQueueStatus;
window.clearPrayerNotificationQueue = clearPrayerNotificationQueue;

// 기도 팝업 순회 관련 전역 함수들 (새로운 어댑터가 자동으로 대체)
window.startPrayerRotation = () => {
    if (window.floatingPrayerManager) {
        window.floatingPrayerManager.startRotation();
    }
};
window.stopPrayerRotation = () => {
    if (window.floatingPrayerManager) {
        window.floatingPrayerManager.stopRotation();
    }
};
window.isPrayerRotationActive = () => {
    return window.floatingPrayerManager ? window.floatingPrayerManager.isActive() : false;
};

console.log('플로팅 팝업 시스템 로드됨 - 기도팝업은 새로운 모듈로 대체됨'); 