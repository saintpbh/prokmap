/**
 * 국가별 선교사 리스트 관리 클래스
 * 독립적인 디자인과 기능을 제공
 */

class CountryMissionaryList {
    constructor() {
        this.currentContainer = null;
        this.currentCountry = null;
        this.missionaries = [];
        this.isVisible = false;
    }

    /**
     * 국가별 선교사 리스트 표시
     * @param {string} country - 국가명
     * @param {Array} missionaries - 선교사 배열
     * @param {Object} position - 팝업 위치 {x, y} (사용하지 않음, CSS 기본 위치 사용)
     */
    show(country, missionaries, position = null) {
        // 기존 리스트가 있으면 완전히 제거
        this.hide();
        
        // 추가 안전장치: DOM에서 모든 cml-container 제거
        document.querySelectorAll('.cml-container').forEach(container => {
            container.remove();
        });
        
        // 기도 팝업 강제 일시정지 (다른 UI가 활성화됨)
        if (window.prayerPopupManager) {
            window.prayerPopupManager.forcePause();
        }
        
        this.currentCountry = country;
        this.missionaries = missionaries || [];
        this.isVisible = true;
        
        // 팝업 생성
        this.createContainer();
        
        // 위치 설정 (마커 중앙에 표시)
        if (position) {
            this.setPosition(position);
        }
        
        // 리스트 내용 생성
        this.renderContent();
        
        // 이벤트 리스너 추가
        this.addEventListeners();
        
        // DOM 렌더링 완료 후 위치 보정 및 팝업 표시
        setTimeout(() => {
            this.adjustPositionToScreen();
            // 위치 보정 완료 후 팝업 표시
            if (this.currentContainer) {
                this.currentContainer.style.opacity = '1';
            }
        }, 0);
        
        console.log(`국가별 선교사 리스트 표시: ${country} (${this.missionaries.length}명)`);
    }

    /**
     * 리스트 숨기기
     */
    hide() {
        if (this.currentContainer) {
            this.currentContainer.remove();
        }
        
        // 현재 컨테이너 참조 정리
        this.currentContainer = null;
        this.isVisible = false;
        
        // 기도 팝업 강제 일시정지 해제 (다른 UI가 비활성화됨)
        if (window.prayerPopupManager) {
            window.prayerPopupManager.forceResume();
        }
        
        console.log('국가별 선교사 리스트 숨김');
    }

    /**
     * 컨테이너 생성
     */
    createContainer() {
        this.currentContainer = document.createElement('div');
        this.currentContainer.className = 'cml-container';
        this.currentContainer.setAttribute('role', 'dialog');
        this.currentContainer.setAttribute('aria-labelledby', 'cml-title');
        this.currentContainer.setAttribute('aria-modal', 'true');
        
        // 초기 상태: 숨김
        this.currentContainer.style.opacity = '0';
        
        // DOM에 추가
        document.body.appendChild(this.currentContainer);
    }

    /**
     * 위치 설정 (마커 중앙에 표시)
     */
    setPosition(position) {
        if (!this.currentContainer) return;
        
        // position이 {x, y} 형태인 경우
        if (position.x !== undefined && position.y !== undefined) {
            this.currentContainer.style.position = 'absolute';
            // 팝업 중앙이 마커에 오도록 transform 사용
            this.currentContainer.style.left = `${position.x}px`;
            this.currentContainer.style.top = `${position.y}px`;
            this.currentContainer.style.right = 'auto';
            this.currentContainer.style.transform = 'translate(-50%, -50%)'; // 팝업 중앙이 마커에 위치
        }
        // position이 {lat, lng} 형태인 경우 (지도 좌표)
        else if (position.lat !== undefined && position.lng !== undefined) {
            if (window.MissionaryMap && window.MissionaryMap.map) {
                const point = window.MissionaryMap.map.latLngToContainerPoint([position.lat, position.lng]);
                this.currentContainer.style.position = 'absolute';
                // 팝업 중앙이 마커에 오도록 transform 사용
                this.currentContainer.style.left = `${point.x}px`;
                this.currentContainer.style.top = `${point.y}px`;
                this.currentContainer.style.right = 'auto';
                this.currentContainer.style.transform = 'translate(-50%, -50%)'; // 팝업 중앙이 마커에 위치
            }
        }
    }

    /**
     * 리스트 내용 렌더링
     */
    renderContent() {
        const flagUrl = this.getFlagUrl(this.currentCountry);
        
        this.currentContainer.innerHTML = `
            <div class="cml-header">
                <h3 id="cml-title">
                    <img src="${flagUrl}" alt="${this.currentCountry} 국기" class="cml-flag">
                    ${this.currentCountry} 선교사
                </h3>
                <button class="cml-close-btn" aria-label="닫기" title="닫기">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            
            <div class="cml-prayer-message" id="cml-prayer-message" style="display: none;">
                <i class="fas fa-pray"></i>
                <span id="cml-prayer-text"></span>
            </div>
            
            <div class="cml-content">
                ${this.renderStats()}
                ${this.renderList()}
            </div>
        `;
    }

