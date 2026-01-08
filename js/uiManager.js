// public/js/uiManager.js
const UIManager = {
    elements: {},

    // DOM 요소들을 지연 로딩으로 초기화
    initElements() {
        // DOM이 완전히 로드될 때까지 대기
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initElements());
            return;
        }

        this.elements = {
            mapContainer: document.getElementById('map'),
            detailPopup: document.getElementById('detailPopup'),
            detailPopupContainer: document.getElementById('detailPopupContainer'),
            titleLogo: document.getElementById('titleLogo'),
            countryTable: document.getElementById('missionary-table-country'),
            presbyteryTable: document.getElementById('missionary-table-presbytery'),
            fullscreenBtn: document.getElementById('fullscreenBtn'),
            exitFullscreenBtn: document.getElementById('exitFullscreenBtn'),
            countryExitBtn: document.getElementById('country-exit-btn'),
            presbyteryExitBtn: document.getElementById('presbytery-exit-btn'),
            sidebarPanel: document.getElementById('sidebar-panel'),
            sidebarOverlay: document.getElementById('sidebar-overlay'),
            sidebarTitle: document.getElementById('sidebar-title'),
            sidebarList: document.getElementById('sidebar-list'),
            sidebarClose: document.querySelector('.sidebar-close'),
            sidebarSearch: document.querySelector('.sidebar-search sl-input'),
        };



        // 중요한 요소들의 존재 여부 확인 및 폴백 처리
        const criticalElements = ['mapContainer', 'detailPopup', 'sidebarPanel', 'sidebarTitle', 'sidebarList'];
        const missingElements = criticalElements.filter(elementName => !this.elements[elementName]);

        if (missingElements.length > 0) {
            console.warn(`중요한 요소들이 누락되었습니다: ${missingElements.join(', ')}`);

            // 누락된 요소들을 생성하거나 폴백 처리
            if (!this.elements.detailPopup) {
                console.log('detailPopup 요소를 생성합니다.');
                const detailPopup = document.createElement('div');
                detailPopup.id = 'detailPopup';
                detailPopup.style.display = 'none';
                document.body.appendChild(detailPopup);
                this.elements.detailPopup = detailPopup;
            }

            if (!this.elements.sidebarPanel) {
                console.log('sidebar-panel 요소를 생성합니다.');
                const sidebarPanel = document.createElement('div');
                sidebarPanel.id = 'sidebar-panel';
                sidebarPanel.className = 'sidebar-panel';
                sidebarPanel.style.display = 'none';
                sidebarPanel.innerHTML = `
                    <div class="sidebar-header">
                        <h3 id="sidebar-title">선교사 목록</h3>
                        <sl-icon-button name="x-lg" label="닫기" class="sidebar-close"></sl-icon-button>
                    </div>
                    <div class="sidebar-content">
                        <div class="sidebar-search">
                            <sl-input placeholder="선교사 이름 검색..." clearable>
                                <sl-icon slot="prefix" name="search"></sl-icon>
                            </sl-input>
                        </div>
                        <div id="sidebar-list" class="sidebar-list">
                        </div>
                    </div>
                `;
                document.body.appendChild(sidebarPanel);
                this.elements.sidebarPanel = sidebarPanel;
                this.elements.sidebarTitle = document.getElementById('sidebar-title');
                this.elements.sidebarList = document.getElementById('sidebar-list');
                this.elements.sidebarClose = document.querySelector('.sidebar-close');
            }
        }

    },

    // 이 UI 매니저를 초기화하고 필요한 참조를 설정합니다.
    initialize(mapController, dataManager) {
        // 참조 설정
        this.mapController = mapController;
        this.dataManager = dataManager;

        // DOM이 완전히 로드된 후 초기화
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.initElements();
                this.setupEventListeners();
            });
        } else {
            // DOM이 이미 로드된 경우
            this.initElements();
            this.setupEventListeners();
        }
    },

    // 이벤트 리스너 설정
    setupEventListeners() {
        // 노회별 보기 종료 버튼
        if (this.elements.presbyteryExitBtn) {
            this.elements.presbyteryExitBtn.addEventListener('click', () => {
                this.exitPresbyteryView();
            });
        }

        // 국가별 보기 종료 버튼
        if (this.elements.countryExitBtn) {
            this.elements.countryExitBtn.addEventListener('click', () => {
                this.exitCountryView();
            });
        }
    },

    // 노회별 보기 종료
    exitPresbyteryView() {
        // 노회별 테이블 다시 표시 (숨기지 않음)
        if (this.elements.presbyteryTable) {
            this.elements.presbyteryTable.style.display = 'block';
        }

        // 종료 버튼 숨기기
        if (this.elements.presbyteryExitBtn) {
            this.elements.presbyteryExitBtn.classList.remove('visible');
        }

        // 전체 보기로 복원
        this.mapController.exitPresbyteryView();


    },

    // 국가별 보기 종료
    exitCountryView() {
        // 국가별 테이블 다시 표시 (숨기지 않음)
        if (this.elements.countryTable) {
            this.elements.countryTable.style.display = 'block';
        }

        // 종료 버튼 숨기기
        if (this.elements.countryExitBtn) {
            this.elements.countryExitBtn.classList.remove('visible');
        }

        // 전체 보기로 복원
        this.mapController.exitCountryView();


    },

    renderCountryTable() {
        const countryStats = this.dataManager.getCountryStats();
        const countries = Object.keys(countryStats).sort((a, b) => a.localeCompare(b, 'ko'));
        const tableRows = countries.map(country => {
            const flagCode = this.mapController.constants.COUNTRY_FLAGS[country];
            const flagImg = flagCode ? `<img class="flag-icon" src="https://flagcdn.com/w40/${flagCode}.png" alt="">` : '';
            return `<tr>
                <td>${flagImg}</td>
                <td class="bold country-click" data-country="${country}">${country}</td>
                <td style="text-align:right;">${countryStats[country].count}</td>
            </tr>`;
        }).join('');
        this.elements.countryTable.innerHTML = `<div style="font-weight:bold;font-size:1.15em;margin-bottom:6px;text-align:center;">국가별 파송현황</div>
            <table><thead><tr><th></th><th>국가</th><th>인원</th></tr></thead><tbody>${tableRows}</tbody></table>`;

        // 국가 클릭 시 사이드바 열기 이벤트 추가
        this.elements.countryTable.querySelectorAll('.country-click').forEach(cell => {
            cell.addEventListener('click', (e) => {
                e.stopPropagation();
                const country = cell.dataset.country;
                const missionaries = this.dataManager.state.missionaries.filter(m => m.country === country);
                this.openSidebar(`${country} 선교사 목록`, missionaries);
            });
        });
    },

    renderPresbyteryTable() {
        const presbyteryStats = this.dataManager.getPresbyteryStats();
        const presbyteries = Object.keys(presbyteryStats).sort((a, b) => a.localeCompare(b, 'ko'));
        const tableRows = presbyteries.map(p => `
            <tr>
                <td class="bold presbytery-click" data-presbytery="${p}">${p}</td>
                <td style="text-align:right;">${presbyteryStats[p]}</td>
            </tr>`).join('');
        this.elements.presbyteryTable.innerHTML = `<div style="font-weight:bold;font-size:1.15em;margin-bottom:6px;text-align:center;">노회별 파송현황</div>
            <table><thead><tr><th>노회</th><th>인원</th></tr></thead><tbody>${tableRows}</tbody></table>`;

        // 노회 클릭 시 사이드바 열기 이벤트 추가
        this.elements.presbyteryTable.querySelectorAll('.presbytery-click').forEach(cell => {
            cell.addEventListener('click', (e) => {
                e.stopPropagation();
                const presbytery = cell.dataset.presbytery;
                const missionaries = this.dataManager.state.missionaries.filter(m => m.presbytery === presbytery);
                this.openSidebar(`${presbytery} 선교사 목록`, missionaries);
            });
        });
    },

    renderGlobalMarkers() {
        this.mapController.clearMarkers('global');
        const countryStats = this.dataManager.getCountryStats();
        const autoplayMode = this.mapController.state.autoplayMode;

        const newMarkers = Object.entries(countryStats).map(([country, stats]) => {
            const latlng = this.mapController.constants.LATLNGS[country] || [0, 0];
            const flag = this.mapController.constants.COUNTRY_FLAGS[country] ? `<img class='flag-icon' src='https://flagcdn.com/w40/${this.mapController.constants.COUNTRY_FLAGS[country]}.png'>` : "";

            // 팝업 내용을 HTML 문자열로 생성
            let popupHTML = `${flag}<b>${country}</b><br>`;

            // 선교사 이름 목록 HTML 생성
            stats.names.forEach(name => {
                const info = this.dataManager.getMissionaryInfo(name) || {};
                const isRecent = window.isRecent(info.lastUpdate);
                const recentIcon = isRecent ? ' <span class="recent-badge" title="최근 소식">📰✨</span>' : '';
                const boldClass = isRecent ? ' recent-bold' : '';
                const entryClass = autoplayMode === 'fixed' ? `missionary-entry${boldClass}` : `popup-list ${boldClass}`;

                // 선교사 ID를 data 속성에 추가 (마커 매핑용)
                const missionaryId = info._id || `missionary_${name}`;
                popupHTML += `<div class="${entryClass}" data-name="${name}" data-missionary-id="${missionaryId}" style="cursor: pointer;"><div class="missionary-name">${name}${recentIcon}</div></div>`;
            });

            const marker = L.marker(latlng).bindPopup(popupHTML);

            // DataManager에 마커-데이터 매핑 등록
            stats.names.forEach(name => {
                const missionary = this.dataManager.getMissionaryInfo(name);
                if (missionary && missionary._id) {
                    this.dataManager.linkMarkerToMissionary(marker, missionary);
                }
            });

            // 팝업 오픈 후 이벤트 리스너 추가
            marker.on('popupopen', (e) => {
                // 선교사 이름 클릭 이벤트 추가
                const popup = e.popup;
                const popupContent = popup.getElement();
                if (popupContent) {
                    const nameElements = popupContent.querySelectorAll('[data-name]');
                    nameElements.forEach(el => {
                        el.style.cursor = 'pointer';
                        el.addEventListener('click', (clickEvent) => {
                            clickEvent.preventDefault();
                            clickEvent.stopPropagation();
                            const name = el.dataset.name;

                            const info = this.dataManager.getMissionaryInfo(name) || {};
                            const latlngForPopup = this.mapController.getLatLng(info, info.country);
                            this.mapController.showDetailPopup(name, latlngForPopup);
                        });
                    });
                }

                if (!this.mapController.state.isByAutoRotate) {
                    this.mapController.state.isPaused = true;
                }
                this.mapController.state.isByAutoRotate = false;

                if (this.mapController.state.autoplayMode === 'fixed') {
                    this.mapController.startPrayerTopicRotation(popup);
                }
            });
            marker.on('popupclose', () => {
                this.mapController.state.isPaused = false;
                this.mapController.stopPrayerTopicRotation();
            });

            // 마커를 직접 지도에 추가 (클러스터 사용 안함)
            marker.addTo(this.mapController.map);
            return marker;
        });

        this.mapController.setMarkers('global', newMarkers);

        console.log('UIManager: renderGlobalMarkers 완료, 마커 수:', newMarkers.length);
    },

    showDetailPopup(name, latlngArray) {
        console.log('[UIManager] showDetailPopup 호출:', name, latlngArray);

        // 모바일: Swiper 기반 카드 UI로 전환
        if (window.innerWidth <= 600 && window.showMobileMissionarySwiper) {
            // 최근 소식 순 정렬(내림차순)
            const missionaries = DataManager.state.missionaries.slice().sort((a, b) => {
                const dateA = new Date(a.lastUpdate || 0);
                const dateB = new Date(b.lastUpdate || 0);
                return dateB - dateA;
            });
            window.showMobileMissionarySwiper(missionaries);
            return;
        }

        // 데스크탑: window.renderDetailPopup 호출 (detailPopup.js의 UI 함수)
        if (window.renderDetailPopup && typeof window.renderDetailPopup === 'function') {
            const missionaryInfo = this.dataManager.state.missionaryInfo || {};
            const элементы = {
                detailPopup: this.elements.detailPopup || document.getElementById('detailPopup'),
                mapContainer: this.elements.mapContainer || document.getElementById('map')
            };

            console.log('[UIManager] window.showDetailPopup 호출 중...', { name, latlngArray, elements: элементы });

            // detailPopup.js의 UI 전용 렌더링 함수 호출
            window.renderDetailPopup(name, latlngArray, missionaryInfo, элементы);
        } else {
            console.error('[UIManager] window.renderDetailPopup 함수를 찾을 수 없습니다.');
            // 폴백: 모던 팝업 시도
            this.showModernDetailPopup(name, latlngArray);
        }
    },

    showModernDetailPopup(name, latlngArray) {
        // elements 객체에서 필요한 요소들 가져오기
        if (!this.elements.detailPopup) {
            console.error('detailPopup 요소가 초기화되지 않았습니다. DOM이 로드되지 않았을 수 있습니다.');
            // 폴백으로 다시 시도
            this.elements.detailPopup = document.getElementById('detailPopup');
            if (!this.elements.detailPopup) {
                console.error('detailPopup 요소를 찾을 수 없습니다. 기존 방식으로 폴백합니다.');
                this.showLegacyDetailPopup(name, latlngArray);
                return;
            }
        }

        const elements = {
            detailPopup: this.elements.detailPopup,
            mapContainer: this.elements.mapContainer,
        };

        const missionaryInfo = this.dataManager.state.missionaryInfo;

        // 새로운 detailPopup 모듈 사용
        if (window.renderDetailPopup) {
            window.renderDetailPopup(name, latlngArray, missionaryInfo, elements);
        } else {
            // 폴백: 테스트 디자인 기반 상세 팝업 생성
            this.createTestStyleDetailPopup(name, latlngArray);
        }

        this.mapController.state.currentDetailPopup = elements.detailPopup;
    },

    // 테스트 디자인 기반 상세 팝업 생성
    createTestStyleDetailPopup(name, latlngArray) {
        const info = this.dataManager.getMissionaryInfo(name);
        if (!info) return;

        // 기존 팝업 제거
        this.closeDetailPopup();

        const popup = document.createElement('div');
        popup.className = 'detail-popup-modern';
        popup.innerHTML = `
            <button class="close-btn-modern">✕</button>
            
            <div class="popup-header">
                <div class="missionary-avatar">
                    ${name.charAt(0)}
                </div>
                <div class="missionary-info">
                    <h2 class="missionary-name">${name}</h2>
                    <p class="missionary-location">📍 ${info.country}${info.city ? ' · ' + info.city : ''}</p>
                </div>
                <button class="prayer-btn" data-name="${name}">
                    <span class="prayer-emoji">🙏</span>
                </button>
            </div>

            <div class="popup-body">
                <div class="info-grid">
                    <div class="info-item">
                        <span class="info-icon">📅</span>
                        <div class="info-content">
                            <div class="info-label">파송년도</div>
                            <div class="info-value">${info.dispatchDate || '정보없음'}</div>
                        </div>
                    </div>
                    
                    <div class="info-item">
                        <span class="info-icon">🏢</span>
                        <div class="info-content">
                            <div class="info-label">소속기관</div>
                            <div class="info-value">${info.organization || '정보없음'}</div>
                        </div>
                    </div>
                    
                    <div class="info-item">
                        <span class="info-icon">⛪</span>
                        <div class="info-content">
                            <div class="info-label">노회</div>
                            <div class="info-value">${info.presbytery || '정보없음'}</div>
                        </div>
                    </div>
                </div>

                <div class="prayer-section">
                    <h3 class="section-title">🙏 기도제목</h3>
                    <p class="prayer-content">${info.prayer || '기도제목이 없습니다.'}</p>
                </div>
            </div>
        `;

        // 닫기 버튼 이벤트
        const closeBtn = popup.querySelector('.close-btn-modern');
        closeBtn.addEventListener('click', () => {
            popup.remove();
            this.mapController.state.currentDetailPopup = null;
        });

        // 기도 버튼 이벤트
        const prayerBtn = popup.querySelector('.prayer-btn');
        prayerBtn.addEventListener('click', () => {
            console.log(`기도 버튼 클릭됨: ${name}`);
            // 기도 알림 표시 로직 추가 가능
        });

        // 팝업을 지도 컨테이너에 추가
        if (this.elements.mapContainer) {
            this.elements.mapContainer.appendChild(popup);

            // 팝업 위치 설정 (화면 중앙)
            const rect = popup.getBoundingClientRect();
            popup.style.position = 'absolute';
            popup.style.left = `${(window.innerWidth - rect.width) / 2}px`;
            popup.style.top = `${(window.innerHeight - rect.height) / 2}px`;
            popup.style.zIndex = '1000';

            this.mapController.state.currentDetailPopup = popup;
        }
    },

    showLegacyDetailPopup(name, latlngArray) {
        try {
            const info = this.dataManager.getMissionaryInfo(name);
            if (!info) {
                console.error('선교사 정보를 찾을 수 없습니다:', name);
                if (window.CommonUtils && window.CommonUtils.showToast) {
                    window.CommonUtils.showToast('선교사 정보를 찾을 수 없습니다.', 'error');
                }
                return;
            }

            // CommonUtils 사용으로 중복 함수 제거

            const card = document.createElement('div');
            card.className = 'detail-popup-card';

            let pdfButton = '';
            if (info.NewsLetter && info.NewsLetter.trim()) {
                pdfButton = `<sl-button variant="primary" size="small" class="newsletter-button" data-newsurl="${info.NewsLetter.trim()}">
                            <sl-icon slot="prefix" name="file-earmark-text"></sl-icon>
                            뉴스레터 보기
                         </sl-button>`;
            }

            const city = info.city && info.city.trim() ? info.city.trim() : '';
            const location = city ? `${info.country} · ${city}` : info.country;
            const imgSrc = info.image && info.image.trim() ? info.image.trim() : window.CommonUtils.createAvatarSVG(name, 600);

            card.innerHTML = `
            <div class="detail-cover">
                <img src="${imgSrc}" alt="${name}" onerror="this.src='${window.CommonUtils.createAvatarSVG(name, 600)}';">
                <div class="cover-overlay">
                    <h2>${name}</h2>
                </div>
                <sl-icon-button name="x-lg" label="닫기" class="close-detail-popup"></sl-icon-button>
            </div>
            <div class="detail-popup-body">
                <div class="info-grid">
                    <div><sl-icon name="geo-alt-fill"></sl-icon> ${location}</div>
                    <div><sl-icon name="building"></sl-icon> ${info.organization || '정보없음'}</div>
                    <div><sl-icon name="calendar3"></sl-icon> ${info.dispatchDate || '정보없음'}</div>
                    <div><sl-icon name="clock-history"></sl-icon> ${info.lastUpdate || '정보없음'} ${window.isRecent(info.lastUpdate) ? '<span class="recent-badge">NEW</span>' : ''}</div>
                </div>
                <hr>
                <h3 style="margin:8px 0 6px;">기도제목</h3>
                <p class="prayer-topics">${info.prayer || '기도제목이 없습니다.'}</p>
            </div>
            <div class="detail-popup-footer">${pdfButton}</div>
        `;

            this.elements.detailPopupContainer.appendChild(card);
            this.mapController.state.currentDetailPopup = card;

            card.querySelector('.close-detail-popup').addEventListener('click', () => this.closeDetailPopup());
            const newsBtn = card.querySelector('.newsletter-button');
            if (newsBtn && window.showNewsletter) {
                newsBtn.addEventListener('click', (e) => {
                    e.preventDefault(); e.stopPropagation();
                    window.showNewsletter(newsBtn.dataset.newsurl);
                });
            }
            this.mapController.positionPopup(latlngArray);
        } catch (error) {
            console.error('상세 팝업 표시 중 오류 발생:', error);
            if (window.CommonUtils && window.CommonUtils.showToast) {
                window.CommonUtils.showToast('상세 팝업을 표시할 수 없습니다.', 'error');
            }
        }
    },

    closeDetailPopup() {
        if (this.mapController.state.currentDetailPopup) {
            const popup = this.elements.detailPopup;
            if (popup) {
                // 부드러운 사라짐 애니메이션을 위해 클래스 제거
                popup.classList.remove('visible');
                // 애니메이션이 끝난 후 display: none 처리 (선택사항, CSS에서 처리 가능)
            }
            this.mapController.state.currentDetailPopup = null;
        }

        // 레거시 컨테이너에 남아있을 수 있는 자식 요소 제거
        if (this.elements.detailPopupContainer) {
            while (this.elements.detailPopupContainer.firstChild) {
                this.elements.detailPopupContainer.removeChild(this.elements.detailPopupContainer.firstChild);
            }
        }
    },

    toggleFullscreenButtons() {
        const isFullscreen = !!document.fullscreenElement;
        this.elements.fullscreenBtn.classList.toggle('hidden', isFullscreen);
        this.elements.exitFullscreenBtn.classList.toggle('hidden', !isFullscreen);
    },

    createFloatingElement(item, point, extraClass = '') {
        const floatingEl = document.createElement('div');
        floatingEl.className = `floating-missionary ${extraClass}`;

        const prayerTopic = item.prayer || '현지 정착과 건강을 위해 기도해주세요.';
        const isRecent = window.isRecent(item.lastUpdate);
        const recentClass = isRecent ? 'recent' : '';

        const latlng = this.mapController.getLatLng(item, item.country);

        const contentEl = document.createElement('div');
        contentEl.className = `floating-missionary-content ${recentClass}`;
        contentEl.style.pointerEvents = 'all';
        contentEl.innerHTML = `
            <img src="https://cdn-icons-png.flaticon.com/128/149/149071.png" alt="icon">
            <div>
                <div class="name">${item.name}</div>
                <div class="prayer">${prayerTopic}</div>
            </div>
        `;
        contentEl.addEventListener('click', (e) => {
            e.stopPropagation();
            console.log('플로팅 요소 클릭:', item.name);
            this.showDetailPopup(item.name, latlng);
        });

        floatingEl.appendChild(contentEl);
        floatingEl.style.left = `${point.x - 80}px`;
        floatingEl.style.top = `${point.y - 40}px`;

        this.elements.mapContainer.appendChild(floatingEl);
        return floatingEl;
    },

    animateFloatingElement(element, duration) {
        element.style.animation = `floatUpAndFade ${duration / 1000}s ease-out forwards`;
        setTimeout(() => {
            if (element && element.parentNode) {
                element.parentNode.removeChild(element);
            }
        }, duration);
    },

    // 사이드바 관련 메서드들
    openSidebar(title, missionaries) {
        // DOM 요소들이 초기화되었는지 확인
        if (!this.elements.sidebarTitle || !this.elements.sidebarPanel || !this.elements.sidebarList) {
            console.error('사이드바 요소들이 초기화되지 않았습니다. 다시 초기화를 시도합니다.');
            this.initElements();

            // 재시도
            setTimeout(() => {
                if (this.elements.sidebarTitle && this.elements.sidebarPanel && this.elements.sidebarList) {
                    this.openSidebar(title, missionaries);
                } else {
                    console.error('사이드바를 열 수 없습니다. DOM 요소를 찾을 수 없습니다.');
                }
            }, 100);
            return;
        }

        // 사이드바 열기 시 기도 팝업 순회 일시정지
        if (this.mapController && this.mapController.pausePrayerRotation) {
            this.mapController.pausePrayerRotation();
        }

        this.elements.sidebarTitle.textContent = title;
        this.renderSidebarList(missionaries);
        this.elements.sidebarPanel.classList.add('open');
        this.elements.sidebarOverlay.classList.add('show');

        // 이벤트 리스너 추가
        this.elements.sidebarClose.addEventListener('click', () => this.closeSidebar());
        this.elements.sidebarOverlay.addEventListener('click', () => this.closeSidebar());

        // 필터 초기화 (최초 1회 또는 매번)
        this.initFilters();

        // 검색 기능 - Shoelace input 이벤트
        if (this.elements.sidebarSearch) {
            // 기존 이벤트 리스너 제거
            this.elements.sidebarSearch.removeEventListener('sl-input', this._searchHandler);

            // 새로운 이벤트 리스너 추가
            this._searchHandler = (e) => {
                this.filterSidebarList(e.target.value, missionaries);
            };
            this.elements.sidebarSearch.addEventListener('sl-input', this._searchHandler);
        }

        console.log('사이드바 열기 완료:', title, missionaries.length, '명의 선교사');
    },

    closeSidebar() {
        this.elements.sidebarPanel.classList.remove('open');
        this.elements.sidebarOverlay.classList.remove('show');

        // 활성 상태 제거
        document.querySelectorAll('.sidebar-missionary-item.active').forEach(item => {
            item.classList.remove('active');
        });

        // 검색 입력 초기화
        if (this.elements.sidebarSearch) {
            this.elements.sidebarSearch.value = '';
        }

        // 이벤트 리스너 정리
        if (this._searchHandler) {
            this.elements.sidebarSearch.removeEventListener('sl-input', this._searchHandler);
            this._searchHandler = null;
        }

        // 사이드바 닫기 시 전체보기 모드일 때만 기도 팝업 순회 재개
        if (this.mapController && this.mapController.resumePrayerRotation && !this.mapController.state.fixedCountry) {
            this.mapController.resumePrayerRotation();
        }
    },

    // 필터 초기화 및 이벤트 리스너 설정
    initFilters() {
        const presbyterySelect = document.getElementById('filter-presbytery');
        if (presbyterySelect) {
            // 노회 목록 채우기
            const presbyteries = Object.keys(this.dataManager.state.presbyteryStats || {}).sort();
            presbyterySelect.innerHTML = presbyteries.map(p => `<sl-option value="${p}">${p}</sl-option>`).join('');

            // 필터 적용 버튼 이벤트
            const applyBtn = document.getElementById('apply-filter-btn');
            if (applyBtn) {
                applyBtn.addEventListener('click', () => this.applyFilters());
            }
        }
    },

    applyFilters() {
        const presbyterySelect = document.getElementById('filter-presbytery');
        const activeCheck = document.getElementById('filter-status-active');
        const vacationCheck = document.getElementById('filter-status-vacation');
        const retiredCheck = document.getElementById('filter-status-retired');

        const criteria = {
            presbytery: presbyterySelect ? presbyterySelect.value : null,
            status: []
        };

        if (activeCheck && activeCheck.checked) criteria.status.push('active');
        if (vacationCheck && vacationCheck.checked) criteria.status.push('vacation');
        if (retiredCheck && retiredCheck.checked) criteria.status.push('returned', 'retired');

        // DataManager 필터 적용
        this.dataManager.applyFilters(criteria);

        // 지도 마커 다시 그리기
        this.renderGlobalMarkers();

        // 사이드바 리스트가 열려 있다면 리스트도 갱신
        if (this.elements.sidebarPanel.classList.contains('open')) {
            const filteredMissionaries = this.dataManager.state.filtered.missionaries;
            this.renderSidebarList(filteredMissionaries);
        }

        // 국가별 테이블 갱신
        this.renderCountryTable();
        // 노회별 테이블 갱신
        this.renderPresbyteryTable();
    },

    renderSidebarList(missionaries) {
        const listHTML = missionaries.map(missionary => {
            const isRecent = window.isRecent(missionary.lastUpdate);
            const recentBadge = isRecent ? '<span class="sidebar-recent-badge">NEW</span>' : '';
            const city = missionary.city && missionary.city.trim() ? missionary.city.trim() : '';
            const location = city ? `${missionary.country} · ${city}` : missionary.country;
            const avatarText = missionary.name.charAt(0);

            return `
                <div class="sidebar-missionary-item" data-name="${missionary.name}">
                    <div class="sidebar-missionary-avatar">${avatarText}</div>
                    <div class="sidebar-missionary-info">
                        <div class="sidebar-missionary-name">
                            ${missionary.name}
                            ${recentBadge}
                        </div>
                        <div class="sidebar-missionary-location">
                            <sl-icon name="geo-alt-fill"></sl-icon>
                            ${location}
                        </div>
                        <div class="sidebar-missionary-org">${missionary.organization || '정보없음'}</div>
                    </div>
                </div>
            `;
        }).join('');

        this.elements.sidebarList.innerHTML = listHTML;

        // 클릭 이벤트 추가
        this.elements.sidebarList.querySelectorAll('.sidebar-missionary-item').forEach(item => {
            item.addEventListener('click', (e) => {
                // 기존 활성 상태 제거
                document.querySelectorAll('.sidebar-missionary-item.active').forEach(activeItem => {
                    activeItem.classList.remove('active');
                });

                // 현재 아이템 활성화
                item.classList.add('active');

                const name = item.dataset.name;
                const missionary = missionaries.find(m => m.name === name);
                if (missionary) {
                    // mapController가 있는지 확인
                    if (!this.mapController) {
                        console.error('mapController가 초기화되지 않았습니다.');
                        return;
                    }

                    // getLatLng 메서드가 있는지 확인
                    if (typeof this.mapController.getLatLng !== 'function') {
                        console.error('mapController.getLatLng 메서드가 없습니다.');
                        return;
                    }

                    const latlng = this.mapController.getLatLng(missionary, missionary.country);

                    // 지도가 있는지 확인
                    if (!this.mapController.map) {
                        console.error('mapController.map이 초기화되지 않았습니다.');
                        return;
                    }

                    // 국가별/노회별 보기 모드에서 이름 팝업들 완전히 숨기기
                    if (this.mapController.state.fixedCountry || this.mapController.state.fixedPresbytery) {
                        const namePopups = document.querySelectorAll('.missionary-name-popup');
                        namePopups.forEach(popup => {
                            popup.style.display = 'none';
                        });
                        console.log('[사이드바] 국가별/노회별 보기: 이름 팝업들 완전히 숨김');
                    }

                    // 해당 선교사의 위치로 지도 이동 (부드럽게)
                    this.mapController.map.flyTo(latlng, Math.max(this.mapController.map.getZoom(), 6), {
                        animate: true,
                        duration: 1.5,
                        easeLinearity: 0.25
                    });

                    // 지도 이동 완료 이벤트 리스너 추가
                    const onMoveEnd = () => {
                        // 이벤트 리스너 제거 (한 번만 실행)
                        this.mapController.map.off('moveend', onMoveEnd);

                        // 상세 팝업 표시
                        console.log('[사이드바] 선교사 클릭 → 상세 팝업:', name, latlng);
                        this.showDetailPopup(name, latlng);

                        // 국가별/노회별 보기 모드에서 이름 팝업들 위치 재계산 및 다시 표시
                        if (this.mapController.state.fixedCountry || this.mapController.state.fixedPresbytery) {
                            setTimeout(() => {
                                // 이름 팝업들 위치 재계산
                                if (this.mapController.updateNamePopupPositions) {
                                    this.mapController.updateNamePopupPositions();
                                }

                                // 이름 팝업들 다시 표시
                                const namePopups = document.querySelectorAll('.missionary-name-popup');
                                namePopups.forEach(popup => {
                                    popup.style.display = '';
                                });
                                console.log('[사이드바] 국가별/노회별 보기: 이름 팝업들 다시 표시');
                            }, 100);
                        }
                    };

                    // moveend 이벤트 리스너 등록
                    this.mapController.map.on('moveend', onMoveEnd);
                }
            });
        });
    },

    filterSidebarList(searchTerm, allMissionaries) {
        const filtered = allMissionaries.filter(missionary =>
            missionary.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (missionary.country && missionary.country.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (missionary.city && missionary.city.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (missionary.organization && missionary.organization.toLowerCase().includes(searchTerm.toLowerCase()))
        );
        this.renderSidebarList(filtered);
    }
};

// UIManager를 전역 객체로 등록
window.UIManager = UIManager; 