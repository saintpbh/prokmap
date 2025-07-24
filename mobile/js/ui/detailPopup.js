// 기도 애니메이션 설정 - 쉽게 변경 가능하도록 분리
const PRAYER_CONFIG = {
    // 펄스 링 설정
    pulseRing: {
        enabled: true,
        color: 'rgba(76, 175, 80, 0.4)', // 그린 계열
        maxScale: 2.5,
        duration: 800
    },

    // 대안 애니메이션 (나중에 쉽게 변경)
    alternatives: {
        morphButton: false, // 🙏 → ✓ 변형
        glitchEffect: false // 글리치 효과
    }
};

// 펄스 링 애니메이션
function createPulseRing(button) {
    const ring = document.createElement('div');
    ring.className = 'pulse-ring';
    button.appendChild(ring);

    // 애니메이션 실행
    requestAnimationFrame(() => {
        ring.style.transform = `scale(${PRAYER_CONFIG.pulseRing.maxScale})`;
        ring.style.opacity = '0';
    });

    // 링 제거
    setTimeout(() => {
        ring.remove();
    }, PRAYER_CONFIG.pulseRing.duration);
}

// 기도 버튼 클릭 핸들러
function handlePrayerClick(button, name, location) {
    // 펄스 링 애니메이션
    if (PRAYER_CONFIG.pulseRing.enabled) {
        createPulseRing(button);
    }

    // 토스트 메시지 표시
    if (PRAYER_CONFIG.toast.enabled) {
        showPrayerToast(name, location);
    }

    // 버튼 상태 변경 (짧은 피드백)
    button.classList.add('prayed');
    setTimeout(() => {
        button.classList.remove('prayed');
    }, 1000);
}

// 메인 상세보기 팝업 함수
window.showDetailPopup = function(name, latlng, missionaryInfo, elements) {
    const info = missionaryInfo[name] || {};
    const sentDate = info.sent_date ? new Date(info.sent_date) : null;
    const sentYear = sentDate ? sentDate.getFullYear() : '정보 없음';
    const imgSrc = info.image && info.image.trim() ? info.image.trim() : "https://via.placeholder.com/320x180.png?text=No+Photo";
    const newsUrl = info.NewsLetter ? info.NewsLetter.trim() : '';
    const location = `${info.country || '정보없음'}, ${info.city || ''}`.replace(/, $/, '');
    
    let prayerHtml = info.prayer || '현지 정착과 건강을 위해';
    if (newsUrl) {
        prayerHtml = `<span class="prayer-link" data-newsletter="${encodeURIComponent(newsUrl)}">${prayerHtml}</span>`;
    }

    // 새로운 모던 디자인으로 팝업 구성
    elements.detailPopup.innerHTML = `
        <div class="detail-popup-modern">
            <button class="close-btn-modern" aria-label="닫기">✕</button>
            
            <!-- 헤더 섹션 -->
            <div class="popup-header">
                <div class="missionary-avatar">
                    <img src="${imgSrc}" alt="${name}" loading="lazy" 
                         onerror="this.src='https://via.placeholder.com/80x80/e8f5e8/4a90e2?text=👤';">
                </div>
                <div class="missionary-info">
                    <h2 class="missionary-name">${name}</h2>
                    <p class="missionary-location">📍 ${location}</p>
                </div>
                <button class="prayer-btn" data-name="${name}" data-location="${location}">
                    <span class="prayer-emoji">🙏</span>
                </button>
            </div>

            <!-- 정보 섹션 -->
            <div class="popup-body">
                <div class="info-grid">
                    <div class="info-item">
                        <span class="info-icon">📅</span>
                        <div class="info-content">
                            <div class="info-label">파송년도</div>
                            <div class="info-value">${sentYear}년</div>
                        </div>
                    </div>
                    
                    <div class="info-item">
                        <span class="info-icon">🏢</span>
                        <div class="info-content">
                            <div class="info-label">소속기관</div>
                            <div class="info-value">${info.organization || '정보 없음'}</div>
                        </div>
                    </div>
                    
                    <div class="info-item">
                        <span class="info-icon">⛪</span>
                        <div class="info-content">
                            <div class="info-label">노회</div>
                            <div class="info-value">${info.presbytery || '정보 없음'}</div>
                        </div>
                    </div>
                </div>

                <!-- 기도제목 섹션 -->
                <div class="prayer-section">
                    <h3 class="section-title">🙏 기도제목</h3>
                    <p class="prayer-content">${prayerHtml}</p>
                </div>
            </div>
        </div>
    `;

    // 이벤트 리스너 설정
    setupPopupEventListeners(elements, name, location, newsUrl);

    // 팝업 표시 및 위치 설정
    showPopup(elements);
}

