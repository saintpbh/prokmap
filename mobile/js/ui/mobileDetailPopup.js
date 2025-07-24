// 모바일 전용 상세보기 팝업
(function() {
    let currentOverlay = null;
    let currentPrayerBtn = null;

    // 모바일 상세보기 표시 함수
    function showMobileDetailPopup(missionaryData) {
        console.log('모바일 상세보기 표시:', missionaryData.name);
        
        // 기존 오버레이 제거
        if (currentOverlay) {
            currentOverlay.remove();
        }

        // 오버레이 생성
        const overlay = document.createElement('div');
        overlay.className = 'mobile-detail-overlay';
        overlay.innerHTML = createMobileDetailHTML(missionaryData);
        
        document.body.appendChild(overlay);
        currentOverlay = overlay;

        // 이벤트 리스너 설정
        setupMobileDetailEvents(overlay, missionaryData);

        // 애니메이션으로 표시
        requestAnimationFrame(() => {
            overlay.classList.add('visible');
        });
    }

    // 모바일 상세보기 HTML 생성
    function createMobileDetailHTML(data) {
        const sentDate = data.sent_date ? new Date(data.sent_date) : null;
        const sentYear = sentDate ? sentDate.getFullYear() : '정보 없음';
        const imgSrc = data.image && data.image.trim() ? data.image.trim() : "https://via.placeholder.com/80x80/e8f5e8/4a90e2?text=👤";
        const location = `${data.country || '정보없음'}, ${data.city || ''}`.replace(/, $/, '');
        
        return `
            <div class="mobile-detail-card">
                <!-- 헤더 섹션 -->
                <div class="mobile-detail-header">
                    <button class="mobile-detail-close" aria-label="닫기">✕</button>
                    <div class="mobile-detail-avatar">
                        <img src="${imgSrc}" alt="${data.name}" loading="lazy" 
                             onerror="this.src='https://via.placeholder.com/80x80/e8f5e8/4a90e2?text=👤';">
                    </div>
                    <h2 class="mobile-detail-name">${data.name}</h2>
                    <p class="mobile-detail-location">${location}</p>
                </div>

                <!-- 본문 섹션 -->
                <div class="mobile-detail-body">
                    <!-- 정보 그리드 -->
                    <div class="mobile-detail-info-grid">
                        <div class="mobile-detail-info-item">
                            <div class="mobile-detail-info-icon">📅</div>
                            <div class="mobile-detail-info-content">
                                <div class="mobile-detail-info-label">파송년도</div>
                                <div class="mobile-detail-info-value">${sentYear}년</div>
                            </div>
                        </div>
                        
                        <div class="mobile-detail-info-item">
                            <div class="mobile-detail-info-icon">🏢</div>
                            <div class="mobile-detail-info-content">
                                <div class="mobile-detail-info-label">소속기관</div>
                                <div class="mobile-detail-info-value">${data.organization || '정보 없음'}</div>
                            </div>
                        </div>
                        
                        <div class="mobile-detail-info-item">
                            <div class="mobile-detail-info-icon">⛪</div>
                            <div class="mobile-detail-info-content">
                                <div class="mobile-detail-info-label">노회</div>
                                <div class="mobile-detail-info-value">${data.presbytery || '정보 없음'}</div>
                            </div>
                        </div>
                    </div>

                    <!-- 기도제목 섹션 -->
                    <div class="mobile-detail-prayer">
                        <h3 class="mobile-detail-prayer-title">기도제목</h3>
                        <p class="mobile-detail-prayer-content">${data.prayer || '현지 정착과 건강을 위해 기도해 주세요.'}</p>
                    </div>
                </div>
            </div>

            <!-- 플로팅 기도 버튼 -->
            <button class="mobile-detail-prayer-btn" data-name="${data.name}" data-location="${location}">
                🙏
            </button>
        `;
    }

    // 이벤트 리스너 설정
    function setupMobileDetailEvents(overlay, data) {
        const closeBtn = overlay.querySelector('.mobile-detail-close');
        const prayerBtn = overlay.querySelector('.mobile-detail-prayer-btn');
        const location = `${data.country || '정보없음'}, ${data.city || ''}`.replace(/, $/, '');

        // 닫기 버튼
        closeBtn.addEventListener('click', () => {
            closeMobileDetailPopup();
        });

        // 기도 버튼
        prayerBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            handleMobilePrayerClick(prayerBtn, data.name, location);
        });

        // 오버레이 클릭으로 닫기 (카드 영역 제외)
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                closeMobileDetailPopup();
            }
        });

        // ESC 키로 닫기
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                closeMobileDetailPopup();
                document.removeEventListener('keydown', handleKeyDown);
            }
        };
        document.addEventListener('keydown', handleKeyDown);

        // 터치 제스처로 닫기 (스와이프 다운)
        let startY = 0;
        let currentY = 0;
        const card = overlay.querySelector('.mobile-detail-card');

        card.addEventListener('touchstart', (e) => {
            startY = e.touches[0].clientY;
        });

        card.addEventListener('touchmove', (e) => {
            currentY = e.touches[0].clientY;
            const deltaY = currentY - startY;
            
            if (deltaY > 50) { // 50px 이상 아래로 스와이프
                card.style.transform = `translateY(${deltaY}px) scale(${1 - deltaY * 0.001})`;
            }
        });

        card.addEventListener('touchend', (e) => {
            const deltaY = currentY - startY;
            
            if (deltaY > 100) { // 100px 이상 스와이프하면 닫기
                closeMobileDetailPopup();
            } else {
                // 원래 위치로 복원
                card.style.transform = '';
            }
        });
    }

    // 모바일 상세보기 닫기
    function closeMobileDetailPopup() {
        if (currentOverlay) {
            currentOverlay.classList.remove('visible');
            setTimeout(() => {
                if (currentOverlay && currentOverlay.parentNode) {
                    currentOverlay.remove();
                }
                currentOverlay = null;
            }, 400);
        }
    }

    // 모바일 기도 버튼 클릭 핸들러
    function handleMobilePrayerClick(button, name, location) {
        // 펄스 애니메이션
        button.classList.add('prayed');
        setTimeout(() => {
            button.classList.remove('prayed');
        }, 600);

        // 토스트 메시지 표시
        showMobilePrayerToast(name, location);

        // 햅틱 피드백 (지원하는 경우)
        if (navigator.vibrate) {
            navigator.vibrate(100);
        }
    }

    // 모바일 기도 토스트 메시지
    function showMobilePrayerToast(name, location) {
        const existingToast = document.querySelector('.mobile-detail-toast');
        if (existingToast) existingToast.remove();

        const toast = document.createElement('div');
        toast.className = 'mobile-detail-toast';
        toast.innerHTML = `
            <span class="mobile-detail-toast-icon">🙏</span>
            <span>${name}님을 위해 기도합니다</span>
        `;

        document.body.appendChild(toast);

        // 애니메이션으로 표시
        requestAnimationFrame(() => {
            toast.classList.add('show');
        });

        // 3초 후 자동 제거
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.remove();
                }
            }, 300);
        }, 3000);
    }

    // 전역 함수로 노출
    window.MobileDetailPopup = {
        show: showMobileDetailPopup,
        close: closeMobileDetailPopup,
        showToast: showMobilePrayerToast
    };

    console.log('MobileDetailPopup 모듈 로드 완료');
})(); 