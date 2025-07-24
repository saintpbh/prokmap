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

// 팝업 위치 저장/복원을 위한 유틸리티 함수들
const POPUP_POSITION_KEY = 'missionaryDetailPopupPosition';

// 저장된 팝업 위치 가져오기
function getSavedPopupPosition() {
    try {
        const saved = localStorage.getItem(POPUP_POSITION_KEY);
        if (saved) {
            const position = JSON.parse(saved);
            // 유효한 위치인지 확인 (화면 크기 내에 있는지)
            if (position && typeof position.x === 'number' && typeof position.y === 'number') {
                return position;
            }
        }
    } catch (error) {
        console.warn('저장된 팝업 위치를 불러오는데 실패했습니다:', error);
    }
    return null;
}

// 팝업 위치 저장하기
function savePopupPosition(x, y) {
    try {
        const position = { x, y, timestamp: Date.now() };
        localStorage.setItem(POPUP_POSITION_KEY, JSON.stringify(position));
    } catch (error) {
        console.warn('팝업 위치를 저장하는데 실패했습니다:', error);
    }
}

// 저장된 위치가 유효한지 확인 (화면 크기 변경 시 대응)
function isValidSavedPosition(position) {
    if (!position) return false;
    
    const popup = document.querySelector('.detail-popup-modern');
    if (!popup) return true; // 팝업이 없으면 일단 유효하다고 가정
    
    const popupRect = popup.getBoundingClientRect();
    const maxX = window.innerWidth - popupRect.width;
    const maxY = window.innerHeight - popupRect.height;
    
    return position.x >= 0 && position.x <= maxX && 
           position.y >= 0 && position.y <= maxY;
}

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

// 기도 버튼 클릭 핸들러 (이름 충돌 방지를 위해 함수명 변경)
async function handleDetailPopupPrayerClick(button, name, location) {
    
    // 펄스 링 애니메이션
    if (PRAYER_CONFIG.pulseRing.enabled) {
        createPulseRing(button);
    }

    // 버튼 상태 변경 (짧은 피드백)
    button.classList.add('prayed');
    setTimeout(() => {
        button.classList.remove('prayed');
    }, 1000);

    // PrayerClick 모듈과 연동하여 Firebase에 기도 기록 및 지도에 기도손 표시
    if (window.handlePrayerClick) {
        try {
            // 선교사 데이터 생성 (PrayerClick 모듈에서 요구하는 형식)
            // location이 undefined이거나 빈 문자열인 경우 처리
            const safeLocation = location || '';
            const locationParts = safeLocation.split(',');
            
            // 실제 전달받은 매개변수 사용 (기본값 대신)
            const missionaryData = {
                name: name, // 매개변수 그대로 사용
                country: locationParts[0]?.trim() || '', // 위치에서 국가 추출
                city: locationParts[1]?.trim() || '', // 위치에서 도시 추출
                flagUrl: '' // 국기 URL은 handlePrayerClick에서 생성
            };
            

            
            // 데이터 유효성 사전 검증
            if (!missionaryData.name || !missionaryData.country) {
                console.error('상세 팝업에서 필수 데이터 누락:', {
                    name: missionaryData.name,
                    country: missionaryData.country,
                    originalLocation: location
                });
                return;
            }
            
            // 로딩 상태 표시
            const originalText = button.innerHTML;
            button.style.opacity = '0.7';
            button.style.pointerEvents = 'none';
            
            const success = await window.handlePrayerClick(missionaryData);
            
            if (success) {
                // 기도 안내 팝업 표시
                if (window.showPrayerNotification) {
                    window.showPrayerNotification(name);
                } else {
                    console.warn('showPrayerNotification 함수를 찾을 수 없습니다.');
                    // 직접 팝업 표시 시도
                    const notification = document.getElementById('prayer-notification');
                    const messageElement = notification?.querySelector('.prayer-message');
                    if (notification && messageElement) {
                        messageElement.textContent = `${name} 선교사님을 위해 기도합니다!`;
                        notification.classList.remove('hidden');
                        notification.classList.add('show');
                        
                        setTimeout(() => {
                            notification.classList.remove('show');
                            notification.classList.add('hidden');
                        }, 2000);
                    } else {
                        console.error('기도 안내 팝업 요소를 찾을 수 없습니다.');
                    }
                }
                
                // 성공 피드백 - 버튼 색상 변경
                button.style.background = 'rgba(34, 197, 94, 0.2)';
                button.style.borderColor = 'rgba(34, 197, 94, 0.4)';
                button.style.color = 'rgba(34, 197, 94, 1)';
                
                setTimeout(() => {
                    button.style.background = '';
                    button.style.borderColor = '';
                    button.style.color = '';
                }, 2000);
            } else {
                // 실패 피드백
                button.style.background = 'rgba(239, 68, 68, 0.2)';
                button.style.borderColor = 'rgba(239, 68, 68, 0.4)';
                
                setTimeout(() => {
                    button.style.background = '';
                    button.style.borderColor = '';
                }, 2000);
            }
            
            // 로딩 상태 해제
            button.style.opacity = '1';
            button.style.pointerEvents = 'auto';
            
        } catch (error) {
            console.error('기도 클릭 처리 중 오류:', error);
            
            // 오류 피드백
            button.style.background = 'rgba(239, 68, 68, 0.2)';
            button.style.borderColor = 'rgba(239, 68, 68, 0.4)';
            
            setTimeout(() => {
                button.style.background = '';
                button.style.borderColor = '';
            }, 2000);
            
            // 로딩 상태 해제
            button.style.opacity = '1';
            button.style.pointerEvents = 'auto';
        }
    } else {
        console.warn('PrayerClick 모듈이 로드되지 않았습니다.');
    }
}

