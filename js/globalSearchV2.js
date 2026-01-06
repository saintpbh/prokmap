console.log('GlobalSearch v2.0 시작');

/**
 * 새로운 글로벌 검색 시스템
 * - 상단 고정 검색바
 * - 실시간 검색
 * - 깔끔한 드롭다운 결과
 */
class GlobalSearchV2 {
    constructor() {
        this.searchBar = document.getElementById('global-search-bar');
        this.searchInput = document.getElementById('global-search-input');
        this.clearBtn = document.getElementById('global-search-clear');
        this.resultsContainer = document.getElementById('global-search-results');
        this.resultCount = document.getElementById('search-result-count');
        this.resultCountText = document.getElementById('result-count-text');
        this.titleLogo = document.getElementById('titleLogo');
        this.titleCloseBtn = document.getElementById('title-close-btn'); // 타이틀 끄기 버튼

        this.currentResults = [];
        this.selectedIndex = -1;
        this.debounceTimer = null;
        this.isSearchMode = false; // 검색 모드 상태

        this.init();
    }

    init() {
        if (!this.searchInput) {
            console.error('GlobalSearchV2: 검색 입력 요소를 찾을 수 없습니다.');
            return;
        }

        this.setupEvents();
        console.log('GlobalSearchV2: 초기화 완료');
    }

    setupEvents() {
        // 실시간 검색 (디바운스 300ms)
        this.searchInput.addEventListener('input', (e) => {
            const query = e.target.value.trim();

            // 클리어 버튼 표시/숨김
            if (query) {
                this.clearBtn.style.display = 'flex';
            } else {
                this.clearBtn.style.display = 'none';
                this.hideResults();
            }

            // 디바운스 적용
            clearTimeout(this.debounceTimer);
            this.debounceTimer = setTimeout(() => {
                this.performSearch(query);
            }, 300);
        });

        // 클리어 버튼
        this.clearBtn.addEventListener('click', () => {
            this.searchInput.value = '';
            this.clearBtn.style.display = 'none';
            this.hideResults();
            this.searchInput.focus();
        });

        // 키보드 네비게이션
        this.searchInput.addEventListener('keydown', (e) => {
            if (this.currentResults.length === 0) return;

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                this.selectedIndex = Math.min(this.selectedIndex + 1, this.currentResults.length - 1);
                this.highlightResult();
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                this.selectedIndex = Math.max(this.selectedIndex - 1, -1);
                this.highlightResult();
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (this.selectedIndex >= 0 && this.currentResults[this.selectedIndex]) {
                    this.selectResult(this.currentResults[this.selectedIndex]);
                }
            } else if (e.key === 'Escape') {
                this.hideResults();
                this.searchInput.blur();
            }
        });

