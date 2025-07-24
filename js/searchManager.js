// searchManager.js - 고도화된 선교사 검색 기능
const SearchManager = {
    state: {
        isSearchMode: false,
        searchResults: [],
        selectedIndex: -1,
        searchTerm: '',
        highlightedMarkers: []
    },
    
    elements: {
        titleLogo: document.getElementById('titleLogo'),
        titleFlipInner: null,
        searchInput: null,
        searchResults: null,
        map: document.getElementById('map')
    },

    // 디바운스 함수
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    // 초기화
    init() {
        console.log('SearchManager: Initializing...');
        
        // DOM 요소들 재할당 (DOM이 로드된 후)
        this.elements.titleFlipInner = document.querySelector('.title-flip-inner');
        this.elements.searchInput = document.getElementById('missionary-search');
        this.elements.searchResults = document.getElementById('search-results');
        
        console.log('SearchManager: DOM elements:', {
            titleFlipInner: this.elements.titleFlipInner,
            searchInput: this.elements.searchInput,
            searchResults: this.elements.searchResults
        });
        
        this.initEventListeners();
        this.debouncedSearch = this.debounce((term) => this.performSearch(term), 300);
        
        console.log('SearchManager: Initialization complete');
    },

    // 이벤트 리스너 초기화 (검색 입력 이벤트만)
    initEventListeners() {
        // DOM 요소들이 존재하는지 확인
        if (!this.elements.searchInput || !this.elements.searchResults) {
            console.error('SearchManager: Required DOM elements not found');
            return;
        }

        // 검색 입력 이벤트 (Shoelace와 일반 input 이벤트 모두 처리)
        const handleSearchInput = (e) => {
            // Shoelace 컴포넌트의 경우 e.target.value 또는 e.detail.value 사용
            const term = (e.target.value || e.detail?.value || '').trim();
            console.log('SearchManager: search input changed:', term, 'Event:', e);
            this.state.searchTerm = term;
            if (term.length > 0) {
                this.debouncedSearch(term);
            } else {
                this.clearResults();
            }
        };
        
        this.elements.searchInput.addEventListener('sl-input', handleSearchInput);
        this.elements.searchInput.addEventListener('input', handleSearchInput);
        this.elements.searchInput.addEventListener('keyup', handleSearchInput);

        // 키보드 네비게이션
        this.elements.searchInput.addEventListener('keydown', (e) => {
            this.handleKeyNavigation(e);
        });

        // ESC 키로 검색 모드 종료
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.state.isSearchMode) {
                this.exitSearchMode();
            }
        });

        // 외부 클릭으로 검색 모드 종료
        document.addEventListener('click', (e) => {
            if (this.state.isSearchMode && !this.elements.titleLogo.contains(e.target)) {
                this.exitSearchMode();
            }
        });
    },

    // 검색 모드 진입
    enterSearchMode() {
        this.state.isSearchMode = true;
        this.elements.titleFlipInner.classList.add('flipped');
        this.elements.map.classList.add('search-mode');
        
        // 애니메이션 일시정지
        if (window.MissionaryMap) {
            window.MissionaryMap.state.isPaused = true;
        }

        // 검색창에 포커스 (애니메이션 완료 후)
        setTimeout(() => {
            this.elements.searchInput.focus();
        }, 400);
    },

    // 검색 모드 종료
    exitSearchMode() {
        this.state.isSearchMode = false;
        this.state.selectedIndex = -1;
        this.elements.titleFlipInner.classList.remove('flipped');
        this.elements.map.classList.remove('search-mode');
        this.clearResults();
        this.clearHighlights();
        this.elements.searchInput.value = '';

        // 애니메이션 재개
        if (window.MissionaryMap && !window.MissionaryMap.state.fixedCountry && !window.MissionaryMap.state.activePresbytery) {
            window.MissionaryMap.state.isPaused = false;
        }
    },

    // 퍼지 검색 수행
    performSearch(term) {
        console.log('SearchManager: performSearch called with term:', term);
        
        if (!window.DataManager || !window.DataManager.state.missionaries) {
            console.log('SearchManager: DataManager or missionaries not available');
            return;
        }

        const missionaries = window.DataManager.state.missionaries;
        console.log('SearchManager: missionaries count:', missionaries.length);
        console.log('SearchManager: sample missionary:', missionaries[0]);
        
        const results = this.fuzzySearch(term, missionaries);
        console.log('SearchManager: search results:', results);
        
        this.state.searchResults = results;
        this.renderSearchResults(results);
        this.highlightMatchingMarkers(results);
    },

    // 퍼지 검색 알고리즘
    fuzzySearch(term, missionaries) {
        const searchTerm = term.toLowerCase();
        
        return missionaries.map(missionary => {
            const score = this.calculateMatchScore(searchTerm, missionary);
            return { ...missionary, score };
        })
        .filter(missionary => missionary.score > 0.1)
        .sort((a, b) => b.score - a.score)
        .slice(0, 10); // 최대 10개 결과
    },

    // 매치 점수 계산
    calculateMatchScore(searchTerm, missionary) {
        let score = 0;
        
        // 이름 매치 (가중치 높음)
        if (missionary.name && missionary.name.toLowerCase().includes(searchTerm)) {
            score += 1.0;
            // 정확한 매치에 보너스
            if (missionary.name.toLowerCase() === searchTerm) {
                score += 0.5;
            }
        }

        // 국가 매치
        if (missionary.country && missionary.country.toLowerCase().includes(searchTerm)) {
            score += 0.8;
        }

        // 도시 매치
        if (missionary.city && missionary.city.toLowerCase().includes(searchTerm)) {
            score += 0.6;
        }

        // 기관 매치
        if (missionary.organization && missionary.organization.toLowerCase().includes(searchTerm)) {
            score += 0.7;
        }

        // 노회 매치
        if (missionary.presbytery && missionary.presbytery.toLowerCase().includes(searchTerm)) {
            score += 0.5;
        }

        // 부분 매치 보너스 (이름의 일부가 매치되는 경우)
        if (missionary.name) {
            const nameWords = missionary.name.toLowerCase().split(' ');
            nameWords.forEach(word => {
                if (word.startsWith(searchTerm)) {
                    score += 0.3;
                }
            });
        }

        return score;
    },

    // 검색 결과 렌더링
    renderSearchResults(results) {
        console.log('SearchManager: renderSearchResults called with results:', results);
        console.log('SearchManager: searchResults element:', this.elements.searchResults);
        
        if (results.length === 0) {
            this.elements.searchResults.innerHTML = '<div class="search-no-results">검색 결과가 없습니다.</div>';
        } else {
            const resultsHTML = results.map((missionary, index) => {
                const isRecent = window.isRecent && window.isRecent(missionary.lastUpdate);
                const recentBadge = isRecent ? '<span class="sidebar-recent-badge">NEW</span>' : '';
                const city = missionary.city && missionary.city.trim() ? missionary.city.trim() : '';
                const location = city ? `${missionary.country} · ${city}` : missionary.country;
                const avatarText = missionary.name ? missionary.name.charAt(0) : '?';
                const highlightedName = this.highlightSearchTerm(missionary.name, this.state.searchTerm);
                const highlightedLocation = this.highlightSearchTerm(location, this.state.searchTerm);
                
                return `
                    <div class="search-result-item" data-index="${index}" data-name="${missionary.name}">
                        <div class="search-result-avatar">${avatarText}</div>
                        <div class="search-result-info">
                            <div class="search-result-name">
                                ${highlightedName}
                                ${recentBadge}
                            </div>
                            <div class="search-result-location">
                                <sl-icon name="geo-alt-fill"></sl-icon>
                                ${highlightedLocation}
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
            
            this.elements.searchResults.innerHTML = resultsHTML;
            
            // 클릭 이벤트 추가
            this.elements.searchResults.querySelectorAll('.search-result-item').forEach(item => {
                item.addEventListener('click', () => {
                    const name = item.dataset.name;
                    this.selectMissionary(name);
                });
            });
        }

        this.elements.searchResults.classList.add('show');
    },

    // 검색어 하이라이트
    highlightSearchTerm(text, term) {
        if (!text || !term) return text;
        
        const regex = new RegExp(`(${term})`, 'gi');
        return text.replace(regex, '<span class="search-highlight">$1</span>');
    },

    // 키보드 네비게이션 처리
    handleKeyNavigation(e) {
        const results = this.state.searchResults;
        if (results.length === 0) return;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                this.state.selectedIndex = Math.min(this.state.selectedIndex + 1, results.length - 1);
                this.updateSelection();
                break;
            case 'ArrowUp':
                e.preventDefault();
                this.state.selectedIndex = Math.max(this.state.selectedIndex - 1, -1);
                this.updateSelection();
                break;
            case 'Enter':
                e.preventDefault();
                if (this.state.selectedIndex >= 0) {
                    const selectedMissionary = results[this.state.selectedIndex];
                    this.selectMissionary(selectedMissionary.name);
                }
                break;
        }
    },

    // 선택 상태 업데이트
    updateSelection() {
        const items = this.elements.searchResults.querySelectorAll('.search-result-item');
        items.forEach((item, index) => {
            item.classList.toggle('selected', index === this.state.selectedIndex);
        });

        // 선택된 항목으로 스크롤
        if (this.state.selectedIndex >= 0) {
            const selectedItem = items[this.state.selectedIndex];
            selectedItem.scrollIntoView({ block: 'nearest' });
        }
    },

    // 선교사 선택
    selectMissionary(name) {
        const missionary = this.state.searchResults.find(m => m.name === name);
        if (!missionary) return;

        const latlng = window.MissionaryMap.getLatLng(missionary, missionary.country);
        
        // 지도 이동
        window.MissionaryMap.map.flyTo(latlng, Math.max(window.MissionaryMap.map.getZoom(), 8), { 
            animate: true, 
            duration: 1.2 
        });

        // 검색 모드 종료
        this.exitSearchMode();

        // 상세 팝업 표시 (지도 이동 후)
        setTimeout(() => {
            window.MissionaryMap.showDetailPopup(name, latlng);
        }, 1200);
    },

    // 지도 마커 하이라이트
    highlightMatchingMarkers(results) {
        this.clearHighlights();

        if (results.length === 0) return;

        // 매치된 선교사들의 국가 수집
        const matchedCountries = [...new Set(results.map(m => m.country))];
        
        // 해당 국가들의 마커 하이라이트
        if (window.MissionaryMap && window.MissionaryMap.globalMarkers) {
            window.MissionaryMap.globalMarkers.forEach(marker => {
                if (marker.countryData) {
                    const country = Object.keys(window.MissionaryMap.constants.LATLNGS).find(c => 
                        JSON.stringify(window.MissionaryMap.constants.LATLNGS[c]) === JSON.stringify(marker.getLatLng())
                    );
                    
                    if (matchedCountries.includes(country)) {
                        const markerElement = marker.getElement();
                        if (markerElement) {
                            markerElement.classList.add('search-highlighted-marker');
                            this.state.highlightedMarkers.push(markerElement);
                        }
                    }
                }
            });
        }
    },

    // 하이라이트 제거
    clearHighlights() {
        this.state.highlightedMarkers.forEach(element => {
            element.classList.remove('search-highlighted-marker');
        });
        this.state.highlightedMarkers = [];
    },

    // 검색 결과 제거
    clearResults() {
        this.elements.searchResults.classList.remove('show');
        this.elements.searchResults.innerHTML = '';
        this.state.searchResults = [];
        this.state.selectedIndex = -1;
    },
    
    // 디버깅용 테스트 함수
    testSearch(term = '이') {
        console.log('Testing search with term:', term);
        this.performSearch(term);
    },
    
    // 강제로 검색 모드 진입 (디버깅용)
    forceEnterSearchMode() {
        console.log('Force entering search mode...');
        if (this.elements.titleFlipInner) {
            this.state.isSearchMode = true;
            this.elements.titleFlipInner.classList.add('flipped');
            this.elements.map.classList.add('search-mode');
            
            setTimeout(() => {
                if (this.elements.searchInput) {
                    this.elements.searchInput.focus();
                    // 테스트 값 설정
                    this.elements.searchInput.value = '이';
                    // 수동으로 검색 트리거
                    this.performSearch('이');
                }
            }, 500);
        }
    },
    
    // 현재 상태 확인
    getStatus() {
        return {
            isSearchMode: this.state.isSearchMode,
            searchTerm: this.state.searchTerm,
            searchResults: this.state.searchResults.length,
            elements: {
                titleLogo: !!this.elements.titleLogo,
                titleFlipInner: !!this.elements.titleFlipInner,
                searchInput: !!this.elements.searchInput,
                searchResults: !!this.elements.searchResults
            },
            dataManager: !!window.DataManager,
            missionaries: window.DataManager?.state?.missionaries?.length || 0
        };
    }
};

// SearchManager 자동 초기화
document.addEventListener('DOMContentLoaded', function() {
    console.log('SearchManager: DOM 로드 완료, 초기화 대기 중...');
    
    // DataManager가 준비될 때까지 대기
    const waitForDataManager = () => {
        if (window.DataManager && window.DataManager.state.isDataReady) {
            console.log('SearchManager: DataManager 준비됨, 초기화 시작');
            SearchManager.init();
        } else {
            console.log('SearchManager: DataManager 대기 중...');
            setTimeout(waitForDataManager, 500);
        }
    };
    
    // 1초 후 초기화 시도 시작
    setTimeout(waitForDataManager, 1000);
});

// 전역에서 접근 가능하도록 등록
window.SearchManager = SearchManager;

// 즉시 타이틀 클릭 이벤트 등록 (데이터 로딩과 무관)
document.addEventListener('DOMContentLoaded', () => {
    console.log('SearchManager: DOM loaded, setting up title click...');
    
    // 타이틀 클릭 이벤트 먼저 등록
    const titleLogo = document.getElementById('titleLogo');
    if (titleLogo) {
        titleLogo.addEventListener('click', (e) => {
            console.log('SearchManager: Title clicked!');
            e.stopPropagation();
            
            // SearchManager가 초기화되지 않았다면 강제 초기화
            if (!SearchManager.state.isSearchMode && SearchManager.elements.titleFlipInner) {
                SearchManager.enterSearchMode();
            }
        });
        console.log('SearchManager: Title click event registered');
    }
    
    // DOM 요소들 즉시 할당
    SearchManager.elements.titleFlipInner = document.querySelector('.title-flip-inner');
    SearchManager.elements.searchInput = document.getElementById('missionary-search');
    SearchManager.elements.searchResults = document.getElementById('search-results');
    
    console.log('SearchManager: DOM elements assigned:', {
        titleFlipInner: !!SearchManager.elements.titleFlipInner,
        searchInput: !!SearchManager.elements.searchInput,
        searchResults: !!SearchManager.elements.searchResults
    });
    
    // 데이터 로딩 대기 시작
    setTimeout(initSearchManagerWhenReady, 1000);
});

// 데이터 로딩 완료 후 완전 초기화
const initSearchManagerWhenReady = () => {
    // DataManager와 missionaries 데이터가 로드될 때까지 대기
    if (window.DataManager && 
        window.DataManager.state.missionaries && 
        window.DataManager.state.missionaries.length > 0) {
        
        console.log('SearchManager: Data is ready, completing initialization...');
        
        // 검색 입력 이벤트 등록
        if (SearchManager.elements.searchInput) {
            SearchManager.initEventListeners();
            SearchManager.debouncedSearch = SearchManager.debounce((term) => SearchManager.performSearch(term), 300);
            console.log('SearchManager: Full initialization complete');
        }
    } else {
        console.log('SearchManager: Waiting for data to load...');
        setTimeout(initSearchManagerWhenReady, 500);
    }
}; 