    /**
     * 통계 정보 렌더링
     */
    renderStats() {
        return `
            <div class="cml-stats">
                <span>총 <strong class="cml-count">${this.missionaries.length}명</strong>의 선교사</span>
                <span>${this.currentCountry}</span>
            </div>
        `;
    }

    /**
     * 선교사 리스트 렌더링
     */
    renderList() {
        if (this.missionaries.length === 0) {
            return `
                <div class="cml-empty">
                    <i class="fas fa-users"></i>
                    <h4>선교사 정보가 없습니다</h4>
                    <p>${this.currentCountry}에는 현재 등록된 선교사가 없습니다.</p>
                </div>
            `;
        }

        const listItems = this.missionaries.map((missionary, index) => {
            const initials = this.getInitials(missionary.name);
            const city = missionary.city || '';
            
            return `
                <li class="cml-item" data-missionary-index="${index}">
                    <div class="cml-item-content" tabindex="0">
                        <div class="cml-avatar">
                            ${initials}
                        </div>
                        <div class="cml-info">
                            <div class="cml-name">${missionary.name}</div>
                            <div class="cml-location">
                                <i class="fas fa-map-marker-alt"></i>
                                ${city || '도시 정보 없음'}
                            </div>
                        </div>
                        <div class="cml-actions">
                            <button class="cml-action-btn cml-detail-btn" title="상세 정보 보기">
                                <i class="fas fa-info-circle"></i>
                                상세
                            </button>
                            <button class="cml-action-btn cml-prayer-btn" title="기도하기">
                                <i class="fas fa-pray"></i>
                                기도
                            </button>
                        </div>
                    </div>
                </li>
            `;
        }).join('');

        return `<ul class="cml-list">${listItems}</ul>`;
    }