// CommonUtils 사용으로 중복 함수 제거

// CommonUtils가 없을 때를 대비한 안전한 아바타 생성 함수
function createSafeAvatarSVG(name, size = 80) {
    if (window.CommonUtils && window.CommonUtils.createAvatarSVG) {
        return window.CommonUtils.createAvatarSVG(name, size);
    }
    
    // 대체 아바타 생성
    const firstChar = name ? name.charAt(0) : '?';
    const color = '#FF6B6B';
    return `data:image/svg+xml;base64,${btoa(`
        <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
            <circle cx="${size/2}" cy="${size/2}" r="${size/2}" fill="${color}"/>
            <text x="${size/2}" y="${size/2 + size/6}" font-family="Arial, sans-serif" font-size="${size/3}" 
                  fill="white" text-anchor="middle" dominant-baseline="middle" font-weight="bold">
                ${firstChar}
            </text>
        </svg>
    `)}`;
}

// 선교사 상세 정보 가져오기 (Firestore + 로컬 데이터)
async function fetchMissionaryDetails(name) {
    try {
        // Firestore에서 선교사 정보 가져오기
        if (firebase && firebase.firestore) {
            const db = firebase.firestore();
            
            // 선교사 기본 정보 (이제 누구나 읽기 가능)
            let missionary = null;
            try {
                // 먼저 missionaryProfiles 컬렉션에서 시도 (누구나 읽기 가능)
                const profileDoc = await db.collection('missionaryProfiles')
                    .where('name', '==', name)
                    .limit(1)
                    .get();
                
                if (!profileDoc.empty) {
                    missionary = profileDoc.docs[0].data();
                    console.log('missionaryProfiles에서 선교사 정보 찾음:', name);
                } else {
                    // missionaries 컬렉션에서 기본 정보만 가져오기 시도
                    const missionaryDoc = await db.collection('missionaries')
                        .where('name', '==', name)
                        .limit(1)
                        .get();
                    
                    if (!missionaryDoc.empty) {
                        const fullData = missionaryDoc.docs[0].data();
                        // 기본 정보만 추출 (보안 규칙에 따라 허용된 필드만)
                        missionary = {
                            name: fullData.name,
                            country: fullData.country,
                            city: fullData.city,
                            sent_date: fullData.sent_date,
                            organization: fullData.organization,
                            presbytery: fullData.presbytery,
                            prayer: fullData.prayer,
                            summary: fullData.summary,
                            image: fullData.image // 이미지도 기본 정보에 포함
                        };
                        console.log('missionaries에서 선교사 기본 정보 찾음:', name);
                    }
                }
            } catch (error) {
                // 권한 오류는 정상적인 상황이므로 로그만 출력
                if (error.code === 'permission-denied') {
                    console.log('Firestore 선교사 데이터 읽기 권한이 없습니다. (일반적인 상황)');
                } else {
                    console.warn('선교사 데이터 가져오기 실패:', error.message);
                }
            }
            
            // 뉴스레터 요약 정보 (Firebase 인덱스 오류 방지)
            let latestNewsletter = null;
            // Firebase 쿼리는 나중에 인덱스가 설정된 후에 활성화
            /*
            try {
                // 먼저 newsletterSummaries 컬렉션에서 시도
                const summaryDoc = await db.collection('newsletterSummaries')
                    .where('missionaryName', '==', name)
                    .orderBy('date', 'desc')
                    .limit(1)
                    .get();
                
                if (!summaryDoc.empty) {
                    latestNewsletter = summaryDoc.docs[0].data();
                    console.log('newsletterSummaries에서 뉴스레터 요약 찾음:', name);
                } else {
                    // newsletters 컬렉션에서 요약 정보만 가져오기 시도
                    const newsletterDoc = await db.collection('newsletters')
                        .where('missionaryName', '==', name)
                        .orderBy('date', 'desc')
                        .limit(1)
                        .get();
                    
                    if (!newsletterDoc.empty) {
                        const newsletterData = newsletterDoc.docs[0].data();
                        // 요약 정보만 추출
                        latestNewsletter = {
                            summary: newsletterData.summary || newsletterData.content?.substring(0, 200) + '...',
                            title: newsletterData.title,
                            date: newsletterData.date,
                            missionaryName: newsletterData.missionaryName
                        };
                        console.log('newsletters에서 뉴스레터 요약 찾음:', name);
                    }
                }
            } catch (error) {
                console.log('Firebase 인덱스가 설정되지 않았습니다. 기본 정보를 사용합니다.');
            }
            */
            
            // 기도 요청 정보 (Firebase 인덱스 오류 방지)
            let prayerRequests = [];
            // Firebase 쿼리는 나중에 인덱스가 설정된 후에 활성화
            /*
            try {
                const prayerDoc = await db.collection('prayerRequests')
                    .where('missionaryName', '==', name)
                    .orderBy('date', 'desc')
                    .limit(3) // 최근 3개만
                    .get();
                
                if (!prayerDoc.empty) {
                    prayerRequests = prayerDoc.docs.map(doc => doc.data());
                    console.log('prayerRequests에서 기도 요청 찾음:', name, prayerRequests.length);
                }
            } catch (error) {
                console.log('Firebase 인덱스가 설정되지 않았습니다. 기본 정보를 사용합니다.');
            }
            */
            
            return {
                ...missionary,
                id: missionary?.id || name,
                latestNewsletter,
                prayerRequests
            };
        }
    } catch (error) {
        console.error('선교사 상세 정보 가져오기 실패:', error);
    }
    
    return null;
}

