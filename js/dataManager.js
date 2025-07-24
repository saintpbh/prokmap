// public/js/dataManager.js
const DataManager = {
    // Firebase Realtime Database 사용 (Google Sheets URL 제거)
    
    state: {
        missionaries: [],
        missionaryInfo: {},
        countryStats: {},
        presbyteryStats: {},
        presbyteryMembers: {},
        isDataReady: false,
        searchIndex: null, // 검색 성능 최적화를 위한 인덱스
        markerMappings: new Map(), // 마커-데이터 매핑
    },

    // 데이터 로딩 완료 이벤트 리스너들
    dataReadyListeners: [],

    fetchData(callback) {
        console.log('DataManager: 데이터 로딩 시작...');
        window.fetchData((err, data) => {
            if (err) {
                console.error('데이터 로딩 실패:', err);
                if (callback) callback(err);
                return;
            }
            console.log('DataManager: Firebase 데이터 fetch 완료');
            this.processData(data.missionaries || []);
            this.state.isDataReady = true;
            console.log('DataManager: 데이터 준비 완료');
            if (callback) callback();
            this.notifyDataReady();
        });
    },

    processData(data) {
        // 데이터 초기화
        this.state.missionaries = [];
        this.state.missionaryInfo = {};
        this.state.countryStats = {};
        this.state.presbyteryStats = {};
        this.state.presbyteryMembers = {};

        // 빈 이름 필드를 엄격하게 필터링하고 Admin 상세 데이터 활용
        this.state.missionaries = data.filter(item => {
            // name이 존재하고, 공백이 아니고, 실제 값이 있는 경우만 포함
            return item.name && 
                   item.name.trim() !== '' && 
                   item.name.trim().length > 0 &&
                   item.country && 
                   item.country.trim() !== '';
        }).map((item, index) => ({
            ...item,
            // 기존 별칭 유지
            newsletter: item.newsletter || item.NewsLetter,
            sentDate: item.sentDate || item.sent_date,
            englishName: item.englishName || item.english_name,
            // Admin 상세 데이터 활용
            prayerTitle: item.prayerTitle || item.prayer || '기도로 함께해 주세요',
            latestNewsletter: item.latestNewsletter || null,
            latestNewsletterDate: item.latestNewsletterDate || item.sentDate || null,
            localPhone: item.localPhone || item.local_phone || '',
            localAddress: item.localAddress || item.local_address || '',
            organization: item.organization || item.organization_name || '',
            family: item.family || [],
            supporters: item.supporters || [],
            status: item.status || 'active',
            isActive: item.isActive !== false,
            // 메타데이터
            createdAt: item.createdAt || null,
            updatedAt: item.updatedAt || null,
            _id: `missionary_${index}`,
            _searchText: this.buildSearchText(item)
        }));
            
        this.state.missionaries.forEach(item => {
            this.state.missionaryInfo[item.name] = item;
            
            if(item.country) {
                this.state.countryStats[item.country] = this.state.countryStats[item.country] || { count: 0, names: [], cities: [] };
                this.state.countryStats[item.country].count++;
                this.state.countryStats[item.country].names.push(item.name);
                this.state.countryStats[item.country].cities.push(item.city && item.city.trim() ? item.city : null);
            }
            
            if(item.presbytery) {
                this.state.presbyteryStats[item.presbytery] = (this.state.presbyteryStats[item.presbytery] || 0) + 1;
                this.state.presbyteryMembers[item.presbytery] = this.state.presbyteryMembers[item.presbytery] || [];
                this.state.presbyteryMembers[item.presbytery].push(item);
            }
        });

        console.log('DataManager: 데이터 처리 완료', this.state.missionaries.length, '명의 선교사');
        console.log('DataManager: 선교사 목록:', this.state.missionaries.map(m => m.name));
    },

    // 검색용 텍스트 생성 (Admin 상세 데이터 포함)
    buildSearchText(missionary) {
        const fields = [
            missionary.name,
            missionary.country,
            missionary.city,
            missionary.organization,
            missionary.presbytery,
            missionary.englishName,
            missionary.localPhone,
            missionary.localAddress,
            missionary.prayerTitle,
            missionary.latestNewsletter
        ];
        return fields.filter(Boolean).join(' ').toLowerCase();
    },

    // 검색 인덱스 구축 (성능 최적화)
    buildSearchIndex() {
        this.state.searchIndex = new Map();
        
        this.state.missionaries.forEach(missionary => {
            const words = missionary._searchText.split(/\s+/);
            words.forEach(word => {
                if (word.length > 0) {
                    if (!this.state.searchIndex.has(word)) {
                        this.state.searchIndex.set(word, []);
                    }
                    this.state.searchIndex.get(word).push(missionary);
                }
            });
        });

        console.log('DataManager: 검색 인덱스 구축 완료');
    },

    // 통합 검색 함수 (Admin 상세 데이터 포함)
    search(term) {
        if (!term || term.trim().length === 0) {
            return [];
        }

        const searchTerm = term.toLowerCase().trim();
        
        // 직접 필터링 방식 (Admin 상세 데이터 포함)
        const results = this.state.missionaries.filter(missionary => {
            const nameMatch = missionary.name && missionary.name.toLowerCase().includes(searchTerm);
            const countryMatch = missionary.country && missionary.country.toLowerCase().includes(searchTerm);
            const cityMatch = missionary.city && missionary.city.toLowerCase().includes(searchTerm);
            const orgMatch = missionary.organization && missionary.organization.toLowerCase().includes(searchTerm);
            const presbyMatch = missionary.presbytery && missionary.presbytery.toLowerCase().includes(searchTerm);
            const englishNameMatch = missionary.englishName && missionary.englishName.toLowerCase().includes(searchTerm);
            const phoneMatch = missionary.localPhone && missionary.localPhone.toLowerCase().includes(searchTerm);
            const addressMatch = missionary.localAddress && missionary.localAddress.toLowerCase().includes(searchTerm);
            const prayerMatch = missionary.prayerTitle && missionary.prayerTitle.toLowerCase().includes(searchTerm);
            const newsletterMatch = missionary.latestNewsletter && missionary.latestNewsletter.toLowerCase().includes(searchTerm);
            
            return nameMatch || countryMatch || cityMatch || orgMatch || presbyMatch || 
                   englishNameMatch || phoneMatch || addressMatch || prayerMatch || newsletterMatch;
        });

        console.log(`DataManager: "${term}" 검색 결과: ${results.length}명 (상세 데이터 포함)`);
        return results.slice(0, 12); // 최대 12개 결과
    },

    // 마커와 데이터 매핑 함수
    linkMarkerToMissionary(marker, missionary) {
        if (!marker || !missionary || !missionary._id) return;
        
        this.state.markerMappings.set(missionary._id, marker);
        
        // 마커에 선교사 ID 저장
        marker._missionaryId = missionary._id;
        
        console.log(`DataManager: 마커 연결됨 - ${missionary.name} (${missionary._id})`);
    },

    // 선교사 ID로 마커 찾기
    getMarkerByMissionaryId(missionaryId) {
        return this.state.markerMappings.get(missionaryId);
    },

    // 선교사 데이터로 마커 찾기
    getMarkerByMissionary(missionary) {
        if (!missionary || !missionary._id) return null;
        return this.getMarkerByMissionaryId(missionary._id);
    },

    // 데이터 준비 완료 리스너 등록
    onDataReady(callback) {
        console.log('DataManager: onDataReady 리스너 등록 요청');
        if (this.state.isDataReady) {
            // 이미 데이터가 준비되었으면 즉시 실행
            console.log('DataManager: 데이터가 이미 준비됨, 즉시 콜백 실행');
            try {
                callback();
            } catch (error) {
                console.error('DataManager: 즉시 콜백 실행 오류:', error);
            }
        } else {
            // 아직 준비되지 않았으면 리스너에 추가
            console.log('DataManager: 리스너를 대기 목록에 추가');
            this.dataReadyListeners.push(callback);
            console.log('DataManager: 현재 대기 중인 리스너 수:', this.dataReadyListeners.length);
        }
    },

    // 데이터 준비 완료 알림
    notifyDataReady() {
        console.log('DataManager: notifyDataReady 실행, 리스너 수:', this.dataReadyListeners.length);
        this.dataReadyListeners.forEach((callback, index) => {
            try {
                console.log(`DataManager: 리스너 ${index + 1} 실행 중...`);
                callback();
                console.log(`DataManager: 리스너 ${index + 1} 실행 완료`);
            } catch (error) {
                console.error(`DataManager: 리스너 ${index + 1} 실행 오류:`, error);
            }
        });
        console.log('DataManager: 모든 리스너 실행 완료, 리스너 목록 클리어');
        this.dataReadyListeners = []; // 실행 후 클리어
    },

    getMissionaryInfo(name) {
        return this.state.missionaryInfo[name];
    },

    getCountryStats() {
        return this.state.countryStats;
    },

    getPresbyteryStats() {
        return this.state.presbyteryStats;
    },

    getPresbyteryMembers(presbytery) {
        return this.state.presbyteryMembers[presbytery];
    },

    // 상태 확인 함수
    getStatus() {
        return {
            isDataReady: this.state.isDataReady,
            missionariesCount: this.state.missionaries.length,
            searchIndexSize: this.state.searchIndex ? this.state.searchIndex.size : 0,
            markerMappingsCount: this.state.markerMappings.size
        };
    }
};

window.DataManager = DataManager; 