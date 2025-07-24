// MobileMissionarySwiper.js
(function() {
    // CommonUtils 사용으로 중복 함수 제거

    // 모바일 감지
    function isMobile() {
        return window.innerWidth <= 900;
    }

    // 최신 소식 날짜 계산
    function getLatestNewsDate(missionaries) {
        if (!missionaries || missionaries.length === 0) {
            return '정보 없음';
        }

        // lastUpdate 필드가 있는 선교사들 중 가장 최근 날짜 찾기
        const validDates = missionaries
            .map(m => m.lastUpdate)
            .filter(date => date && date !== '')
            .map(date => new Date(date))
            .filter(date => !isNaN(date.getTime()));

        if (validDates.length === 0) {
            return '정보 없음';
        }

        const latestDate = new Date(Math.max(...validDates));
        
        // 한국 시간으로 변환
        const koreanDate = new Date(latestDate.getTime() + (9 * 60 * 60 * 1000));
        
        // 날짜 포맷팅 (예: 2024.01.15)
        const year = koreanDate.getFullYear();
        const month = String(koreanDate.getMonth() + 1).padStart(2, '0');
        const day = String(koreanDate.getDate()).padStart(2, '0');
        
        return `${year}.${month}.${day}`;
    }

    // 개별 선교사 날짜 포맷팅
    function formatMissionaryDate(lastUpdate) {
        if (!lastUpdate || lastUpdate === '') {
            return '정보 없음';
        }

        try {
            const date = new Date(lastUpdate);
            if (isNaN(date.getTime())) {
                return '정보 없음';
            }

            // 한국 시간으로 변환
            const koreanDate = new Date(date.getTime() + (9 * 60 * 60 * 1000));
            
            // 현재 날짜와 비교
            const now = new Date();
            const diffTime = now.getTime() - koreanDate.getTime();
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

            // 날짜 포맷팅
            const year = koreanDate.getFullYear();
            const month = String(koreanDate.getMonth() + 1).padStart(2, '0');
            const day = String(koreanDate.getDate()).padStart(2, '0');

            if (diffDays === 0) {
                return '오늘';
            } else if (diffDays === 1) {
                return '어제';
            } else if (diffDays < 7) {
                return `${diffDays}일 전`;
            } else if (diffDays < 30) {
                const weeks = Math.floor(diffDays / 7);
                return `${weeks}주 전`;
            } else {
                return `${year}.${month}.${day}`;
            }
        } catch (error) {
            return '정보 없음';
        }
    }

    // 파송년도 추출 함수
    function getSentYear(m) {
        if (m.sent_date) {
            const date = new Date(m.sent_date);
            if (!isNaN(date.getTime())) {
                return date.getFullYear();
            }
        }
        if (m.dispatchDate) {
            return m.dispatchDate;
        }
        return '-';
    }

    // 모바일 모드 진입 시 기존 팝업 숨기기 및 모바일 UI 활성화
    function activateMobileSwiper(missionaries) {
        console.log('activateMobileSwiper 호출됨, 선교사 수:', missionaries.length);
        
        document.body.classList.add('mobile-mode');
        let container = document.getElementById('mobile-missionary-swiper');
        if (!container) {
            container = document.createElement('div');
            container.id = 'mobile-missionary-swiper';
            document.body.appendChild(container);
        }
        container.classList.add('active');

        // 모바일 모드 진입 시 기존 타이틀바 숨김
        const titleLogo = document.getElementById('titleLogo');
        if (titleLogo) titleLogo.style.display = 'none';

        // Swiper 구조 생성
        container.innerHTML = `
            <div class="mobile-titlebar">
                <div class="mobile-titlebar-inner">
                    <img src="logo.svg" alt="로고" class="mobile-titlebar-logo" />
                    <span class="mobile-titlebar-title">한국기독교장로회 국제협력 선교사</span>
                    <button class="close-mobile-swiper">✕</button>
                </div>
            </div>
            <div class="swiper">
                <div class="swiper-wrapper">
                    ${missionaries.map((m, index) => `
                        <div class="swiper-slide">
                            <div class="missionary-card" data-missionary-index="${index}" data-country="${m.country || ''}">
                                <div class="glass-overlay"></div>
                                <div class="missionary-info-header">
                                    <div class="missionary-update-info">
                                        <span class="update-label">최신 소식</span>
                                        <span class="update-date">${formatMissionaryDate(m.lastUpdate)}</span>
                                    </div>
                                </div>
                                <div class="missionary-avatar"><img src="${m.image || window.CommonUtils.createAvatarSVG(m.name, 90)}" alt="${m.name}"></div>
                                <div class="missionary-name">${m.name}</div>
                                <div class="missionary-location"><span class="emoji">📍</span> ${m.country}${m.city ? ', ' + m.city : ''}</div>
                                <div class="missionary-info-row vertical">
                                    <span class="sent-year"><span class="emoji">📅</span> 파송년도: ${getSentYear(m)}</span>
                                    <span class="organization"><span class="emoji">⛪️</span> 사역지: ${m.organization || '-'}</span>
                                </div>
                                <button class="prayer-btn" data-missionary-index="${index}">🙏</button>
                                <div class="prayer-section">${m.prayer || '기도제목이 없습니다.'}</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
            <div class="next-card-indicator">🌏</div>
        `;

        console.log('Swiper HTML 생성 완료, 초기화 시작');

        // Swiper 초기화
        const swiper = new Swiper('.swiper', {
            direction: 'vertical',
            slidesPerView: 1,
            spaceBetween: 0,
            centeredSlides: false,
            mousewheel: true,
            pagination: false,
            allowTouchMove: true,
            autoHeight: false,
            height: window.innerHeight,
            on: {
                init: function() {
                    console.log('Swiper 초기화 완료');
                    // 각 카드에 국가별 배경 적용
                    applyCountryBackgrounds(missionaries);
                }
            }
        });

        // 이벤트 리스너 설정
        setupMobileSwiperEvents(container, missionaries);

        // 닫기 버튼
        container.querySelector('.close-mobile-swiper').onclick = function() {
            container.classList.remove('active');
            document.body.classList.remove('mobile-mode');
            if (titleLogo) titleLogo.style.display = '';
            location.reload();
        };
    }

    // 각 카드에 국가별 배경 적용
    function applyCountryBackgrounds(missionaries) {
        if (!window.CountryBackgrounds) {
            console.warn('CountryBackgrounds 모듈이 로드되지 않았습니다.');
            return;
        }

        console.log('국가별 배경 적용 시작...');
        
        missionaries.forEach((missionary, index) => {
            const cardElement = document.querySelector(`[data-missionary-index="${index}"]`);
            if (cardElement && missionary.country) {
                // CountryBackgrounds를 사용하여 카드 배경 설정
                window.CountryBackgrounds.setCardBackground(cardElement, missionary);
                console.log(`${missionary.name} 카드에 ${missionary.country} 배경 적용`);
            }
        });

        console.log('국가별 배경 적용 완료');
    }

    // 모바일 스와이퍼 이벤트 설정
    function setupMobileSwiperEvents(container, missionaries) {
        // 카드 클릭 이벤트 (상세보기 열기)
        container.addEventListener('click', (e) => {
            const card = e.target.closest('.missionary-card');
            if (card) {
                const index = parseInt(card.dataset.missionaryIndex);
                const missionary = missionaries[index];
                if (missionary && window.showMobileDetailPopup) {
                    window.showMobileDetailPopup(missionary);
                }
            }
        });

        // 기도 버튼 클릭 이벤트
        container.addEventListener('click', (e) => {
            if (e.target.classList.contains('prayer-btn')) {
                e.stopPropagation(); // 카드 클릭 이벤트 방지
                const index = parseInt(e.target.dataset.missionaryIndex);
                const missionary = missionaries[index];
                if (missionary) {
                    handleMobileCardPrayer(e.target, missionary.name, `${missionary.country}${missionary.city ? ', ' + missionary.city : ''}`);
                }
            }
        });
    }

    // 모바일 카드 기도 버튼 핸들러
    async function handleMobileCardPrayer(button, name, location) {
        // 펄스 애니메이션
        button.classList.add('prayed');
        setTimeout(() => {
            button.classList.remove('prayed');
        }, 600);

        // 토스트 메시지 표시
        showMobileCardToast(name, location);

        // 햅틱 피드백 (지원하는 경우)
        if (navigator.vibrate) {
            navigator.vibrate(100);
        }

        // PrayerClick 모듈과 연동하여 Firebase에 기도 기록 및 지도에 기도손 표시
        if (window.handlePrayerClick) {
            try {
                // 선교사 데이터 생성 (PrayerClick 모듈에서 요구하는 형식)
                const missionaryData = {
                    name: name,
                    country: location.split(',')[0].trim(), // 위치에서 국가 추출
                    city: location.split(',')[1]?.trim() || '', // 위치에서 도시 추출
                    flagUrl: '' // 국기 URL은 handlePrayerClick에서 생성
                };
                
                // 로딩 상태 표시
                button.style.opacity = '0.7';
                button.style.pointerEvents = 'none';
                
                const success = await window.handlePrayerClick(missionaryData);
                
                if (success) {
                    console.log(`${name} 선교사를 위한 기도 요청이 Firebase에 기록되었습니다.`);
                    
                    // 성공 피드백 - 버튼 색상 변경
                    button.style.background = 'rgba(34, 197, 94, 0.9)';
                    button.style.color = 'white';
                    button.style.transform = 'scale(1.1)';
                    
                    setTimeout(() => {
                        button.style.background = '';
                        button.style.color = '';
                        button.style.transform = '';
                    }, 2000);
                } else {
                    console.log('기도 요청 Firebase 기록에 실패했습니다.');
                    
                    // 실패 피드백
                    button.style.background = 'rgba(239, 68, 68, 0.9)';
                    button.style.color = 'white';
                    
                    setTimeout(() => {
                        button.style.background = '';
                        button.style.color = '';
                    }, 2000);
                }
                
                // 로딩 상태 해제
                button.style.opacity = '1';
                button.style.pointerEvents = 'auto';
                
            } catch (error) {
                console.error('기도 클릭 처리 중 오류:', error);
                
                // 오류 피드백
                button.style.background = 'rgba(239, 68, 68, 0.9)';
                button.style.color = 'white';
                
                setTimeout(() => {
                    button.style.background = '';
                    button.style.color = '';
                }, 2000);
                
                // 로딩 상태 해제
                button.style.opacity = '1';
                button.style.pointerEvents = 'auto';
            }
        } else {
            console.warn('PrayerClick 모듈이 로드되지 않았습니다.');
        }
    }

    // 모바일 카드 토스트 메시지
    function showMobileCardToast(name, location) {
        const existingToast = document.querySelector('.mobile-card-toast');
        if (existingToast) existingToast.remove();

        const toast = document.createElement('div');
        toast.className = 'mobile-card-toast';
        toast.style.cssText = `
            position: fixed;
            top: 2rem;
            left: 50%;
            transform: translateX(-50%) translateY(-100px);
            background: rgba(0, 0, 0, 0.9);
            backdrop-filter: blur(20px);
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 50px;
            font-size: 0.9rem;
            z-index: 450;
            opacity: 0;
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            display: flex;
            align-items: center;
            gap: 0.5rem;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
        `;
        toast.innerHTML = `
            <span style="font-size: 1.2rem;">🙏</span>
            <span>${name}님을 위해 기도합니다</span>
        `;

        document.body.appendChild(toast);
        
        // 애니메이션 실행
        requestAnimationFrame(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateX(-50%) translateY(0)';
        });

        // 자동 제거
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(-50%) translateY(-100px)';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.remove();
                }
            }, 400);
        }, 3000);
    }

    // 전역에서 호출할 수 있도록 window에 등록
    window.showMobileMissionarySwiper = activateMobileSwiper;
})();

// --- 자동 모바일 Swiper 진입/종료 로직 ---
(function() {
    let swiperActive = false;
    function tryShowMobileSwiper() {
        console.log('tryShowMobileSwiper 호출됨, 화면 너비:', window.innerWidth);
        
        if (window.innerWidth <= 600 && window.showMobileMissionarySwiper && !swiperActive) {
            const missionaries = (window.DataManager?.state?.missionaries || []).slice().sort((a, b) => {
                const dateA = new Date(a.lastUpdate || 0);
                const dateB = new Date(b.lastUpdate || 0);
                return dateB - dateA;
            });
            
            console.log('자동 모바일 스와이퍼 시도, 선교사 수:', missionaries.length);
            
            if (missionaries.length > 0) {
                window.showMobileMissionarySwiper(missionaries);
                swiperActive = true;
                console.log('자동 모바일 스와이퍼 활성화됨');
            }
        }
        if (window.innerWidth > 600 && swiperActive) {
            const container = document.getElementById('mobile-missionary-swiper');
            if (container) container.classList.remove('active');
            document.body.classList.remove('mobile-mode');
            swiperActive = false;
            console.log('자동 모바일 스와이퍼 비활성화됨');
        }
    }
    window.addEventListener('resize', tryShowMobileSwiper);
    window.addEventListener('DOMContentLoaded', () => {
        console.log('MobileMissionarySwiper DOMContentLoaded 이벤트');
        if (window.DataManager && window.DataManager.onDataReady) {
            window.DataManager.onDataReady(tryShowMobileSwiper);
        } else {
            tryShowMobileSwiper();
        }
    });
})(); 