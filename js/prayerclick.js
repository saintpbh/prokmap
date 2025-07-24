/**
 * PrayerClick 모듈
 * 기도손 이모지 클릭 시 실시간으로 모든 사용자 화면에 애니메이션을 표시하는 모듈
 */

class PrayerClickManager {
    constructor() {
        this.db = null;
        this.prayerAnimationsRef = null;
        this.isInitialized = false;
        this.activeAnimations = new Map(); // 현재 실행 중인 애니메이션 추적
        this.maxAnimations = 10; // 동시 최대 애니메이션 개수
        this.animationDuration = 3000; // 애니메이션 지속 시간 (3초)
        this.clickCooldown = 1000; // 클릭 쿨다운 (1초)
        this.lastClickTime = 0;
        
        console.log('PrayerClick 모듈 초기화');
    }

    // Firebase 초기화 및 연결
    async initialize() {
        try {
            // Firebase SDK 로딩 확인
            if (!window.firebase || !window.firebase.database) {
                throw new Error('Firebase SDK가 로드되지 않았습니다.');
            }

            // Firebase 서비스 확인
            if (!window.firebaseServices || !window.firebaseServices.db) {
                // firebase-config.js가 로드되지 않은 경우 직접 초기화
                console.log('Firebase 서비스가 초기화되지 않았습니다. 직접 초기화를 시도합니다...');
                this.db = window.firebase.database();
            } else {
                // Firebase 연결 확인
                await window.checkFirebaseConnection();
                this.db = window.firebaseServices.db;
            }
            
            if (!this.db) {
                throw new Error('Firebase Database 연결에 실패했습니다.');
            }
            
            this.prayerAnimationsRef = this.db.ref('prayer_animations');
            
            // 실시간 리스너 설정
            this.setupRealtimeListener();
            
            // 오래된 애니메이션 데이터 정리
            this.cleanupOldAnimations();
            
            this.isInitialized = true;
            console.log('PrayerClick 모듈 초기화 완료');
            
        } catch (error) {
            console.error('PrayerClick 모듈 초기화 실패:', error);
            this.isInitialized = false;
            throw error; // 오류를 다시 던져서 호출자가 처리할 수 있도록
        }
    }

    // 실시간 리스너 설정
    setupRealtimeListener() {
        if (!this.prayerAnimationsRef) return;

        // 새로운 기도 애니메이션 감지
        this.prayerAnimationsRef.on('child_added', (snapshot) => {
            const animationData = snapshot.val();
            const animationId = snapshot.key;
            
            if (animationData && this.isValidAnimationData(animationData)) {
                console.log('새로운 기도 애니메이션 감지:', animationData);
                this.triggerAnimation(animationId, animationData);
            }
        });

        // 애니메이션 데이터 삭제 시 정리
        this.prayerAnimationsRef.on('child_removed', (snapshot) => {
            const animationId = snapshot.key;
            this.cleanupAnimation(animationId);
        });
    }

    // 애니메이션 데이터 유효성 검사
    isValidAnimationData(data) {
        return data && 
               data.country && 
               data.timestamp && 
               typeof data.lat === 'number' && 
               typeof data.lng === 'number' &&
               data.missionary_name;
    }