    /**
     * 이벤트 리스너 추가
     */
    addEventListeners() {
        if (!this.currentContainer) return;

        // 닫기 버튼
        const closeBtn = this.currentContainer.querySelector('.cml-close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.hide());
        }

        // 배경 클릭 시 닫기
        this.currentContainer.addEventListener('click', (e) => {
            if (e.target === this.currentContainer) {
                this.hide();
            }
        });

        // 키보드 이벤트 (ESC 키)
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isVisible) {
                this.hide();
            }
        });

        // 선교사 아이템 클릭 이벤트
        const items = this.currentContainer.querySelectorAll('.cml-item');
        items.forEach((item, index) => {
            const missionary = this.missionaries[index];
            
            // 상세 정보 버튼
            const detailBtn = item.querySelector('.cml-detail-btn');
            if (detailBtn) {
                detailBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.showMissionaryDetail(missionary);
                });
            }

            // 기도 버튼
            const prayerBtn = item.querySelector('.cml-prayer-btn');
            if (prayerBtn) {
                prayerBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.handlePrayerClick(missionary);
                });
            }

            // 아이템 전체 클릭 (상세 정보 표시)
            const itemContent = item.querySelector('.cml-item-content');
            if (itemContent) {
                itemContent.addEventListener('click', () => {
                    this.showMissionaryDetail(missionary);
                });
                
                // 키보드 접근성
                itemContent.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        this.showMissionaryDetail(missionary);
                    }
                });
            }
        });
    }

    /**
     * 선교사 상세 정보 표시
     */
    showMissionaryDetail(missionary) {
        // missionary 객체가 올바른지 확인
        if (!missionary || !missionary.name) {
            console.error('유효하지 않은 선교사 데이터:', missionary);
            return;
        }
        
        // 기존 detailPopup.js의 함수 사용
        if (window.showMissionaryDetail) {
            window.showMissionaryDetail(missionary.name);
        } else if (window.fetchMissionaryDetails) {
            // 비동기로 상세 정보 가져오기
            window.fetchMissionaryDetails(missionary.name).then(details => {
                if (details) {
                    // 상세 정보 팝업 표시 로직
                    this.displayMissionaryDetail(details);
                }
            }).catch(error => {
                console.error('선교사 상세 정보 로드 실패:', error);
                alert('선교사 상세 정보를 불러올 수 없습니다.');
            });
        }
    }

    /**
     * 상세 정보 팝업 표시
     */
    displayMissionaryDetail(details) {
        // 기존 detailPopup 시스템과 연동
        if (window.detailPopup && window.detailPopup.show) {
            window.detailPopup.show(details);
        } else {
            // 기본 상세 정보 표시
            this.showBasicDetail(details);
        }
    }

    /**
     * 기본 상세 정보 표시
     */
    showBasicDetail(details) {
        const detailHtml = `
            <div style="padding: 20px; max-width: 500px;">
                <h3>${details.name || '이름 없음'}</h3>
                <p><strong>선교지:</strong> ${details.country || '정보 없음'}</p>
                <p><strong>도시:</strong> ${details.city || '정보 없음'}</p>
                <p><strong>파송년도:</strong> ${details.sent_date || '정보 없음'}</p>
                <p><strong>소속기관:</strong> ${details.organization || '정보 없음'}</p>
                <p><strong>노회:</strong> ${details.presbytery || '정보 없음'}</p>
                <p><strong>기도제목:</strong> ${details.prayer || '정보 없음'}</p>
                ${details.summary ? `<p><strong>요약:</strong> ${details.summary}</p>` : ''}
            </div>
        `;
        
        alert(detailHtml.replace(/<[^>]*>/g, '\n').trim());
    }

    /**
     * 기도 클릭 처리
     */
    handlePrayerClick(missionary) {
        // 팝업 내부에 기도 메시지 표시
        this.showPrayerMessage(missionary.name);
        
        // 기존 기도 시스템과 연동
        if (window.handlePrayerClick) {
            window.handlePrayerClick(missionary);
        } else if (window.prayerclick && window.prayerclick.handlePrayerClick) {
            window.prayerclick.handlePrayerClick(missionary);
        }
    }

    /**
     * 팝업 내부에 기도 메시지 표시
     */
    showPrayerMessage(missionaryName) {
        const prayerMessage = this.currentContainer.querySelector('#cml-prayer-message');
        const prayerText = this.currentContainer.querySelector('#cml-prayer-text');
        
        if (prayerMessage && prayerText) {
            prayerText.textContent = `${missionaryName} 선교사를 위해 기도합니다.`;
            prayerMessage.style.display = 'flex';
            
            // 3초 후 메시지 숨김
            setTimeout(() => {
                prayerMessage.style.display = 'none';
            }, 3000);
        }
    }

    /**
     * 기도 알림 표시
     */
    showPrayerNotification(missionaryName) {
        // 기존 알림 요소가 있으면 사용
        let notification = document.getElementById('prayer-notification');
        
        if (!notification) {
            // 알림 요소가 없으면 새로 생성
            notification = document.createElement('div');
            notification.id = 'prayer-notification';
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
                color: white;
                padding: 15px 20px;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                z-index: 10000;
                font-family: 'Inter', 'Pretendard', sans-serif;
                font-size: 14px;
                font-weight: 500;
                opacity: 0;
                transform: translateX(100%);
                transition: all 0.3s ease;
                max-width: 300px;
                word-wrap: break-word;
            `;
            document.body.appendChild(notification);
        }
        
        // 메시지 설정
        notification.textContent = `${missionaryName} 선교사를 위해 기도합니다. 🙏`;
        
        // 알림 표시
        notification.style.opacity = '1';
        notification.style.transform = 'translateX(0)';
        
        // 3초 후 자동 숨김
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
            
            // 애니메이션 완료 후 요소 제거
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    /**
     * 국기 URL 생성
     */
    getFlagUrl(country) {
        const flagCode = window.MissionaryMap?.constants?.COUNTRY_FLAGS?.[country];
        return flagCode ? `https://flagcdn.com/w40/${flagCode}.png` : '';
    }

    /**
     * 이름에서 이니셜 추출
     */
    getInitials(name) {
        if (!name) return '?';
        return name.split(' ').map(n => n.charAt(0)).join('').substring(0, 2).toUpperCase();
    }

    /**
     * 현재 상태 확인
     */
    getStatus() {
        return {
            isVisible: this.isVisible,
            currentCountry: this.currentCountry,
            missionaryCount: this.missionaries.length
        };
    }

    /**
     * 화면 밖으로 나가지 않도록 위치 보정
     */
    adjustPositionToScreen() {
        if (!this.currentContainer) return;
        
        // 실제 크기 측정 (transform 고려)
        const rect = this.currentContainer.getBoundingClientRect();
        const margin = 20; // 안전한 여백
        
        // transform translate(-50%, -50%)을 고려한 실제 위치 계산
        const currentLeft = parseFloat(this.currentContainer.style.left);
        const currentTop = parseFloat(this.currentContainer.style.top);
        
        // 팝업의 실제 크기 (transform 적용 후)
        const popupWidth = rect.width;
        const popupHeight = rect.height;
        
        let newLeft = currentLeft;
        let newTop = currentTop;
        
        // 우측 경계 보정 (transform 고려)
        if (rect.right > window.innerWidth - margin) {
            newLeft = window.innerWidth - popupWidth/2 - margin;
        }
        
        // 좌측 경계 보정 (transform 고려)
        if (rect.left < margin) {
            newLeft = popupWidth/2 + margin;
        }
        
        // 하단 경계 보정 (transform 고려)
        if (rect.bottom > window.innerHeight - margin) {
            newTop = window.innerHeight - popupHeight/2 - margin;
        }
        
        // 상단 경계 보정 (transform 고려)
        if (rect.top < margin) {
            newTop = popupHeight/2 + margin;
        }
        
        // 위치 업데이트
        this.currentContainer.style.left = `${newLeft}px`;
        this.currentContainer.style.top = `${newTop}px`;
    }
}

// 전역 인스턴스 생성
window.countryMissionaryList = new CountryMissionaryList();

// 편의 함수들
window.showCountryMissionaryList = (country, missionaries, position = null) => {
    window.countryMissionaryList.show(country, missionaries, position);
};

window.hideCountryMissionaryList = () => {
    window.countryMissionaryList.hide();
};

console.log('CountryMissionaryList 모듈 로드 완료'); 