        // 외부 클릭 시 결과 숨김
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.global-search-bar')) {
                this.hideResults();
            }
        });

        // 타이틀 클릭 시 검색창 토글
        if (this.titleLogo) {
            this.titleLogo.addEventListener('click', (e) => {
                // 끄기 버튼 클릭 시는 아무 일도 하지 않음
                if (e.target.closest('.title-close-btn')) {
                    return;
                }
                this.toggleSearchBar();
            });
        }

        // 타이틀 끄기 버튼 클릭
        if (this.titleCloseBtn) {
            this.titleCloseBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // 타이틀 클릭 이벤트 방지
                this.hideSearchBar();
            });
        }

        // 클리어 버튼 클릭 시 검색창 닫기도 함께 처리
        const originalClearHandler = this.clearBtn.onclick;
        this.clearBtn.addEventListener('click', () => {
            this.searchInput.value = '';
            this.clearBtn.style.display = 'none';
            this.hideResults();
            this.hideSearchBar(); // 검색창도 닫기
        });
    }

    // 검색창 토글
    toggleSearchBar() {
        if (this.isSearchMode) {
            this.hideSearchBar();
        } else {
            this.showSearchBar();
        }
    }

    // 검색창 표시
    showSearchBar() {
        if (this.searchBar) {
            this.searchBar.classList.remove('hidden');
            this.isSearchMode = true;

            // 타이틀 끄기 버튼 표시
            if (this.titleCloseBtn) {
                this.titleCloseBtn.classList.remove('hidden');
            }

            // 검색 모드 진입 시 기도 팝업 중지
            if (window.MissionaryMap && typeof window.MissionaryMap.stopPrayerRotation === 'function') {
                window.MissionaryMap.stopPrayerRotation();
                console.log('GlobalSearchV2: 검색 모드 진입 - 기도 팝업 중지');
            }

            // 검색창에 포커스
            setTimeout(() => {
                this.searchInput.focus();
            }, 100);
        }
    }

    // 검색창 숨김
    hideSearchBar() {
        if (this.searchBar) {
            this.searchBar.classList.add('hidden');
            this.isSearchMode = false;

            // 타이틀 끄기 버튼 숨김
            if (this.titleCloseBtn) {
                this.titleCloseBtn.classList.add('hidden');
            }

            // 검색 내용 초기화
            this.searchInput.value = '';
            this.clearBtn.style.display = 'none';
            this.hideResults();

            // 검색 모드 종료 시 기도 팝업 재개
            if (window.MissionaryMap && typeof window.MissionaryMap.resumePrayerRotation === 'function') {
                window.MissionaryMap.resumePrayerRotation();
                console.log('GlobalSearchV2: 검색 모드 종료 - 기도 팝업 재개');
            }
        }
    }

    performSearch(query) {
        if (!query) {
            this.hideResults();
            return;
        }

        // DataManager에서 선교사 데이터 가져오기
        if (!window.DataManager || !window.DataManager.state || !window.DataManager.state.missionaries) {
            console.warn('GlobalSearchV2: DataManager 또는 missionaries 데이터를 찾을 수 없습니다.');
            this.showNoResults();
            return;
        }

        const missionaries = window.DataManager.state.missionaries;
        const lowerQuery = query.toLowerCase();

        console.log(`GlobalSearchV2: 검색 시작 - 총 ${missionaries.length}명의 선교사 데이터에서 "${query}" 검색`);

        // 검색 수행
        const results = missionaries.filter(m => {
            const name = (m.name || '').toLowerCase();
            const country = (m.country || '').toLowerCase();
            const city = (m.city || '').toLowerCase();
            const presbytery = (m.presbytery || '').toLowerCase();
            const organization = (m.organization || '').toLowerCase();

            return name.includes(lowerQuery) ||
                country.includes(lowerQuery) ||
                city.includes(lowerQuery) ||
                presbytery.includes(lowerQuery) ||
                organization.includes(lowerQuery);
        }).slice(0, 10); // 최대 10개

        this.currentResults = results;
        this.selectedIndex = -1;

        console.log(`GlobalSearchV2: "${query}" 검색 결과: ${results.length}명`);

        if (results.length > 0) {
            this.displayResults(results, query);
        } else {
            this.showNoResults();
        }
    }

    displayResults(results, query) {
        // 결과 수 표시
        this.resultCountText.textContent = `${results.length}명`;
        this.resultCount.style.display = 'block';

        // 결과 목록 렌더링
        this.resultsContainer.innerHTML = results.map((missionary, index) => {
            const flag = this.getCountryFlag(missionary.country);
            const highlightedName = this.highlightText(missionary.name, query);
            const location = `${missionary.country}${missionary.city ? ', ' + missionary.city : ''}`;
            const highlightedLocation = this.highlightText(location, query);

            return `
                <div class="search-result-item" data-index="${index}">
                    <div class="search-result-flag">${flag}</div>
                    <div class="search-result-info">
                        <div class="search-result-name">
                            ${highlightedName}
                            ${missionary.presbytery ? `<span class="search-result-badge">${missionary.presbytery}</span>` : ''}
                        </div>
                        <div class="search-result-location">
                            📍 ${highlightedLocation}
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        // 결과 표시
        this.resultsContainer.style.display = 'block';

        // 클릭 이벤트
        this.resultsContainer.querySelectorAll('.search-result-item').forEach((item, index) => {
            item.addEventListener('click', () => {
                this.selectResult(results[index]);
            });

            item.addEventListener('mouseenter', () => {
                this.selectedIndex = index;
                this.highlightResult();
            });
        });
    }

    highlightResult() {
        const items = this.resultsContainer.querySelectorAll('.search-result-item');
        items.forEach((item, index) => {
            if (index === this.selectedIndex) {
                item.style.background = 'linear-gradient(90deg, rgba(102, 126, 234, 0.12), rgba(118, 75, 162, 0.12))';
                item.style.transform = 'translateX(4px)';
            } else {
                item.style.background = '';
                item.style.transform = '';
            }
        });
    }

    selectResult(missionary) {
        console.log('GlobalSearchV2: 선교사 선택:', missionary.name);

        // 지도 이동
        if (window.MissionaryMap && window.MissionaryMap.map && missionary.lat && missionary.lng) {
            window.MissionaryMap.map.flyTo([missionary.lat, missionary.lng], 8, {
                duration: 1.0,
                easeLinearity: 0.25
            });

            // 마커 강조
            setTimeout(() => {
                this.highlightMarker(missionary.name);
            }, 500);
        }

        // 상세 팝업 표시
        if (window.showDetailPopup && missionary.lat && missionary.lng) {
            setTimeout(() => {
                const elements = {
                    detailPopup: document.getElementById('detailPopup'),
                    mapContainer: document.getElementById('map')
                };

                const missionaryInfo = {};
                if (window.DataManager && window.DataManager.state && window.DataManager.state.missionaries) {
                    window.DataManager.state.missionaries.forEach(m => {
                        missionaryInfo[m.name] = m;
                    });
                }

                window.showDetailPopup(missionary.name, { lat: missionary.lat, lng: missionary.lng }, missionaryInfo, elements);
            }, 1000);
        }

        // 검색 결과 숨김
        this.hideResults();
    }

    highlightMarker(name) {
        if (!window.MissionaryMap || !window.MissionaryMap.globalMarkers) return;

        // 모든 마커 초기화
        window.MissionaryMap.globalMarkers.forEach(marker => {
            const el = marker.getElement();
            if (el) {
                el.style.filter = '';
                el.style.transform = '';
                el.style.zIndex = '';
            }
        });

        // 해당 마커 찾기 및 강조 (오렌지색)
        const marker = window.MissionaryMap.globalMarkers.find(m => {
            const popup = m.getPopup();
            return popup && popup.getContent() && popup.getContent().includes(name);
        });

        if (marker) {
            const el = marker.getElement();
            if (el) {
                // 오렌지색 그림자로 변경
                el.style.filter = 'drop-shadow(0 0 16px rgba(255, 140, 0, 0.9)) brightness(1.3)';
                el.style.transform = 'scale(1.4)';
                el.style.zIndex = '9999';

                // 5초 후 원래대로
                setTimeout(() => {
                    el.style.filter = '';
                    el.style.transform = '';
                    el.style.zIndex = '';
                }, 5000);
            }
        }
    }

    showNoResults() {
        this.resultCount.style.display = 'none';
        this.resultsContainer.innerHTML = `
            <div class="search-no-results">
                <div class="search-no-results-icon">🔍</div>
                <div class="search-no-results-text">검색 결과가 없습니다</div>
                <div class="search-no-results-hint">다른 검색어를 입력해보세요</div>
            </div>
        `;
        this.resultsContainer.style.display = 'block';
        this.currentResults = [];
    }

    hideResults() {
        this.resultsContainer.style.display = 'none';
        this.resultCount.style.display = 'none';
        this.selectedIndex = -1;
        this.currentResults = [];
    }

    highlightText(text, query) {
        if (!text || !query) return text;

        const regex = new RegExp(`(${this.escapeRegex(query)})`, 'gi');
        return text.replace(regex, '<span class="search-highlight">$1</span>');
    }

    escapeRegex(str) {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    getCountryFlag(country) {
        const flags = {
            '네팔': '🇳🇵',
            '케냐': '🇰🇪',
            '필리핀': '🇵🇭',
            '태국': '🇹🇭',
            '미얀마': '🇲🇲',
            '캄보디아': '🇰🇭',
            '라오스': '🇱🇦',
            '베트남': '🇻🇳',
            '인도네시아': '🇮🇩',
            '방글라데시': '🇧🇩',
            '인도': '🇮🇳',
            '우간다': '🇺🇬',
            '탄자니아': '🇹🇿',
            '르완다': '🇷🇼',
            '말라위': '🇲🇼',
            '에티오피아': '🇪🇹',
            '짐바브웨': '🇿🇼',
            '페루': '🇵🇪',
            '볼리비아': '🇧🇴',
            '브라질': '🇧🇷',
            '멕시코': '🇲🇽',
            '과테말라': '🇬🇹',
            '아르헨티나': '🇦🇷',
            '칠레': '🇨🇱',
            '중국': '🇨🇳',
            '일본': '🇯🇵',
            '몽골': '🇲🇳',
            '카자흐스탄': '🇰🇿',
            '우즈베키스탄': '🇺🇿',
            '키르기스스탄': '🇰🇬',
            '러시아': '🇷🇺',
            '독일': '🇩🇪',
            '영국': '🇬🇧',
            '프랑스': '🇫🇷',
            '이탈리아': '🇮🇹',
            '스페인': '🇪🇸',
            '터키': '🇹🇷',
            '이스라엘': '🇮🇱',
            '요르단': '🇯🇴',
            '레바논': '🇱🇧',
            '알바니아': '🇦🇱',
            '호주': '🇦🇺',
            '뉴질랜드': '🇳🇿',
            '미국': '🇺🇸',
            '캐나다': '🇨🇦',
            'default': '🌍'
        };

        return flags[country] || flags['default'];
    }
}

// DOM 로드 후 초기화
document.addEventListener('DOMContentLoaded', () => {
    // DataManager가 준비될 때까지 대기
    const initSearch = () => {
        if (window.DataManager && window.DataManager.state && window.DataManager.state.missionaries && window.DataManager.state.missionaries.length > 0) {
            window.globalSearchV2 = new GlobalSearchV2();
            console.log(`GlobalSearchV2: 시스템 준비 완료 (${window.DataManager.state.missionaries.length}명의 선교사 데이터 로드됨)`);
        } else {
            console.log('GlobalSearchV2: DataManager 대기 중...');
            setTimeout(initSearch, 500);
        }
    };

    setTimeout(initSearch, 1000);
});

console.log('GlobalSearch v2.0 파일 로드 완료');