    // 기도손 클릭 처리
    async handlePrayerClick(missionaryData) {
        // 초기화되지 않은 경우 자동으로 초기화 시도
        if (!this.isInitialized) {
            console.log('PrayerClick 모듈이 초기화되지 않았습니다. 자동 초기화를 시도합니다...');
            try {
                await this.initialize();
                if (!this.isInitialized) {
                    console.warn('PrayerClick 모듈 자동 초기화에 실패했습니다.');
                    return false;
                }
            } catch (error) {
                console.error('PrayerClick 모듈 자동 초기화 실패:', error);
                return false;
            }
        }

        // 입력 데이터 검증
        if (!missionaryData || typeof missionaryData !== 'object') {
            console.error('잘못된 선교사 데이터:', missionaryData);
            return false;
        }



        // 필수 필드 검증 및 안전한 기본값 설정
        const validatedData = {
            name: missionaryData.name || 'Unknown',
            country: missionaryData.country || 'Unknown',
            city: missionaryData.city || '',
            flagUrl: missionaryData.flagUrl || ''
        };
        
        // 데이터가 비어있거나 유효하지 않은 경우 에러 처리
        if (!validatedData.name || !validatedData.country) {
            console.error('필수 선교사 정보가 누락되었습니다:', validatedData);
            return false;
        }



        // 쿨다운 체크
        const now = Date.now();
        if (now - this.lastClickTime < this.clickCooldown) {
            return false;
        }
        this.lastClickTime = now;

        try {
            // 선교사 좌표 정보 가져오기
            const coordinates = this.getMissionaryCoordinates(validatedData);
            if (!coordinates) {
                console.error('선교사 좌표 정보를 찾을 수 없습니다.');
                return false;
            }

            // 애니메이션 데이터 생성 (모든 필드가 정의되어 있는지 확인)
            const animationData = {
                country: validatedData.country,
                missionary_name: validatedData.name,
                lat: coordinates.lat,
                lng: coordinates.lng,
                timestamp: now,
                ttl: now + this.animationDuration // TTL 설정
            };

            // 최종 데이터 검증
            if (!animationData.country || !animationData.missionary_name) {
                console.error('애니메이션 데이터에 필수 필드가 누락되었습니다:', animationData);
                return false;
            }

            // Firebase에 애니메이션 데이터 저장
            const animationId = `prayer_${now}_${Math.random().toString(36).substr(2, 9)}`;
            await this.prayerAnimationsRef.child(animationId).set(animationData);


            return true;

        } catch (error) {
            console.error('기도 클릭 처리 실패:', error);
            return false;
        }
    }

    // 선교사 좌표 정보 가져오기
    getMissionaryCoordinates(missionaryData) {
        try {
            // MissionaryMap에서 좌표 가져오기
            if (window.MissionaryMap && window.MissionaryMap.getLatLng) {
                const latlng = window.MissionaryMap.getLatLng(missionaryData, missionaryData.country);
                
                if (latlng && latlng.length >= 2) {
                    return {
                        lat: latlng[0],
                        lng: latlng[1]
                    };
                }
            } else {
                console.error('MissionaryMap.getLatLng 함수를 찾을 수 없습니다.');
            }

            // 기본 좌표 (서울)
            console.warn('선교사 좌표를 찾을 수 없어 기본 좌표를 사용합니다.');
            return {
                lat: 37.5665,
                lng: 126.9780
            };

        } catch (error) {
            console.error('좌표 가져오기 실패:', error);
            return null;
        }
    }

    // 애니메이션 트리거
    triggerAnimation(animationId, animationData) {
        // 최대 애니메이션 개수 체크
        if (this.activeAnimations.size >= this.maxAnimations) {
            return;
        }

        // 지도에서 화면 좌표 계산
        const screenPosition = this.getScreenPosition(animationData.lat, animationData.lng);
        if (!screenPosition) {
            console.error('화면 좌표 계산 실패');
            return;
        }

        // 애니메이션 요소 생성
        const animationElement = this.createAnimationElement(animationData, screenPosition);
        
        // body에 직접 추가 (지도 위에 표시되도록)
        document.body.appendChild(animationElement);

        // 활성 애니메이션 추가
        this.activeAnimations.set(animationId, {
            element: animationElement,
            startTime: Date.now()
        });

        // 애니메이션 시작
        this.startAnimation(animationElement);

        // 애니메이션 완료 후 정리
        setTimeout(() => {
            this.cleanupAnimation(animationId);
        }, this.animationDuration);
    }

    // 지도 좌표를 화면 좌표로 변환
    getScreenPosition(lat, lng) {
        try {
            if (window.MissionaryMap && window.MissionaryMap.map) {
                const latlng = [lat, lng];
                const point = window.MissionaryMap.map.latLngToContainerPoint(latlng);
                
                // 지도 컨테이너의 위치를 고려하여 절대 좌표 계산
                const mapContainer = document.getElementById('map');
                if (mapContainer) {
                    const mapRect = mapContainer.getBoundingClientRect();
                    return {
                        x: mapRect.left + point.x,
                        y: mapRect.top + point.y
                    };
                }
                
                return {
                    x: point.x,
                    y: point.y
                };
            }
            return null;
        } catch (error) {
            console.error('화면 좌표 변환 실패:', error);
            return null;
        }
    }

