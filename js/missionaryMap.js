// missionaryMap.js
// 주요 함수/객체를 window에 등록하는 방식으로 변환

// 의존성 함수는 window.함수명으로 접근
// 예: window.isRecent(...), window.getLatLng(...)



window.MissionaryMap = class MissionaryMap {
    constructor() {
        this.state = {
            isPaused: false,
            isAnimOn: true,
            isByAutoRotate: false,
            fixedCountry: null,
            globalMarkerIndex: 0,
            countryMarkerIndex: 0,
            missionaryMarkerIndex: 0,
            missionaries: [],
            missionaryInfo: {},
            countryStats: {},
            presbyteryStats: {},
            presbyteryMembers: {},
            autoplayMode: null,
        };

        this.elements = {
            mapContainer: document.getElementById('map'),
            detailPopup: document.getElementById('detailPopup'),
            titleLogo: document.getElementById('titleLogo'),
            countryTable: document.getElementById('missionary-table-country'),
            presbyteryTable: document.getElementById('missionary-table-presbytery'),
            fullscreenBtn: document.getElementById('fullscreenBtn'),
            exitFullscreenBtn: document.getElementById('exitFullscreenBtn'),
            countryExitBtn: document.getElementById('country-exit-btn'),
            presbyteryExitBtn: document.getElementById('presbytery-exit-btn'),
        };

        this.map = null;
        this.globalMarkers = [];
        this.fixedCountryMarkers = [];
        this.fixedCountryPopups = [];
        this.missionaryMarkers = [];
        this.timers = {};
        this.prayerRotationTimer = null;

        this.constants = {
            // Firebase Realtime Database 사용 (Google Sheets URL 제거)
            FLOAT_COUNT: 1,
            FLOAT_DISPLAY_TIME: 3000,
            FLOAT_INTERVAL: 3500,
            PRESBYTERY_FLOAT_DURATION: 5000,
            PRESBYTERY_PAUSE_EXTRA: 7000,
            POPUP_ROTATE_INTERVAL: 3000,
            LATLNGS: {
                "일본": [36.2048, 138.2529], "중국": [35.8617, 104.1954], "대만": [23.6978, 120.9605], "몽골": [46.8625, 103.8467], "러시아": [61.5240, 105.3188],
                "필리핀": [12.8797, 121.7740], "태국": [15.8700, 100.9925], "캄보디아": [12.5657, 104.9910], "라오스": [19.8563, 102.4955], "인도": [20.5937, 78.9629],
                "인도네시아": [-0.7893, 113.9213], "파키스탄": [30.3753, 69.3451], "동티모르": [-8.8742, 125.7275], "네팔": [28.3949, 84.1240], "말레이시아": [4.2105, 101.9758],
                "뉴질랜드": [-40.9006, 174.8860], "호주": [-25.2744, 133.7751], "이스라엘": [31.0461, 34.8516], "독일": [51.1657, 10.4515], "헝가리": [47.1625, 19.5033],
                "불가리아": [42.7339, 25.4858], "부르키나파소": [12.2383, -1.5616], "케냐": [0.0236, 37.9062], "모리타니": [21.0079, -10.9408], "라이베리아": [6.4281, -9.4295],
                "말라위": [-13.2543, 34.3015], "우간다": [1.3733, 32.2903], "미국": [37.0902, -95.7129], "쿠바": [21.5218, -77.7812]
            },
            COUNTRY_FLAGS: {
                "일본": "jp", "중국": "cn", "대만": "tw", "몽골": "mn", "러시아": "ru", "필리핀": "ph", "태국": "th", "캄보디아": "kh", "라오스": "la", "인도": "in",
                "인도네시아": "id", "파키스탄": "pk", "동티모르": "tl", "네팔": "np", "말레이시아": "my", "뉴질랜드": "nz", "호주": "au", "이스라엘": "il", "독일": "de",
                "헝가리": "hu", "불가리아": "bg", "부르키나파소": "bf", "케냐": "ke", "모리타니": "mr", "라이베리아": "lr", "말라위": "mw", "우간다": "ug", "미국": "us", "쿠바": "cu"
            }
        };

        this.init();
    }

    init() {
        this.initMap();
        this.initEventListeners();
        this.fetchData();

        // UIManager 초기화
        if (window.UIManager) {
            window.UIManager.initialize(this, window.DataManager);
        } else {
            console.warn('UIManager를 찾을 수 없습니다.');
        }

        this.initPrayerCount();

        // PrayerClick 모듈 초기화
        this.initPrayerClick();

        // 배경 오버레이 클릭 이벤트 초기화
        this.initBackdropClick();

        // 전역 함수로 등록
        window.MissionaryMap = this;
        window.showDetailPopup = this.showDetailPopup.bind(this);
        window.showFloatingListPopup = this.showFloatingListPopup.bind(this);
        window.showFloatingPrayerPopup = this.showFloatingPrayerPopup.bind(this);

        // 테스트용 전역 함수
        window.testPrayerPopup = (missionaryName) => {
            const missionary = this.state.missionaries.find(m =>
                m.name && m.name.trim() === missionaryName.trim()
            );
            if (missionary) {
                const latlng = this.getLatLng(missionary, missionary.country);
                this.showFloatingPrayerPopup(missionaryName, latlng);
                console.log(`기도 팝업 테스트: ${missionaryName}`);
            } else {
                console.error(`선교사를 찾을 수 없습니다: ${missionaryName}`);
            }
        };
    }

    initMap() {
        this.map = L.map(this.elements.mapContainer).setView([20, 0], 2);

        // 바다가 푸른색인 아름다운 지도 스타일로 변경
        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
            attribution: '© OpenStreetMap contributors © CARTO',
            subdomains: 'abcd',
            maxZoom: 19
        }).addTo(this.map);


    }

    initEventListeners() {
        if (this.elements.titleLogo) {
            this.elements.titleLogo.addEventListener('click', () => this.toggleAnimation());
        }
        if (this.elements.countryTable) {
            this.elements.countryTable.addEventListener('click', (e) => {
                const countryCell = e.target.closest('.country-click');
                if (countryCell) this.enterFixedCountryMode(countryCell.dataset.country);
            });
        }
        if (this.elements.presbyteryTable) {
            this.elements.presbyteryTable.addEventListener('click', (e) => {
                const presbyteryCell = e.target.closest('.presbytery-click');
                if (presbyteryCell) this.showPresbyteryPopups(presbyteryCell.dataset.presbytery);
            });
        }
        if (this.elements.detailPopup) {
            this.elements.detailPopup.addEventListener('click', (e) => {
            });
        }
        if (this.map) {
            this.map.on('click', () => { if (this.state.fixedCountry || this.state.fixedPresbytery) this.restoreGlobalMode(); });
            this.map.on('zoomend moveend', () => {
                if (this.state.fixedCountry) {
                    this.repositionFixedPopups();
                    this.updateMissionaryNamePopupPositions();
                } else if (this.state.fixedPresbytery) {
                    this.updateMissionaryNamePopupPositions();
                }
            });
        }
        if (this.elements.countryExitBtn) {
            this.elements.countryExitBtn.addEventListener('click', () => this.restoreGlobalMode());
        }
        if (this.elements.presbyteryExitBtn) {
            this.elements.presbyteryExitBtn.addEventListener('click', () => this.restoreGlobalMode());
        }
        if (this.elements.fullscreenBtn) {
            this.elements.fullscreenBtn.addEventListener('click', () => document.documentElement.requestFullscreen());
        }
        if (this.elements.exitFullscreenBtn) {
            this.elements.exitFullscreenBtn.addEventListener('click', () => document.exitFullscreen());
        }
        document.addEventListener('fullscreenchange', () => this.toggleFullscreenButtons());
    }

    fetchData() {
        console.log('missionaryMap: Firebase에서 데이터 로딩 시작...');

        if (!window.firebase || !window.firebase.database) {
            console.error('missionaryMap: Firebase SDK가 로드되지 않았습니다.');
            return;
        }

        const db = window.firebase.database();

        // missionaries 데이터 실시간 리스너 설정
        db.ref('missionaries').on('value', snapshot => {
            console.log('missionaryMap: missionaries 데이터 실시간 업데이트');
            const missionaries = [];
            snapshot.forEach(child => {
                const data = child.val();
                if (data && data.name && data.name.trim() !== '') {
                    // 모든 필드를 포함하여 데이터 추가
                    missionaries.push({
                        ...data,
                        _id: child.key, // Firebase 키를 ID로 사용
                        name: data.name.trim(),
                        country: data.country || '',
                        city: data.city || '',
                        presbytery: data.presbytery || '',
                        organization: data.organization || '',
                        lastUpdate: data.lastUpdate || '',
                        summary: data.summary || '', // 최근 뉴스레터 요약
                        prayerTopic: data.prayerTopic || '', // 기도제목
                        lat: data.lat || null,
                        lng: data.lng || null
                    });
                }
            });

            console.log(`missionaryMap: ${missionaries.length}명의 선교사 데이터 로드됨`);
            console.log('로드된 선교사 목록:', missionaries.map(m => `${m.name} (${m.country})`));

            // DataManager에 데이터 동기화 (검색 기능 등이 사용할 수 있도록)
            if (window.DataManager && window.DataManager.processData) {
                console.log('missionaryMap: DataManager에 데이터 동기화 중...');
                window.DataManager.processData(missionaries);
                window.DataManager.state.isDataReady = true;
                window.DataManager.notifyDataReady();
                console.log('missionaryMap: DataManager 동기화 완료');
            } else {
                console.warn('missionaryMap: DataManager를 찾을 수 없어 데이터 동기화를 건너뜁니다.');
            }

            // 선교사 데이터 처리 및 렌더링 (MissionaryMap 자체 용도)
            this.processData(missionaries);
            this.renderAll();
            this.startIntervals();
        });

        // news 데이터 실시간 리스너 설정
        db.ref('news').on('value', newsSnap => {
            console.log('missionaryMap: news 데이터 실시간 업데이트');
            const news = [];
            newsSnap.forEach(child => {
                const data = child.val();
                if (data) {
                    news.push(data);
                }
            });
            console.log(`missionaryMap: ${news.length}개의 뉴스 데이터 로드됨`);
        });
    }

    processData(data) {
        // 선교사 데이터를 최근 뉴스레터 날짜 순으로 정렬
        this.state.missionaries = data.filter(item => item.name && item.country);

        // 최근 뉴스레터 날짜 순으로 정렬 (최신이 먼저)
        this.state.missionaries.sort((a, b) => {
            const dateA = a.lastUpdate ? new Date(a.lastUpdate) : new Date(0);
            const dateB = b.lastUpdate ? new Date(b.lastUpdate) : new Date(0);
            return dateB - dateA;
        });

        this.state.missionaries.forEach(item => {
            this.state.missionaryInfo[item.name] = item;
            if (item.country) {
                this.state.countryStats[item.country] = this.state.countryStats[item.country] || { count: 0, names: [], cities: [] };
                this.state.countryStats[item.country].count++;
                this.state.countryStats[item.country].names.push(item.name);
                this.state.countryStats[item.country].cities.push(item.city && item.city.trim() ? item.city : null);
            }
            if (item.presbytery) {
                this.state.presbyteryStats[item.presbytery] = (this.state.presbyteryStats[item.presbytery] || 0) + 1;
                this.state.presbyteryMembers[item.presbytery] = this.state.presbyteryMembers[item.presbytery] || [];
                this.state.presbyteryMembers[item.presbytery].push(item);
            }
        });

        console.log('선교사 데이터 처리 완료:', this.state.missionaries.length, '명');
        console.log('정렬된 선교사 목록:', this.state.missionaries.map(m => `${m.name} (${m.lastUpdate || '날짜 없음'})`));
    }

    renderAll() {
        this.renderCountryTable();
        this.renderPresbyteryTable();
        this.renderGlobalMarkers();
        this.renderMissionaryMarkers();
    }

    startIntervals() {
        // 기존 타이머 정리
        if (this.timers.floating) {
            clearInterval(this.timers.floating);
        }
        if (this.timers.rotation) {
            clearInterval(this.timers.rotation);
        }
        if (this.timers.missionaryRotation) {
            clearInterval(this.timers.missionaryRotation);
        }

        // 국가별/노회별 보기 모드가 아닐 때만 순환팝업 시작
        if (!this.state.fixedCountry && !this.state.fixedPresbytery) {
            // 전체보기 모드에서 기도 팝업 순회 시작 (2초 후)
            setTimeout(() => {
                // 기도 팝업이 이미 실행 중이면 재개, 아니면 시작
                if (window.prayerPopupManager && window.prayerPopupManager.isRunning) {
                    this.forceResumePrayerRotation();
                } else {
                    this.startPrayerRotation();
                }
            }, 2000);

            console.log('전체보기 인터벌 시작됨 (순환팝업 활성화)');
        } else {
            console.log('국가별/노회별 보기 모드: 순환팝업 비활성화됨');
        }
    }

    renderCountryTable() {
        const countries = Object.keys(this.state.countryStats).sort((a, b) => a.localeCompare(b, 'ko'));
        const tableRows = countries.map(country => {
            const flagCode = this.constants.COUNTRY_FLAGS[country];
            const flagImg = flagCode ? `<img class="flag-icon" src="https://flagcdn.com/w40/${flagCode}.png" alt="">` : '';
            return `<tr>
                <td>${flagImg}</td>
                <td class="bold country-click" data-country="${country}">${country}</td>
                <td style="text-align:right;">${this.state.countryStats[country].count}</td>
            </tr>`;
        }).join('');
        this.elements.countryTable.innerHTML = `<div style="font-weight:bold;font-size:1.15em;margin-bottom:6px;text-align:center;">국가별 파송현황</div>
            <table><thead><tr><th></th><th>국가</th><th>인원</th></tr></thead><tbody>${tableRows}</tbody></table>`;
    }

    renderPresbyteryTable() {
        const presbyteries = Object.keys(this.state.presbyteryStats).sort((a, b) => a.localeCompare(b, 'ko'));
        const tableRows = presbyteries.map(p => `
            <tr>
                <td class="bold presbytery-click" data-presbytery="${p}">${p}</td>
                <td style="text-align:right;">${this.state.presbyteryStats[p]}</td>
            </tr>`).join('');
        this.elements.presbyteryTable.innerHTML = `<div style="font-weight:bold;font-size:1.15em;margin-bottom:6px;text-align:center;">노회별 파송현황</div>
            <table><thead><tr><th>노회</th><th>인원</th></tr></thead><tbody>${tableRows}</tbody></table>`;
    }

    renderGlobalMarkers() {
        // 기존 마커들 제거
        this.globalMarkers.forEach(marker => this.map.removeLayer(marker));
        this.globalMarkers = [];

        // 클러스터 그룹이 있다면 제거 (전체 보기에서는 클러스터 사용 안함)
        if (this.markerClusterGroup) {
            this.map.removeLayer(this.markerClusterGroup);
            this.markerClusterGroup = null;
        }

        const countryStats = this.state.countryStats;
        const autoplayMode = this.state.autoplayMode;

        console.log('MissionaryMap: 국가 통계:', Object.keys(countryStats).length, '개국');

        const newMarkers = Object.entries(countryStats).map(([country, stats]) => {
            const latlng = this.constants.LATLNGS[country] || [0, 0];
            const flag = this.constants.COUNTRY_FLAGS[country] ? `<img class='flag-icon' src='https://flagcdn.com/w40/${this.constants.COUNTRY_FLAGS[country]}.png'>` : "";

            // 팝업 내용을 HTML 문자열로 생성
            let popupHTML = `${flag}<b>${country}</b><br>`;

            // 선교사 이름 목록 HTML 생성
            stats.names.forEach(name => {
                const info = this.state.missionaryInfo[name] || {};
                const isRecent = window.isRecent(info.lastUpdate);
                const recentIcon = isRecent ? ' <span class="recent-badge" title="최근 소식">📰✨</span>' : '';
                const boldClass = isRecent ? ' recent-bold' : '';
                const entryClass = autoplayMode === 'fixed' ? `missionary-entry${boldClass}` : `popup-list ${boldClass}`;

                // 기도제목을 최근 뉴스레터의 요약 필드에서 가져오기
                const prayerTopic = info.summary && info.summary.trim() !== ''
                    ? info.summary
                    : (info.prayerTopic && info.prayerTopic.trim() !== ''
                        ? info.prayerTopic
                        : '');

                // 선교사 ID를 data 속성에 추가 (마커 매핑용)
                const missionaryId = info._id || `missionary_${name}`;
                popupHTML += `<div class="${entryClass}" data-name="${name}" data-missionary-id="${missionaryId}" style="cursor: pointer;">
                    <div class="missionary-name">${name}${recentIcon}</div>
                    ${prayerTopic ? `<div class="missionary-prayer-topic">${prayerTopic}</div>` : ''}
                </div>`;
            });

            // const marker = L.marker(latlng).bindPopup(popupHTML);
            const marker = L.marker(latlng);

            // 마커 클릭 이벤트 추가 - 새로운 독립적인 선교사 리스트 표시
            marker.on('click', (e) => {
                // 선교사 이름 배열을 객체 배열로 변환 (이름과 도시 정보 포함)
                const missionaryList = stats.names.map(name => {
                    const missionary = this.state.missionaryInfo[name];
                    return {
                        name: name,
                        city: missionary ? missionary.city : '정보없음',
                        country: country,
                        organization: missionary ? missionary.organization : '',
                        presbytery: missionary ? missionary.presbytery : '',
                        sent_date: missionary ? missionary.sent_date : '',
                        prayer: missionary ? missionary.prayer : '',
                        summary: missionary ? missionary.summary : ''
                    };
                });

                // 새로운 독립적인 선교사 리스트 표시
                if (window.showCountryMissionaryList) {
                    // 마커의 화면 좌표 계산 (지도 컨테이너 기준)
                    const point = this.map.latLngToContainerPoint(e.latlng);
                    // 지도 컨테이너의 화면 내 위치(좌상단 offset)를 더해서 브라우저 전체 기준 좌표로 변환
                    const mapRect = this.map.getContainer().getBoundingClientRect();
                    const position = {
                        x: mapRect.left + point.x,
                        y: mapRect.top + point.y
                    };

                    // 디버깅용 로그
                    console.log('팝업 위치 계산:', {
                        latlng: e.latlng,
                        point: point,
                        mapRect: mapRect,
                        position: position
                    });

                    window.showCountryMissionaryList(country, missionaryList, position);
                } else {
                    // 폴백: 기존 플로팅 리스트 사용
                    this.showFloatingListPopup(country, missionaryList, e.latlng);
                }
            });

            // DataManager에 마커-데이터 매핑 등록
            stats.names.forEach(name => {
                const missionary = this.state.missionaryInfo[name];
                if (missionary && missionary._id) {
                    // DataManager가 있는 경우에만 매핑
                    if (window.DataManager && window.DataManager.linkMarkerToMissionary) {
                        window.DataManager.linkMarkerToMissionary(marker, missionary);
                    }
                }
            });



            // 개별 마커를 지도에 직접 추가 (클러스터 사용 안함)
            marker.addTo(this.map);
            return marker;
        });

        this.globalMarkers = newMarkers;

        console.log('MissionaryMap: renderGlobalMarkers 완료, 마커 수:', newMarkers.length);
    }

    showPresbyteryPopups(presbytery) {
        if (this.state.fixedCountry) return;
        this.state.isPaused = true;
        this.state.fixedPresbytery = presbytery; // 노회별 보기 상태 추가
        clearTimeout(this.timers.presbytery);

        // 순환팝업 타이머들 정리
        if (this.timers.floating) {
            clearInterval(this.timers.floating);
            this.timers.floating = null;
        }
        if (this.timers.rotation) {
            clearInterval(this.timers.rotation);
            this.timers.rotation = null;
        }
        if (this.timers.missionaryRotation) {
            clearInterval(this.timers.missionaryRotation);
            this.timers.missionaryRotation = null;
        }

        // 노회별 모드로 진입 시 기도 팝업 즉시 중지 및 팝업 닫기
        this.forceStopPrayerRotation();

        // 현재 표시 중인 기도제목 팝업 완전히 제거
        if (window.prayerPopupManager) {
            window.prayerPopupManager.closeCurrentPopup();
            window.prayerPopupManager.setInvisible();
        }

        // 기존 플로팅 요소들 제거
        document.querySelectorAll('.floating-missionary-wrapper').forEach(div => div.remove());

        // 전체 보기 마커들 제거
        this.globalMarkers.forEach(m => this.map.removeLayer(m));

        // 선교사별 개별 마커들 숨기기
        this.missionaryMarkers.forEach(marker => {
            const element = marker.getElement();
            if (element) {
                element.style.display = 'none';
            }
            marker.closePopup();
        });

        // 이전 노회별 이름 팝업들 정리
        this.clearFixedCountryElements();

        const members = this.state.presbyteryMembers[presbytery] || [];

        // 클러스터 그룹 생성 (노회별 보기에서 사용)
        if (!this.markerClusterGroup) {
            this.markerClusterGroup = L.markerClusterGroup({
                chunkedLoading: true,
                maxClusterRadius: 60,
                spiderfyOnMaxZoom: true,
                showCoverageOnHover: false,
                zoomToBoundsOnClick: true
            });
            this.map.addLayer(this.markerClusterGroup);
        }

        // 클러스터 그룹 초기화
        this.markerClusterGroup.clearLayers();

        // 노회별 선교사들을 개별 마커로 생성하여 클러스터에 추가
        const countryGroups = members.reduce((acc, item) => {
            acc[item.country] = acc[item.country] || [];
            acc[item.country].push(item);
            return acc;
        }, {});

        // 이름 팝업 생성을 위한 데이터 저장 (지도 이동 후 생성)
        const markerData = [];


        Object.entries(countryGroups).forEach(([country, group]) => {
            const latlng = this.constants.LATLNGS[country];
            if (!latlng) return;

            // 각 선교사에 대해 마커 생성
            group.forEach((item, i) => {
                const marker = L.marker(latlng);

                // 팝업 내용 생성
                const flag = this.constants.COUNTRY_FLAGS[country] ?
                    `<img class='flag-icon' src='https://flagcdn.com/w40/${this.constants.COUNTRY_FLAGS[country]}.png'>` : "";
                const isRecent = window.isRecent(item.lastUpdate);
                const recentIcon = isRecent ? ' <span class="recent-badge" title="최근 소식">📰✨</span>' : '';
                const boldClass = isRecent ? ' recent-bold' : '';

                const popupHTML = `
                    ${flag}<b>${item.name}${recentIcon}</b><br>
                    <div class="popup-list ${boldClass}" data-name="${item.name}" style="cursor: pointer;">
                        <div class="missionary-name">${item.city || '정보없음'}</div>
                        <div class="missionary-org">${item.organization || '정보없음'}</div>
                    </div>
                `;

                // 클러스터에 마커 추가
                this.markerClusterGroup.addLayer(marker);
            });

            // 이름 팝업 데이터 저장 (지도 이동 후에 생성)
            markerData.push({ country, group, latlng });
        });

        // 사이드바에 해당 노회 선교사 목록 표시
        if (window.UIManager && window.UIManager.openSidebar) {
            window.UIManager.openSidebar(`${presbytery} 선교사 목록`, members);
        } else {
            console.warn('UIManager.openSidebar를 찾을 수 없습니다.');
        }

        // 노회별 선교사들이 모두 보이도록 지도 bounds 자동 계산
        const validCoords = [];
        members.forEach(missionary => {
            if (missionary.lat && missionary.lng) {
                validCoords.push([missionary.lat, missionary.lng]);
            }
        });

        if (validCoords.length > 0) {
            const bounds = L.latLngBounds(validCoords);

            // 지도 이동이 완료된 후에 이름 팝업 생성
            const onMoveEnd = () => {
                this.map.off('moveend', onMoveEnd); // 이벤트 리스너 제거

                // 지도 이동 완료 후 이름 팝업 생성
                markerData.forEach(({ country, group, latlng }) => {
                    const namePopups = this.createCircularMissionaryNames(group, latlng);
                    this.presbyteryNamePopups = this.presbyteryNamePopups || [];
                    this.presbyteryNamePopups.push(...namePopups);
                });

                console.log('노회별 보기: 지도 이동 완료 후 이름 팝업 생성');
            };

            this.map.once('moveend', onMoveEnd);

            // 패딩을 크게 추가하여 다른 요소에 가려지지 않도록 함
            this.map.fitBounds(bounds, {
                padding: [150, 150], // 패딩 대폭 증가
                maxZoom: 4, // 최대 줌 레벨을 4로 낮춤 (2단계 더 넓게)
                animate: true,
                duration: 0.8
            });
        }

        // 노회별 보기 종료 버튼 표시
        if (this.elements.presbyteryExitBtn) {
            this.elements.presbyteryExitBtn.classList.add('visible');
        }

        this.timers.presbytery = setTimeout(() => {
            this.state.isPaused = false;
            this.state.fixedPresbytery = null; // 노회별 보기 종료 시 상태 초기화
        }, this.constants.PRESBYTERY_FLOAT_DURATION + this.constants.PRESBYTERY_PAUSE_EXTRA);
    }





    enterFixedCountryMode(country) {
        this.state.fixedCountry = country;
        this.state.isPaused = true;

        // 순환팝업 타이머들 정리
        if (this.timers.floating) {
            clearInterval(this.timers.floating);
            this.timers.floating = null;
        }
        if (this.timers.rotation) {
            clearInterval(this.timers.rotation);
            this.timers.rotation = null;
        }
        if (this.timers.missionaryRotation) {
            clearInterval(this.timers.missionaryRotation);
            this.timers.missionaryRotation = null;
        }

        // 국가별 모드로 진입 시 기도 팝업 즉시 중지 및 팝업 닫기
        this.forceStopPrayerRotation();

        // 현재 표시 중인 기도제목 팝업 완전히 제거
        if (window.prayerPopupManager) {
            window.prayerPopupManager.closeCurrentPopup();
            window.prayerPopupManager.setInvisible();
        }

        document.querySelectorAll('.floating-missionary-wrapper').forEach(div => div.remove());

        // 전체 보기 마커들 제거
        this.globalMarkers.forEach(m => this.map.removeLayer(m));

        // 선교사별 개별 마커들 숨기기
        this.missionaryMarkers.forEach(marker => {
            const element = marker.getElement();
            if (element) {
                element.style.display = 'none';
            }
            marker.closePopup();
        });

        // this.closeDetailPopup();
        this.clearFixedCountryElements();

        const latlng = this.constants.LATLNGS[country] || [20, 0];
        this.state.lastCountryLatLng = latlng;

        // 지도 이동이 완료된 후에 이름 팝업 생성
        const onMoveEnd = () => {
            this.map.off('moveend', onMoveEnd); // 이벤트 리스너 제거

            // 지도 이동 완료 후 이름 팝업 생성
            markerData.forEach(({ group, latlng }) => {
                const namePopups = this.createCircularMissionaryNames(group, latlng);
                this.fixedCountryNamePopups = this.fixedCountryNamePopups || [];
                this.fixedCountryNamePopups.push(...namePopups);
            });

            console.log('국가별 보기: 지도 이동 완료 후 이름 팝업 생성');
        };

        this.map.once('moveend', onMoveEnd);
        this.map.setView(latlng, 5, { animate: true });

        const countryMissionaries = this.state.missionaries.filter(item => item.country === country);

        // 클러스터 그룹 생성 (국가별 보기에서 사용)
        if (!this.markerClusterGroup) {
            this.markerClusterGroup = L.markerClusterGroup({
                chunkedLoading: true,
                maxClusterRadius: 60,
                spiderfyOnMaxZoom: true,
                showCoverageOnHover: false,
                zoomToBoundsOnClick: true
            });
            this.map.addLayer(this.markerClusterGroup);
        }

        // 클러스터 그룹 초기화
        this.markerClusterGroup.clearLayers();

        // 국가별 선교사들을 개별 마커로 생성하여 클러스터에 추가
        const coordMap = {};
        countryMissionaries.forEach(item => {
            const mLatLng = this.getLatLng(item, country);
            const key = mLatLng.join(',');
            if (!coordMap[key]) coordMap[key] = [];
            coordMap[key].push(item);
        });

        // 이름 팝업 생성을 위한 데이터 저장 (지도 이동 후 생성)
        const markerData = [];


        // 각 좌표 그룹별로 마커와 원형 이름 팝업 생성
        Object.entries(coordMap).forEach(([key, group]) => {
            const latlng = key.split(',').map(Number);

            // 그룹의 첫 번째 선교사 위치를 중심으로 사용
            const centerLatlng = latlng;

            // 각 선교사에 대해 마커 생성
            group.forEach(item => {
                const marker = L.marker(latlng);

                // 팝업 내용 생성
                const flag = this.constants.COUNTRY_FLAGS[country] ?
                    `<img class='flag-icon' src='https://flagcdn.com/w40/${this.constants.COUNTRY_FLAGS[country]}.png'>` : "";
                const isRecent = window.isRecent(item.lastUpdate);
                const recentIcon = isRecent ? ' <span class="recent-badge" title="최근 소식">📰✨</span>' : '';
                const boldClass = isRecent ? ' recent-bold' : '';

                const popupHTML = `
                    ${flag}<b>${item.name}${recentIcon}</b><br>
                    <div class="popup-list ${boldClass}" data-name="${item.name}" style="cursor: pointer;">
                        <div class="missionary-name">${item.city || '정보없음'}</div>
                        <div class="missionary-org">${item.organization || '정보없음'}</div>
                    </div>
                `;

                // 클러스터에 마커 추가
                this.markerClusterGroup.addLayer(marker);
                this.fixedCountryMarkers.push(marker);
            });

            // 이름 팝업 데이터 저장 (지도 이동 후에 생성)
            markerData.push({ group, latlng: centerLatlng });
        });

        // 사이드바에 해당 국가 선교사 목록 표시
        if (window.UIManager && window.UIManager.openSidebar) {
            window.UIManager.openSidebar(`${country} 선교사 목록`, countryMissionaries);
        } else {
            console.warn('UIManager.openSidebar를 찾을 수 없습니다.');
        }

        this.elements.countryExitBtn.classList.add('visible');
        this.elements.presbyteryExitBtn.classList.add('visible');

        // 국가별 팝업 순환 시작
        // this.startCountryPopupRotation();
    }

    repositionFixedPopups() {
        const country = this.state.fixedCountry;
        if (!country) return;
        const countryMissionaries = this.state.missionaries.filter(item => item.country === country);
        const coordMap = {};
        countryMissionaries.forEach(item => {
            const mLatLng = this.getLatLng(item, country);
            const key = mLatLng.join(',');
            if (!coordMap[key]) coordMap[key] = [];
            coordMap[key].push(item);
        });
        const popupWidth = 200;
        const popupHeight = 120;
        this.fixedCountryPopups.forEach(popup => {
            const key = popup.dataset.coordKey;
            const idx = parseInt(popup.dataset.groupIdx, 10);
            const group = coordMap[key] || [];
            const n = group.length;
            const mLatLng = key.split(',').map(Number);
            const point = this.map.latLngToContainerPoint(mLatLng);
            let yOffset = 0;
            if (n > 1) {
                yOffset = (idx - (n - 1) / 2) * 55;
            }
            popup.style.left = `${point.x - popupWidth / 2}px`;
            popup.style.top = `${point.y + yOffset - popupHeight}px`;
        });
    }

    createFixedPopup(item, latlng, key, idx) {
        const point = this.map.latLngToContainerPoint(latlng);
        const popupWidth = 200; // country-missionary-popup width와 동일
        const popupHeight = 120; // 대략적인 팝업 높이
        const wrapper = document.createElement("div");
        wrapper.className = "floating-missionary-wrapper";
        wrapper.style.left = `${point.x - popupWidth / 2}px`;
        wrapper.style.top = `${point.y - popupHeight}px`;
        wrapper.dataset.latlng = JSON.stringify(latlng);
        wrapper.dataset.coordKey = key;
        wrapper.dataset.groupIdx = idx;
        const contentClass = window.isRecent(item.lastUpdate) ? 'recent' : '';
        wrapper.innerHTML = `
        <div class="floating-missionary-content ${contentClass}" style="pointer-events:all;background:#fffde4;">
            <div class="name" style="cursor:pointer; color:#00509e; font-weight:bold;"
                data-name="${item.name}">${item.name}</div>
        </div>`;
        return wrapper;
    }

    restoreGlobalMode() {
        console.log('전체 보기로 복원');

        // 모든 타이머 정리
        if (this.timers.countryRotation) {
            clearInterval(this.timers.countryRotation);
            this.timers.countryRotation = null;
        }
        if (this.timers.missionaryRotation) {
            clearInterval(this.timers.missionaryRotation);
            this.timers.missionaryRotation = null;
        }

        this.clearFixedCountryElements();
        this.clearMissionaryMarkers();
        this.state.fixedCountry = null;
        this.state.fixedPresbytery = null; // 노회별 보기 상태도 초기화
        this.state.countryMarkerIndex = 0;
        this.state.globalMarkerIndex = 0;
        this.state.missionaryMarkerIndex = 0;
        this.renderGlobalMarkers();
        this.renderMissionaryMarkers();
        this.startIntervals();

        // 종료 버튼 숨기기
        if (this.elements.countryExitBtn) {
            this.elements.countryExitBtn.classList.remove('visible');
        }
        if (this.elements.presbyteryExitBtn) {
            this.elements.presbyteryExitBtn.classList.remove('visible');
        }

        // 사이드바 닫기
        if (window.UIManager && window.UIManager.closeSidebar) {
            window.UIManager.closeSidebar();
        }

        // 지도 뷰 복원
        this.map.setView([20, 0], 2, { animate: true });

        // 전체보기 모드로 돌아왔을 때 기도 팝업 순회 강제 재개
        this.forceResumePrayerRotation();

        // 기도제목 팝업을 비주얼 상태로 설정하여 다시 표시되도록 함
        if (window.prayerPopupManager) {
            window.prayerPopupManager.setVisible();
        }

        console.log('전체 보기 모드로 완전히 복원됨');
    }

    clearFixedCountryElements() {
        this.fixedCountryMarkers.forEach(m => this.map.removeLayer(m));
        this.fixedCountryMarkers = [];
        this.fixedCountryPopups.forEach(div => div.remove());
        this.fixedCountryPopups = [];

        // 선교사 이름 팝업들 정리
        if (this.fixedCountryNamePopups) {
            this.fixedCountryNamePopups.forEach(popup => popup.remove());
            this.fixedCountryNamePopups = [];
        }
        if (this.presbyteryNamePopups) {
            this.presbyteryNamePopups.forEach(popup => popup.remove());
            this.presbyteryNamePopups = [];
        }

        // 추가 안전장치: 모든 선교사 이름 팝업 정리
        this.clearMissionaryNamePopups();
    }

    clearMissionaryMarkers() {
        this.missionaryMarkers.forEach(marker => this.map.removeLayer(marker));
        this.missionaryMarkers = [];
    }

    // 선교사 이름 팝업 생성 (국가별/노회별 보기 모드용)
    createMissionaryNamePopup(missionary, latlng) {
        const point = this.map.latLngToContainerPoint(latlng);

        // 팝업 요소 생성
        const popupElement = document.createElement('div');
        popupElement.className = 'missionary-name-popup';

        // 최근 업데이트된 선교사인지 확인
        const isRecent = window.isRecent(missionary.lastUpdate);
        if (isRecent) {
            popupElement.classList.add('recent');
        }

        popupElement.style.cssText = `
            position: absolute;
            left: ${point.x + 5}px;
            top: ${point.y - 10}px;
        `;

        popupElement.textContent = missionary.name;

        // 클릭 이벤트: 선교사 상세 정보 표시
        popupElement.style.cursor = 'pointer';
        popupElement.addEventListener('click', () => {
            console.log(`선교사 이름 클릭됨: ${missionary.name}`);
            if (window.showDetailPopup) {
                window.showDetailPopup(
                    missionary.name,
                    latlng,
                    this.missionaries,
                    this.elements
                );
            }
        });

        // 지도 컨테이너에 추가
        this.elements.mapContainer.appendChild(popupElement);

        return popupElement;
    }

    // 클러스터 주변에 원형으로 선교사 이름 배치
    createCircularMissionaryNames(missionaries, centerLatlng, clusterRadius = 80) {
        const centerPoint = this.map.latLngToContainerPoint(centerLatlng);
        const namePopups = [];

        // 선교사 수에 따라 반지름 동적 조정
        const baseRadius = 60;
        const radiusIncrement = 10;
        const dynamicRadius = Math.max(baseRadius, baseRadius + (missionaries.length - 1) * radiusIncrement);

        missionaries.forEach((missionary, index) => {
            // 원형 배치를 위한 각도 계산
            const angle = (index / missionaries.length) * 2 * Math.PI;
            const radius = dynamicRadius;

            // 원형 위치 계산
            const x = centerPoint.x + Math.cos(angle) * radius;
            const y = centerPoint.y + Math.sin(angle) * radius;

            // 팝업 요소 생성
            const popupElement = document.createElement('div');
            popupElement.className = 'missionary-name-popup circular';

            // 최근 업데이트된 선교사인지 확인
            const isRecent = window.isRecent(missionary.lastUpdate);
            if (isRecent) {
                popupElement.classList.add('recent');
            }

            // 위치 설정 (원형 배치)
            popupElement.style.cssText = `
                position: absolute;
                left: ${x}px;
                top: ${y}px;
                transform: translate(-50%, -50%);
            `;

            popupElement.textContent = missionary.name;

            // 클릭 이벤트: 선교사 상세 정보 표시
            popupElement.style.cursor = 'pointer';
            popupElement.addEventListener('click', () => {
                console.log(`원형 배치 선교사 이름 클릭됨: ${missionary.name}`);
                if (window.showDetailPopup) {
                    const missionaryLatlng = L.latLng(missionary.lat, missionary.lng);
                    window.showDetailPopup(
                        missionary.name,
                        missionaryLatlng,
                        this.missionaries,
                        this.elements
                    );
                }
            });

            // 지도 컨테이너에 추가
            this.elements.mapContainer.appendChild(popupElement);

            namePopups.push(popupElement);
        });

        return namePopups;
    }

    // 선교사 이름 팝업들 정리
    clearMissionaryNamePopups() {
        const namePopups = document.querySelectorAll('.missionary-name-popup');
        namePopups.forEach(popup => popup.remove());
    }

    // 선교사 이름 팝업 위치 업데이트 (지도 이동/줌 시)
    updateMissionaryNamePopupPositions() {
        if (!this.state.fixedCountry && !this.state.fixedPresbytery) return;

        // 원형 배치된 이름 팝업들의 위치 업데이트
        const circularPopups = document.querySelectorAll('.missionary-name-popup.circular');

        // 국가별/노회별 보기 모드에서 원형 배치된 팝업들을 그룹별로 업데이트
        if (this.state.fixedCountry) {
            // 국가별 보기 모드
            const countryMissionaries = this.state.missionaries.filter(item => item.country === this.state.fixedCountry);
            const coordMap = {};
            countryMissionaries.forEach(item => {
                const mLatLng = this.getLatLng(item, this.state.fixedCountry);
                const key = mLatLng.join(',');
                if (!coordMap[key]) coordMap[key] = [];
                coordMap[key].push(item);
            });

            // 각 좌표 그룹별로 원형 배치 업데이트
            Object.entries(coordMap).forEach(([key, group]) => {
                const latlng = key.split(',').map(Number);
                const centerPoint = this.map.latLngToContainerPoint(latlng);

                // 선교사 수에 따라 반지름 동적 조정
                const baseRadius = 60;
                const radiusIncrement = 10;
                const dynamicRadius = Math.max(baseRadius, baseRadius + (group.length - 1) * radiusIncrement);

                // 해당 그룹의 팝업들을 찾아서 위치 업데이트
                group.forEach((missionary, index) => {
                    const angle = (index / group.length) * 2 * Math.PI;
                    const x = centerPoint.x + Math.cos(angle) * dynamicRadius;
                    const y = centerPoint.y + Math.sin(angle) * dynamicRadius;

                    // 해당 선교사의 팝업 찾기
                    const popup = Array.from(circularPopups).find(p => p.textContent === missionary.name);
                    if (popup) {
                        popup.style.left = `${x}px`;
                        popup.style.top = `${y}px`;
                    }
                });
            });
        } else if (this.state.fixedPresbytery) {
            // 노회별 보기 모드 - 국가별 보기와 동일한 원리로 작동
            const presbyteryMembers = this.state.presbyteryMembers[this.state.fixedPresbytery] || [];
            const coordMap = {};
            presbyteryMembers.forEach(item => {
                const latlng = this.constants.LATLNGS[item.country];
                if (latlng) {
                    const key = latlng.join(',');
                    if (!coordMap[key]) coordMap[key] = [];
                    coordMap[key].push(item);
                }
            });

            // 각 좌표 그룹별로 원형 배치 업데이트
            Object.entries(coordMap).forEach(([key, group]) => {
                const latlng = key.split(',').map(Number);
                const centerPoint = this.map.latLngToContainerPoint(latlng);

                // 선교사 수에 따라 반지름 동적 조정
                const baseRadius = 60;
                const radiusIncrement = 10;
                const dynamicRadius = Math.max(baseRadius, baseRadius + (group.length - 1) * radiusIncrement);

                // 해당 그룹의 팝업들을 찾아서 위치 업데이트
                group.forEach((missionary, index) => {
                    const angle = (index / group.length) * 2 * Math.PI;
                    const x = centerPoint.x + Math.cos(angle) * dynamicRadius;
                    const y = centerPoint.y + Math.sin(angle) * dynamicRadius;

                    // 해당 선교사의 팝업 찾기
                    const popup = Array.from(circularPopups).find(p => p.textContent === missionary.name);
                    if (popup) {
                        popup.style.left = `${x}px`;
                        popup.style.top = `${y}px`;
                    }
                });
            });
        }
    }





    showFloatingListPopup(country, missionaryNames, latlng) {
        // 기도 팝업 중지
        this.stopPrayerRotation();

        // 배경 오버레이 표시
        this.showBackdrop();

        // 기존 플로팅 팝업 제거
        document.querySelectorAll('.floating-popup').forEach(popup => popup.remove());
        document.querySelectorAll('.floating-list-popup').forEach(popup => popup.remove());

        // 국기 URL 생성
        const flagCode = this.constants.COUNTRY_FLAGS[country];
        const flagUrl = flagCode ? `https://flagcdn.com/w40/${flagCode}.png` : '';

        // 플로팅 리스트 팝업 생성
        const popupElement = window.createFloatingListPopup({
            flagUrl: flagUrl,
            country: country,
            missionaryList: missionaryNames
        });

        // 초기 스타일 설정
        popupElement.style.position = 'absolute';
        popupElement.style.zIndex = '1000';
        popupElement.style.visibility = 'hidden'; // 숨김 상태로 추가

        // 지도 컨테이너에 추가 (숨김 상태)
        this.elements.mapContainer.appendChild(popupElement);

        // 실제 크기 측정 (DOM에 추가된 후)
        const popupRect = popupElement.getBoundingClientRect();
        const mapRect = this.elements.mapContainer.getBoundingClientRect();

        // 지도 좌표를 화면 좌표로 변환
        const point = this.map.latLngToContainerPoint(latlng);
        const screenX = mapRect.left + point.x;
        const screenY = mapRect.top + point.y;

        // 초기 위치 계산 (팝업 중앙을 마커에 맞춤)
        let left = point.x - popupRect.width / 2;
        let top = point.y - popupRect.height / 2; // 팝업 중앙이 마커에 위치

        // 화면 경계 보정 (안전한 여백 20px)
        const margin = 20;
        const maxLeft = window.innerWidth - popupRect.width - margin;
        const maxTop = window.innerHeight - popupRect.height - margin;

        // 좌우 보정
        if (left < margin) {
            left = margin;
        } else if (left > maxLeft) {
            left = maxLeft;
        }

        // 상하 보정
        if (top < margin) {
            // 위쪽 공간이 부족하면 아래쪽에 표시
            top = point.y + 20;
            if (top + popupRect.height > window.innerHeight - margin) {
                top = window.innerHeight - popupRect.height - margin;
            }
        } else if (top > maxTop) {
            top = maxTop;
        }

        // 최종 위치 설정
        popupElement.style.left = `${left}px`;
        popupElement.style.top = `${top}px`;

        // 팝업 표시
        popupElement.style.visibility = 'visible';

        // 5초 후 자동 제거 및 오버레이 숨김
        setTimeout(() => {
            if (popupElement.parentNode) {
                popupElement.parentNode.removeChild(popupElement);
                // 오버레이도 숨김
                this.hideBackdrop();
                // 기도 팝업 재개
                this.resumePrayerRotation();
            }
        }, 5000);
    }


    // 플로팅 기도 팝업 표시 (실시간 데이터 사용)
    showFloatingPrayerPopup(missionaryName, latlng) {
        // 기존 플로팅 팝업 제거
        document.querySelectorAll('.floating-popup').forEach(popup => popup.remove());

        // 선교사 정보 찾기
        const missionary = this.state.missionaries.find(m =>
            m.name && m.name.trim() === missionaryName.trim()
        );

        if (!missionary) {
            console.error(`선교사 정보를 찾을 수 없습니다: ${missionaryName}`);
            return;
        }

        // 국기 URL 생성
        const flagCode = this.constants.COUNTRY_FLAGS[missionary.country];
        const flagUrl = flagCode ? `https://flagcdn.com/w40/${flagCode}.png` : '';

        // 플로팅 기도 팝업 생성 (실시간 데이터 사용)
        const popupElement = window.createFloatingPrayerPopup({
            flagUrl: flagUrl,
            name: missionary.name,
            country: missionary.country
        });

        // 초기 스타일 설정
        popupElement.style.position = 'absolute';
        popupElement.style.zIndex = '1000';
        popupElement.style.visibility = 'hidden'; // 숨김 상태로 추가

        // 지도 컨테이너에 추가 (숨김 상태)
        this.elements.mapContainer.appendChild(popupElement);

        // 실제 크기 측정 (DOM에 추가된 후)
        const popupRect = popupElement.getBoundingClientRect();
        const mapRect = this.elements.mapContainer.getBoundingClientRect();

        // 지도 좌표를 화면 좌표로 변환
        const point = this.map.latLngToContainerPoint(latlng);
        const screenX = mapRect.left + point.x;
        const screenY = mapRect.top + point.y;

        // 초기 위치 계산 (팝업 중앙을 마커에 맞춤)
        let left = point.x - popupRect.width / 2;
        let top = point.y - popupRect.height / 2; // 팝업 중앙이 마커에 위치

        // 화면 경계 보정 (안전한 여백 20px)
        const margin = 20;
        const maxLeft = window.innerWidth - popupRect.width - margin;
        const maxTop = window.innerHeight - popupRect.height - margin;

        // 좌우 보정
        if (left < margin) {
            left = margin;
        } else if (left > maxLeft) {
            left = maxLeft;
        }

        // 상하 보정
        if (top < margin) {
            // 위쪽 공간이 부족하면 아래쪽에 표시
            top = point.y + 20;
            if (top + popupRect.height > window.innerHeight - margin) {
                top = window.innerHeight - popupRect.height - margin;
            }
        } else if (top > maxTop) {
            top = maxTop;
        }

        // 최종 위치 설정
        popupElement.style.left = `${left}px`;
        popupElement.style.top = `${top}px`;

        // 팝업 표시
        popupElement.style.visibility = 'visible';

        // 5초 후 자동 제거
        setTimeout(() => {
            if (popupElement.parentNode) {
                popupElement.parentNode.removeChild(popupElement);
            }
        }, 5000);
    }

    toggleAnimation() {
        this.state.isAnimOn = !this.state.isAnimOn;
        this.elements.titleLogo.classList.toggle('anim-off', !this.state.isAnimOn);
    }

    toggleFullscreenButtons() {
        if (document.fullscreenElement) {
            this.elements.fullscreenBtn.classList.add('hidden');
            this.elements.exitFullscreenBtn.classList.remove('hidden');
        } else {
            this.elements.fullscreenBtn.classList.remove('hidden');
            this.elements.exitFullscreenBtn.classList.add('hidden');
        }
    }

    setAutoplayMode(mode) {
        console.log('MissionaryMap: 자동재생 모드 변경:', mode);

        // 기존 타이머 정리
        if (this.timers.rotation) {
            clearInterval(this.timers.rotation);
        }

        // 새로운 모드 설정
        this.state.autoplayMode = mode;

        // 모드에 따른 타이머 재시작
        if (mode === 'fixed') {
            // 지도 고정 모드: 기도제목 로테이션
            this.timers.rotation = setInterval(() => this.rotateGlobalPopups(), this.constants.POPUP_ROTATE_INTERVAL);
        } else if (mode === 'pan') {
            // 지도 자동 이동 모드: 간단한 팝업만 표시
            this.timers.rotation = setInterval(() => this.rotateSimplePopups(), this.constants.POPUP_ROTATE_INTERVAL);
        }

        // 현재 열린 팝업이 있다면 새 모드로 업데이트
        this.updateCurrentPopupMode();
    }

    rotateSimplePopups() {
        if (this.state.isPaused || this.state.fixedCountry) return;

        // 간단한 팝업만 표시 (기도제목 없이)
        this.globalMarkers.forEach((marker, index) => {
            const country = Object.keys(this.state.countryStats)[index];
            if (country) {
                const stats = this.state.countryStats[country];
                const flag = this.constants.COUNTRY_FLAGS[country] ?
                    `<img class='flag-icon' src='https://flagcdn.com/w40/${this.constants.COUNTRY_FLAGS[country]}.png'>` : "";

                const simpleContent = `${flag}<b>${country}</b><br>${stats.names.join(', ')}`;
                marker.getPopup().setContent(simpleContent);
            }
        });
    }

    updateCurrentPopupMode() {
        // 현재 열린 팝업이 있다면 모드에 맞게 업데이트
        const openPopup = document.querySelector('.leaflet-popup');
        if (openPopup && this.state.autoplayMode === 'pan') {
            // 간단한 모드로 업데이트
            const popupContent = openPopup.querySelector('.leaflet-popup-content');
            if (popupContent) {
                // 기존 기도제목 관련 내용 제거
                const prayerElements = popupContent.querySelectorAll('.prayer-topic, .prayer-content');
                prayerElements.forEach(el => el.style.display = 'none');
            }
        }
    }

    // 기도제목 로테이션 시작
    startPrayerTopicRotation(popup) {
        if (this.prayerRotationTimer) {
            clearInterval(this.prayerRotationTimer);
        }

        this.prayerRotationTimer = setInterval(() => {
            if (popup && popup.getElement()) {
                const popupContent = popup.getElement().querySelector('.leaflet-popup-content');
                if (popupContent) {
                    const prayerElements = popupContent.querySelectorAll('.prayer-topic');
                    if (prayerElements.length > 1) {
                        const currentIndex = Array.from(prayerElements).findIndex(el => !el.style.display || el.style.display !== 'none');
                        const nextIndex = (currentIndex + 1) % prayerElements.length;

                        prayerElements.forEach((el, index) => {
                            el.style.display = index === nextIndex ? 'block' : 'none';
                        });
                    }
                }
            }
        }, 3000);
    }

    // 기도제목 로테이션 중지
    stopPrayerTopicRotation() {
        if (this.prayerRotationTimer) {
            clearInterval(this.prayerRotationTimer);
            this.prayerRotationTimer = null;
        }
    }

    // 위도/경도 가져오기 함수
    getLatLng(item, country) {
        if (item.lat && item.lng) {
            return [parseFloat(item.lat), parseFloat(item.lng)];
        }
        if (item.latitude && item.longitude) {
            return [parseFloat(item.latitude), parseFloat(item.longitude)];
        }
        return this.constants.LATLNGS[country] || [0, 0];
    }

    showNewsletter(newsletterUrlEncoded) {
        if (window.showNewsletter) {
            window.showNewsletter(newsletterUrlEncoded);
        }
    }

    // 상세 팝업 표시 함수 (UIManager가 없을 때 fallback)
    showDetailPopup(missionaryName, latlng) {
        console.log('MissionaryMap.showDetailPopup 호출:', missionaryName, latlng);

        // 선교사 정보 찾기
        const missionary = this.state.missionaries.find(m =>
            m.name && m.name.trim() === missionaryName.trim()
        );

        if (!missionary) {
            console.error(`선교사 정보를 찾을 수 없습니다: ${missionaryName}`);
            alert(`선교사 정보를 찾을 수 없습니다: ${missionaryName}`);
            return;
        }

        // UIManager가 있으면 UIManager 사용
        if (window.UIManager && window.UIManager.showDetailPopup) {
            window.UIManager.showDetailPopup(missionaryName, latlng);
            return;
        }

        // UIManager가 없으면 간단한 alert로 표시
        const city = missionary.city && missionary.city.trim() ? missionary.city.trim() : '';
        const location = city ? `${missionary.country} · ${city}` : missionary.country;
        const prayerTopic = missionary.prayerTopic || missionary.summary || '기도제목이 없습니다.';

        alert(`선교사 상세 정보\n\n이름: ${missionary.name}\n위치: ${location}\n기관: ${missionary.organization || '정보없음'}\n파송년도: ${missionary.dispatchDate || '정보없음'}\n최근 업데이트: ${missionary.lastUpdate || '정보없음'}\n\n기도제목:\n${prayerTopic}`);
    }

    initPrayerCount() {
        // Firebase가 로드된 후 중보기도자 수 기능 초기화
        const initPrayerCountWithRetry = () => {
            if (window.firebase && window.initPrayerCount) {
                try {
                    window.initPrayerCount(window.firebase, (count) => {
                        console.log('중보기도자 수 업데이트:', count);
                    });
                    return true;
                } catch (error) {
                    console.error('중보기도자 수 기능 초기화 실패:', error);
                    return false;
                }
            } else {
                console.warn('Firebase 또는 initPrayerCount 함수가 로드되지 않았습니다.');
                return false;
            }
        };

        // DOM이 완전히 로드된 후 시도
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                setTimeout(initPrayerCountWithRetry, 100);
            });
        } else {
            // 즉시 시도
            if (!initPrayerCountWithRetry()) {
                // 실패하면 1초 후 재시도
                setTimeout(() => {
                    if (!initPrayerCountWithRetry()) {
                        // 2번째 실패하면 2초 후 재시도
                        setTimeout(() => {
                            initPrayerCountWithRetry();
                        }, 2000);
                    }
                }, 1000);
            }
        }
    }

    // PrayerClick 모듈 초기화
    async initPrayerClick() {
        try {
            // Firebase가 완전히 로드될 때까지 대기
            let retryCount = 0;
            const maxRetries = 10;

            while (retryCount < maxRetries) {
                if (window.firebase && window.firebase.database && window.initializePrayerClick) {
                    await window.initializePrayerClick();
                    return;
                }
                await new Promise(resolve => setTimeout(resolve, 500));
                retryCount++;
            }

            console.warn('PrayerClick 모듈 초기화 시간 초과 또는 모듈을 찾을 수 없습니다.');
        } catch (error) {
            console.error('PrayerClick 모듈 초기화 실패:', error);
        }
    }

    // 기도 팝업 순회 시작
    startPrayerRotation() {
        if (window.startPrayerRotation) {
            window.startPrayerRotation();
        }
    }

    // 기도 팝업 순회 중지
    stopPrayerRotation() {
        if (window.stopPrayerRotation) {
            window.stopPrayerRotation();
        }
    }

    // 기도 팝업 순회 일시정지
    pausePrayerRotation() {
        if (window.prayerPopupManager) {
            window.prayerPopupManager.forcePause();
        }
    }

    // 기도 팝업 순회 재개
    resumePrayerRotation() {
        if (window.prayerPopupManager) {
            window.prayerPopupManager.forceResume();
        }
    }

    // 기도 팝업 순회 강제 중지 (국가별/노회별 모드 진입 시 사용)
    forceStopPrayerRotation() {
        if (window.prayerPopupManager) {
            // 인비주얼 상태로 설정 (팝업 숨김)
            window.prayerPopupManager.setInvisible();

            console.log('기도 팝업 인비주얼 상태로 설정 완료');
        }
    }

    // 기도 팝업 순회 강제 재개 (자세히 보기 종료 시 사용)
    forceResumePrayerRotation() {
        if (window.prayerPopupManager) {
            // 비주얼 상태로 설정 (팝업 표시)
            window.prayerPopupManager.setVisible();

            // 만약 기도 팝업이 실행 중이지 않다면 시작
            if (!window.prayerPopupManager.isRunning) {
                window.prayerPopupManager.startRotation();
            }

            // 즉시 다음 팝업 표시 (200ms 후)
            setTimeout(() => {
                if (window.prayerPopupManager && window.prayerPopupManager.isRunning) {
                    window.prayerPopupManager.showNextPrayerPopup();
                }
            }, 200);

            console.log('기도 팝업 비주얼 상태로 설정 완료 및 즉시 표시');
        }
    }

    // 노회별 보기 종료
    exitPresbyteryView() {
        // 전체보기 모드로 완전히 복원 (기도 순환 포함)
        this.restoreGlobalMode();
    }

    // 국가별 보기 종료
    exitCountryView() {
        // 전체보기 모드로 완전히 복원 (기도 순환 포함)
        this.restoreGlobalMode();
    }



    renderMissionaryMarkers() {
        // 기존 선교사 마커들 제거
        this.missionaryMarkers.forEach(marker => this.map.removeLayer(marker));
        this.missionaryMarkers = [];

        // 모든 선교사에 대해 개별 마커 생성
        this.state.missionaries.forEach(missionary => {
            if (missionary.name && missionary.country) {
                const latlng = this.getLatLng(missionary, missionary.country);

                // 선교사별 개별 마커 생성
                const marker = L.marker(latlng, {
                    icon: L.divIcon({
                        className: 'missionary-individual-marker',
                        html: '<div class="missionary-marker-icon">👤</div>',
                        iconSize: [20, 20],
                        iconAnchor: [10, 10]
                    })
                });

                // 팝업 내용 생성
                const flag = this.constants.COUNTRY_FLAGS[missionary.country] ?
                    `<img class='flag-icon' src='https://flagcdn.com/w40/${this.constants.COUNTRY_FLAGS[missionary.country]}.png'>` : "";
                const isRecent = window.isRecent(missionary.lastUpdate);
                const recentIcon = isRecent ? ' <span class="recent-badge" title="최근 소식">📰✨</span>' : '';

                // 기도제목을 최근 뉴스레터의 요약 필드에서 가져오기 (요약이 있으면 요약, 없으면 기도제목)
                const prayerTopic = missionary.summary && missionary.summary.trim() !== ''
                    ? missionary.summary
                    : (missionary.prayerTopic && missionary.prayerTopic.trim() !== ''
                        ? missionary.prayerTopic
                        : '기도제목 정보 없음');

                const popupHTML = `
                    <div class="missionary-popup-content">
                        <div class="missionary-popup-header">
                            ${flag}<b class="missionary-popup-name">${missionary.name}${recentIcon}</b> (${missionary.country})
                        </div>
                        <div class="missionary-popup-prayer">${prayerTopic}</div>
                    </div>
                `;



                // 마커를 지도에 추가 (숨김 상태로)
                marker.addTo(this.map);
                marker.getElement().style.display = 'none'; // 초기에는 숨김
                this.missionaryMarkers.push(marker);
            }
        });

        console.log('선교사별 개별 마커 생성 완료:', this.missionaryMarkers.length, '개');
    }

    // 배경 오버레이 표시
    showBackdrop() {
        const backdrop = document.getElementById('popup-backdrop');
        if (backdrop) {
            backdrop.classList.remove('hidden');
            backdrop.classList.add('visible');
            console.log('배경 오버레이 표시');
        }
    }

    // 배경 오버레이 숨김
    hideBackdrop() {
        const backdrop = document.getElementById('popup-backdrop');
        if (backdrop) {
            backdrop.classList.remove('visible');
            backdrop.classList.add('hidden');
            console.log('배경 오버레이 숨김');
        }
    }

    // 오버레이 클릭 이벤트 초기화 (init 메서드에서 호출)
    initBackdropClick() {
        const backdrop = document.getElementById('popup-backdrop');
        if (backdrop) {
            backdrop.addEventListener('click', () => {
                console.log('배경 오버레이 클릭 - 모든 팝업 닫기');

                // 플로팅 팝업 제거
                document.querySelectorAll('.floating-list-popup').forEach(p => p.remove());
                document.querySelectorAll('.floating-popup').forEach(p => p.remove());

                // 디테일 팝업 닫기
                const detailPopup = document.getElementById('detailPopup');
                if (detailPopup) {
                    detailPopup.innerHTML = '';
                }

                // 오버레이 숨김
                this.hideBackdrop();

                // 기도 팝업 재개
                this.resumePrayerRotation();
            });
        }
    }


}

// 인스턴스 생성 및 전역 객체에 할당
const missionaryMap = new MissionaryMap();
window.missionaryMapInstance = missionaryMap; 