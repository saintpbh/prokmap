console.log('GlobalSearch 파일 로드 시작');

// 전체보기 검색 시스템 - 재구성 버전
class GlobalSearch {
    constructor() {
        this.isActive = false;
        this.searchResults = [];
        this.activeLabels = [];
        
        console.log('GlobalSearch: 생성자 호출');
        this.init();
    }
    
    init() {
        this.setupDOM();
        this.setupEvents();

    }
    
    setupDOM() {
        this.elements = {
            titleContainer: document.querySelector('.title-flip-inner'),
            titleFront: document.querySelector('.title-front'),
            searchInput: document.getElementById('missionary-search'),
            clearBtn: document.getElementById('search-clear'),
            closeBtn: document.getElementById('search-close-btn')
        };
        console.log('GlobalSearch: DOM 요소 준비 완료');
    }
    
    setupEvents() {
        if (this.elements.titleFront) {
            this.elements.titleFront.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleSearch();
            });
        }
        
        if (this.elements.searchInput) {
            this.elements.searchInput.addEventListener('input', (e) => {
                this.handleSearch(e.target.value);
            });
        }
        
        if (this.elements.clearBtn) {
            this.elements.clearBtn.addEventListener('click', () => {
                this.clearSearch();
            });
        }
        
        if (this.elements.closeBtn) {
            this.elements.closeBtn.addEventListener('click', () => {
                this.closeSearch();
            });
        }
        
        console.log('GlobalSearch: 이벤트 설정 완료');
    }
    
    toggleSearch() {
        if (this.isActive) {
            this.closeSearch();
        } else {
            this.openSearch();
        }
    }
    
    openSearch() {
        if (!this.isDataReady()) {
            console.log('GlobalSearch: 데이터가 아직 준비되지 않음');
            return;
        }
        
        this.isActive = true;
        
        if (this.elements.titleContainer) {
            this.elements.titleContainer.style.transform = 'rotateY(180deg)';
        }
        
        setTimeout(() => {
            if (this.elements.searchInput) {
                this.elements.searchInput.focus();
            }
        }, 300);
        
        console.log('GlobalSearch: 검색 모드 활성화');
    }
    
    closeSearch() {
        this.isActive = false;
        
        if (this.elements.titleContainer) {
            this.elements.titleContainer.style.transform = 'rotateY(0deg)';
        }
        
        if (this.elements.searchInput) {
            this.elements.searchInput.value = '';
            this.elements.searchInput.blur();
        }
        
        this.clearResults();
        console.log('GlobalSearch: 검색 모드 비활성화');
    }
    
    clearSearch() {
        if (this.elements.searchInput) {
            this.elements.searchInput.value = '';
            this.elements.searchInput.focus();
        }
        this.clearResults();
    }
    
    handleSearch(term) {
        const searchTerm = term.trim();
        
        if (searchTerm.length === 0) {
            this.clearResults();
            return;
        }
        
        const results = this.searchMissionaries(searchTerm);
        this.searchResults = results;
        
        console.log(`GlobalSearch: "${searchTerm}" 검색 결과: ${results.length}명`);
        
        if (results.length > 0) {
            this.displayResults(results, searchTerm);
        }
    }
    
    searchMissionaries(term) {
        const searchTerm = term.toLowerCase();
        const results = [];
        
        const countryTable = document.getElementById('missionary-table-country');
        if (countryTable) {
            const rows = countryTable.querySelectorAll('tbody tr');
            rows.forEach(row => {
                const nameCell = row.querySelector('.missionary-name');
                const countryCell = row.querySelector('.country-click');
                
                if (nameCell && countryCell) {
                    const name = nameCell.textContent.trim();
                    const country = countryCell.textContent.trim();
                    
                    if (name.toLowerCase().includes(searchTerm) || 
                        country.toLowerCase().includes(searchTerm)) {
                        
                        results.push({
                            name: name,
                            country: country
                        });
                    }
                }
            });
        }
        
        return results.slice(0, 12);
    }
    
    displayResults(results, searchTerm) {
        this.clearResults();
        
        results.forEach((result, index) => {
            this.highlightMarkerOnMap(result, index, searchTerm);
        });
        
        this.showResultCounter(results.length);
    }
    
    highlightMarkerOnMap(result, index, searchTerm) {
        if (window.MissionaryMap && window.MissionaryMap.globalMarkers) {
            const marker = this.findMarkerByName(result.name);
            
            if (marker) {
                this.addPulseEffect(marker);
                
                const mapPoint = window.MissionaryMap.map.latLngToContainerPoint(marker.getLatLng());
                this.createFloatingLabel(result, mapPoint, index, searchTerm);
            }
        }
    }
    
    findMarkerByName(name) {
        if (!window.MissionaryMap || !window.MissionaryMap.globalMarkers) return null;
        
        return window.MissionaryMap.globalMarkers.find(marker => {
            const popup = marker.getPopup();
            if (popup) {
                const content = popup.getContent();
                return content && content.includes(name);
            }
            return false;
        });
    }
    
    addPulseEffect(marker) {
        const markerElement = marker.getElement();
        if (markerElement) {
            markerElement.classList.add('search-matched');
        }
    }
    
    createFloatingLabel(result, point, index, searchTerm) {
        // 기존 라벨 제거
        document.querySelectorAll('.search-floating-label').forEach(label => label.remove());
        
        const label = document.createElement('div');
        label.className = 'search-floating-label';
        label.style.cssText = `
            position: absolute;
            left: ${point.x}px;
            top: ${point.y - 60 - (index * 40)}px;
            background: rgba(0, 0, 0, 0.9);
            color: white;
            padding: 8px 12px;
            border-radius: 6px;
            font-size: 12px;
            font-weight: 500;
            z-index: 1000;
            pointer-events: none;
            backdrop-filter: blur(8px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            border: 1px solid rgba(255, 255, 255, 0.2);
            max-width: 200px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            animation: searchLabelFadeIn 0.3s ease-out;
        `;
        
        // 검색어 하이라이트
        const highlightedName = this.highlightSearchTerm(result.name, searchTerm);
        const highlightedCountry = this.highlightSearchTerm(result.country, searchTerm);
        
        label.innerHTML = `
            <div style="font-weight: bold; margin-bottom: 2px;">${highlightedName}</div>
            <div style="font-size: 11px; opacity: 0.8;">${highlightedCountry}</div>
        `;
        
        // 화살표 추가
        const arrow = document.createElement('div');
        arrow.style.cssText = `
            position: absolute;
            bottom: -6px;
            left: 50%;
            transform: translateX(-50%);
            width: 0;
            height: 0;
            border-left: 6px solid transparent;
            border-right: 6px solid transparent;
            border-top: 6px solid rgba(0, 0, 0, 0.9);
        `;
        label.appendChild(arrow);
        
        // 지도 컨테이너에 추가
        const mapContainer = document.getElementById('map');
        if (mapContainer) {
            mapContainer.appendChild(label);
            this.activeLabels.push(label);
        }
        
        // 자동 제거 타이머
        setTimeout(() => {
            if (label.parentNode) {
                label.style.animation = 'searchLabelFadeOut 0.3s ease-in';
                setTimeout(() => {
                    if (label.parentNode) {
                        label.remove();
                        const index = this.activeLabels.indexOf(label);
                        if (index > -1) {
                            this.activeLabels.splice(index, 1);
                        }
                    }
                }, 300);
            }
        }, 5000);
    }
    
    highlightSearchTerm(text, term) {
        if (!term || !text) return text;
        const regex = new RegExp(`(${term})`, 'gi');
        return text.replace(regex, '<span style="background: #ffeb3b; color: #000; padding: 1px 2px; border-radius: 2px;">$1</span>');
    }
    
    showResultCounter(count) {
        const existingCounter = document.querySelector('.search-result-counter');
        if (existingCounter) {
            existingCounter.remove();
        }
        
        const counter = document.createElement('div');
        counter.className = 'search-result-counter';
        counter.style.cssText = `
            position: absolute;
            top: -25px;
            left: 50%;
            transform: translateX(-50%);
            background: #667eea;
            color: white;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 600;
            z-index: 1001;
        `;
        counter.textContent = `${count}명 발견`;
        
        if (this.elements.searchInput && this.elements.searchInput.parentElement) {
            this.elements.searchInput.parentElement.style.position = 'relative';
            this.elements.searchInput.parentElement.appendChild(counter);
        }
    }
    
    selectResult(result) {
        console.log('GlobalSearch: 선교사 선택:', result.name);
        
        if (window.MissionaryMap && typeof window.MissionaryMap.showDetailPopup === 'function') {
            const marker = this.findMarkerByName(result.name);
            if (marker) {
                const latlng = marker.getLatLng();
                window.MissionaryMap.showDetailPopup(result.name, [latlng.lat, latlng.lng]);
            }
        }
        
        this.closeSearch();
    }
    
    clearResults() {
        this.activeLabels.forEach(label => {
            if (label.parentNode) {
                label.parentNode.removeChild(label);
            }
        });
        this.activeLabels = [];
        
        if (window.MissionaryMap && window.MissionaryMap.globalMarkers) {
            window.MissionaryMap.globalMarkers.forEach(marker => {
                const markerElement = marker.getElement();
                if (markerElement) {
                    markerElement.classList.remove('search-matched');
                }
            });
        }
        
        const counter = document.querySelector('.search-result-counter');
        if (counter) {
            counter.remove();
        }
    }
    
    isDataReady() {
        const countryTable = document.getElementById('missionary-table-country');
        if (!countryTable) return false;
        
        const rows = countryTable.querySelectorAll('tbody tr');
        return rows.length > 0;
    }
}

// CSS 스타일 추가
const searchStyles = document.createElement('style');
searchStyles.textContent = `
    @keyframes labelFadeIn {
        from {
            opacity: 0;
            transform: translateX(-50%) scale(0);
        }
        to {
            opacity: 1;
            transform: translateX(-50%) scale(1);
        }
    }
    
    .search-matched {
        animation: searchPulse 2s infinite;
        z-index: 1000 !important;
    }
    
    @keyframes searchPulse {
        0%, 100% {
            transform: scale(1);
        }
        50% {
            transform: scale(1.2);
            filter: drop-shadow(0 0 8px #ffd700);
        }
    }
    
    .floating-search-label:hover {
        transform: translateX(-50%) scale(1.05) !important;
    }
`;
document.head.appendChild(searchStyles);

// 페이지 로드 후 인스턴스 생성
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        window.globalSearchInstance = new GlobalSearch();
        console.log('GlobalSearch: 시스템 준비 완료');
    }, 1000);
});

console.log('GlobalSearch 파일 로드 완료'); 