    // 애니메이션 요소 생성
    createAnimationElement(animationData, position) {
        const element = document.createElement('div');
        element.className = 'prayer-hand-animation';
        element.innerHTML = '🙏';
        
        // 위치 설정 (절대 좌표 사용)
        element.style.position = 'fixed';
        element.style.left = position.x + 'px';
        element.style.top = position.y + 'px';
        element.style.transform = 'translate(-50%, -50%)'; // 요소의 중앙을 position.x, position.y에 맞춤
        element.style.zIndex = '340';
        element.style.fontSize = '24px';
        element.style.pointerEvents = 'none';
        element.style.userSelect = 'none';
        
        // 애니메이션 준비 (초기 투명도와 스케일)
        element.style.opacity = '0';
        element.style.transform += ' scale(0.8)'; // 기존 transform에 추가
        element.style.transition = 'none'; // 초기에는 transition 없음
        
        return element;
    }

    // 애니메이션 시작
    startAnimation(element) {
        requestAnimationFrame(() => {
            // 초기 상태에서 최종 상태로 전환을 위한 transition 설정
            element.style.transition = 'opacity 0.3s ease-out, transform 0.3s ease-out';
            element.style.opacity = '1';
            element.style.transform = 'translate(-50%, -50%) scale(1)'; // 최종 스케일 1

            // 메인 애니메이션 시작 (위로 올라가면서 사라지는 효과)
            setTimeout(() => {
                element.style.transition = 'opacity 2.5s cubic-bezier(0.25, 0.46, 0.45, 0.94), transform 2.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
                element.style.opacity = '0';
                element.style.transform = 'translate(-50%, -100px) scale(0.5)'; // 위로 이동하면서 작아지고 사라짐
            }, 100); // 짧은 지연 후 메인 애니메이션 시작

            // 요소 완전히 제거
            setTimeout(() => {
                if (element.parentNode) {
                    element.remove();
                }
            }, this.animationDuration); // animationDuration 후에 제거
        });
    }

    // 애니메이션 정리
    cleanupAnimation(animationId) {
        const animation = this.activeAnimations.get(animationId);
        if (animation && animation.element) {
            animation.element.remove();
            this.activeAnimations.delete(animationId);
        }
    }

    // 오래된 애니메이션 데이터 정리
    cleanupOldAnimations() {
        if (!this.prayerAnimationsRef) return;

        const now = Date.now();
        this.prayerAnimationsRef.once('value', (snapshot) => {
            const animations = snapshot.val();
            if (animations) {
                Object.keys(animations).forEach(key => {
                    const animation = animations[key];
                    if (animation.ttl && animation.ttl < now) {
                        this.prayerAnimationsRef.child(key).remove();
                    }
                });
            }
        });
    }

    // 모듈 종료
    destroy() {
        if (this.prayerAnimationsRef) {
            this.prayerAnimationsRef.off();
        }
        
        // 모든 활성 애니메이션 정리
        this.activeAnimations.forEach((animation, id) => {
            this.cleanupAnimation(id);
        });
        
        this.isInitialized = false;
        console.log('PrayerClick 모듈 종료');
    }
}

// 전역 인스턴스 생성
window.prayerClickManager = new PrayerClickManager();

// 전역 함수 등록 (안전장치 포함)
window.handlePrayerClick = async (missionaryData) => {
    if (!window.prayerClickManager) {
        console.error('PrayerClickManager가 로드되지 않았습니다.');
        return false;
    }
    return await window.prayerClickManager.handlePrayerClick(missionaryData);
};

// 모듈 초기화 함수
window.initializePrayerClick = async () => {
    if (!window.prayerClickManager) {
        console.error('PrayerClickManager가 로드되지 않았습니다.');
        return false;
    }
    return await window.prayerClickManager.initialize();
};

// 초기화 상태 확인 함수
window.isPrayerClickInitialized = () => {
    return window.prayerClickManager && window.prayerClickManager.isInitialized;
};

console.log('PrayerClick 모듈 로드 완료'); 