// 이벤트 리스너 설정 함수
function setupPopupEventListeners(elements, name, location, newsUrl) {
    const popup = elements.detailPopup;

    // 닫기 버튼
    const closeBtn = popup.querySelector('.close-btn-modern');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => closeDetailPopup(elements));
    }

    // 기도 버튼
    const prayerBtn = popup.querySelector('.prayer-btn');
    if (prayerBtn) {
        prayerBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            handlePrayerClick(prayerBtn, name, location);
        });
    }

    // 뉴스레터 링크
    const prayerLink = popup.querySelector('.prayer-link');
    if (prayerLink && newsUrl) {
        prayerLink.addEventListener('click', (e) => {
            e.stopPropagation();
            const newsletterUrl = decodeURIComponent(prayerLink.dataset.newsletter);
            if (window.MissionaryMap && window.MissionaryMap.showNewsletter) {
                window.MissionaryMap.showNewsletter(newsletterUrl);
            }
        });
    }

    // ESC 키로 닫기
    const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
            closeDetailPopup(elements);
            document.removeEventListener('keydown', handleKeyDown);
        }
    };
    document.addEventListener('keydown', handleKeyDown);
}

// 팝업 표시 함수
function showPopup(elements) {
    const popup = elements.detailPopup;
    popup.style.display = "block";
    popup.classList.add('visible');
    
    // 부드러운 애니메이션을 위한 지연
    requestAnimationFrame(() => {
        popup.classList.add('animate-in');
    });

    // 위치 조정
    setTimeout(() => {
        positionPopup(elements);
    }, 16);
}

// 팝업 위치 조정 함수
function positionPopup(elements) {
    const popup = elements.detailPopup;
    const mapRect = elements.mapContainer.getBoundingClientRect();
    const popupRect = popup.getBoundingClientRect();
    
    let x = mapRect.left + (mapRect.width - popupRect.width) / 2;
    let y = mapRect.top + (mapRect.height - popupRect.height) / 2;
    
    // 모바일 최적화
    if (window.innerWidth < 700) {
        x = (window.innerWidth - popupRect.width) / 2;
        y = (window.innerHeight - popupRect.height) / 2;
    }
    
    // 화면 경계 체크
    x = Math.max(20, Math.min(x, window.innerWidth - popupRect.width - 20));
    y = Math.max(20, Math.min(y, window.innerHeight - popupRect.height - 20));
    
    popup.style.left = `${x}px`;
    popup.style.top = `${y}px`;
}

// 팝업 닫기 함수
window.closeDetailPopup = function(elements) {
    const popup = elements.detailPopup;
    popup.classList.remove('animate-in');
    popup.classList.add('animate-out');
    
    setTimeout(() => {
        popup.classList.remove('visible', 'animate-out');
        popup.style.display = "none";
    }, 300);
}

// 설정 변경 함수 (외부에서 호출 가능)
window.updatePrayerConfig = function(newConfig) {
    Object.assign(PRAYER_CONFIG, newConfig);
}

// 현재 설정 반환 함수
window.getPrayerConfig = function() {
    return { ...PRAYER_CONFIG };
} 