// 메인 상세보기 팝업 함수
window.showDetailPopup = async function(name, latlng, missionaryInfo, elements) {
    // elements 객체 안전성 체크
    if (!elements || !elements.detailPopup) {
        console.error('detailPopup 요소를 찾을 수 없습니다. elements:', elements);
        
        // 기본 elements 객체 생성 시도
        const defaultElements = {
            detailPopup: document.getElementById('detail-popup') || 
                        document.querySelector('.detail-popup') ||
                        document.createElement('div')
        };
        
        if (!defaultElements.detailPopup.id && !defaultElements.detailPopup.className) {
            // 완전히 새로운 팝업 요소 생성
            const newPopup = document.createElement('div');
            newPopup.id = 'detail-popup';
            newPopup.className = 'detail-popup';
            newPopup.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.5);
                display: none;
                z-index: 1000;
            `;
            document.body.appendChild(newPopup);
            defaultElements.detailPopup = newPopup;
        }
        
        elements = defaultElements;
    }
    
    // Firestore에서 최신 데이터 가져오기
    const freshData = await fetchMissionaryDetails(name);
    const info = freshData || missionaryInfo[name] || {};
    
    const sentDate = info.sent_date ? new Date(info.sent_date) : null;
    const sentYear = sentDate ? sentDate.getFullYear() : '정보 없음';
    const imgSrc = info.image && info.image.trim() ? info.image.trim() : createSafeAvatarSVG(name, 320);
    const newsUrl = info.NewsLetter ? info.NewsLetter.trim() : '';
    const location = `${info.country || '정보없음'}, ${info.city || ''}`.replace(/, $/, '');
    
    // 기도제목: 최신 뉴스레터 요약 우선, 없으면 기존 기도제목 사용
    let prayerHtml = '현지 정착과 건강을 위해';
    if (info.latestNewsletter && info.latestNewsletter.summary && info.latestNewsletter.summary.trim()) {
        prayerHtml = info.latestNewsletter.summary.trim();
    } else if (info.prayer && info.prayer.trim()) {
        prayerHtml = info.prayer.trim();
    } else if (info.latestNewsletterSummary && info.latestNewsletterSummary.trim()) {
        prayerHtml = info.latestNewsletterSummary.trim();
    }
    
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
                         onerror="this.src='${createSafeAvatarSVG(name, 80)}';">
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

                <!-- 기도 요청 섹션 -->
                ${info.prayerRequests && info.prayerRequests.length > 0 ? `
                <div class="prayer-requests-section">
                    <h3 class="section-title">📝 기도 요청</h3>
                    <div class="prayer-requests-list">
                        ${info.prayerRequests.map(request => `
                        <div class="prayer-request-item">
                            <div class="request-date">
                                <span class="info-icon">📅</span>
                                ${request.date ? new Date(request.date).toLocaleDateString('ko-KR') : '날짜 정보 없음'}
                            </div>
                            <div class="request-content">
                                <span class="info-icon">💬</span>
                                <div class="content-text">${request.content || request.request || '내용 없음'}</div>
                            </div>
                        </div>
                        `).join('')}
                    </div>
                </div>
                ` : ''}

                <!-- 최신 뉴스레터 섹션 -->
                ${info.latestNewsletter ? `
                <div class="newsletter-section">
                    <h3 class="section-title">📰 최신 뉴스레터</h3>
                    <div class="newsletter-info">
                        <div class="newsletter-date">
                            <span class="info-icon">📅</span>
                            ${info.latestNewsletter.date ? new Date(info.latestNewsletter.date).toLocaleDateString('ko-KR') : '날짜 정보 없음'}
                        </div>
                        ${info.latestNewsletter.title ? `
                        <div class="newsletter-title">
                            <span class="info-icon">📋</span>
                            ${info.latestNewsletter.title}
                        </div>
                        ` : ''}
                        ${info.latestNewsletter.content ? `
                        <div class="newsletter-content">
                            <span class="info-icon">📝</span>
                            <div class="content-preview">${info.latestNewsletter.content.substring(0, 100)}${info.latestNewsletter.content.length > 100 ? '...' : ''}</div>
                        </div>
                        ` : ''}
                        ${info.latestNewsletter.summary ? `
                        <div class="newsletter-summary">
                            <span class="info-icon">📄</span>
                            <div class="summary-preview">${info.latestNewsletter.summary.substring(0, 150)}${info.latestNewsletter.summary.length > 150 ? '...' : ''}</div>
                        </div>
                        ` : ''}
                        ${!info.latestNewsletter.title && !info.latestNewsletter.content && !info.latestNewsletter.summary ? `
                        <div class="newsletter-empty">
                            <span class="info-icon">📄</span>
                            <div class="empty-message">내용 없음</div>
                        </div>
                        ` : ''}
                    </div>
                </div>
                ` : ''}
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
    const popupContent = popup.querySelector('.detail-popup-modern');

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
            
            // 버튼의 data 속성에서 정보 가져오기 (더 안전함)
            const missionaryName = prayerBtn.dataset.name || name;
            const missionaryLocation = prayerBtn.dataset.location || location;
            
            handleDetailPopupPrayerClick(prayerBtn, missionaryName, missionaryLocation);
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

    // 드래그 기능 추가
    if (popupContent) {
        let isDragging = false;
        let startX, startY, startLeft, startTop;

        popupContent.addEventListener('mousedown', (e) => {
            // 닫기 버튼이나 기도 버튼 클릭 시 드래그 방지
            if (e.target.closest('.close-btn-modern') || e.target.closest('.prayer-btn')) {
                return;
            }
            
            isDragging = true;
            popupContent.classList.add('dragging');
            
            startX = e.clientX;
            startY = e.clientY;
            
            const rect = popupContent.getBoundingClientRect();
            startLeft = rect.left;
            startTop = rect.top;
            
            e.preventDefault();
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            
            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;
            
            const newLeft = startLeft + deltaX;
            const newTop = startTop + deltaY;
            
            // 화면 경계 체크
            const maxX = window.innerWidth - popupContent.offsetWidth;
            const maxY = window.innerHeight - popupContent.offsetHeight;
            
            const clampedLeft = Math.max(0, Math.min(newLeft, maxX));
            const clampedTop = Math.max(0, Math.min(newTop, maxY));
            
            popupContent.style.left = `${clampedLeft}px`;
            popupContent.style.top = `${clampedTop}px`;
            popupContent.style.transform = 'none';
        });

        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                popupContent.classList.remove('dragging');
                
                // 드래그가 끝나면 현재 위치를 저장
                const rect = popupContent.getBoundingClientRect();
                savePopupPosition(rect.left, rect.top);
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
    
    console.log('showPopup 호출됨 - 팝업 표시 시작');
    
    // 팝업을 화면에 보이지 않게 하지만 레이아웃에는 포함되도록 설정
    popup.style.display = "block"; // 레이아웃 계산을 위해 block으로 설정
    popup.style.visibility = "hidden"; // 하지만 화면에는 보이지 않게
    popup.style.opacity = "0"; // 초기 투명도 0
    popup.style.zIndex = "400"; // 선교사 상세 팝업 (권장값)
    popup.classList.remove('visible', 'animate-in', 'animate-out'); // 기존 애니메이션 클래스 제거

    // 팝업의 최종 위치를 먼저 계산하고 적용
    positionPopup(elements);

    // 위치 설정 후, 팝업을 화면에 표시하고 애니메이션 시작
    requestAnimationFrame(() => {
        popup.style.visibility = "visible"; // 화면에 보이게
        popup.style.opacity = "1"; // 투명도를 1로 변경하여 페이드인 시작
        popup.classList.add('visible');
        popup.classList.add('animate-in'); // 애니메이션 클래스 추가
        
        console.log('팝업 표시 완료 - DOM 상태:', {
            display: popup.style.display,
            visibility: popup.style.visibility,
            opacity: popup.style.opacity,
            zIndex: popup.style.zIndex,
            classes: popup.className
        });
    });
}

// 팝업 위치 조정 함수 (저장된 위치 우선)
function positionPopup(elements) {
    const popup = elements.detailPopup;
    const popupContent = popup.querySelector('.detail-popup-modern');
    const mapRect = elements.mapContainer.getBoundingClientRect();
    const popupRect = popup.getBoundingClientRect();
    
    // 저장된 위치가 있는지 확인
    const savedPosition = getSavedPopupPosition();
    let x, y;
    
    if (savedPosition && isValidSavedPosition(savedPosition)) {
        // 저장된 위치 사용
        x = savedPosition.x;
        y = savedPosition.y;
    } else {
        // 기본 위치 계산 (중앙)
        x = mapRect.left + (mapRect.width - popupRect.width) / 2;
        y = mapRect.top + (mapRect.height - popupRect.height) / 2;
    
    // 모바일 최적화
    if (window.innerWidth < 700) {
        x = (window.innerWidth - popupRect.width) / 2;
        y = (window.innerHeight - popupRect.height) / 2;
    }
    
    // 화면 경계 체크
    x = Math.max(20, Math.min(x, window.innerWidth - popupRect.width - 20));
    y = Math.max(20, Math.min(y, window.innerHeight - popupRect.height - 20));
    }
    
    // 팝업 위치 설정
    if (popupContent) {
        popupContent.style.left = `${x}px`;
        popupContent.style.top = `${y}px`;
        popupContent.style.transform = 'none';
    } else {
    popup.style.left = `${x}px`;
    popup.style.top = `${y}px`;
    }
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

// 저장된 팝업 위치 초기화 함수
window.resetPopupPosition = function() {
    try {
        localStorage.removeItem(POPUP_POSITION_KEY);
        return true;
    } catch (error) {
        console.warn('팝업 위치 초기화에 실패했습니다:', error);
        return false;
    }
}

// 현재 저장된 팝업 위치 가져오기 함수
window.getCurrentPopupPosition = function() {
    return getSavedPopupPosition();
}

// 설정 변경 함수 (외부에서 호출 가능)
window.updatePrayerConfig = function(newConfig) {
    Object.assign(PRAYER_CONFIG, newConfig);
}

// 현재 설정 반환 함수
window.getPrayerConfig = function() {
    return { ...PRAYER_CONFIG };
} 