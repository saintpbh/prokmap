// setup.js - 설정 및 뉴스레터 업로드 모달 관리 (Shoelace 기반)

document.addEventListener('DOMContentLoaded', function() {
    // UI 컨트롤 버튼 컨테이너를 항상 표시하도록 강제합니다.
    const uiControls = document.getElementById('ui-controls');
    if (uiControls) {
        uiControls.style.display = 'flex';
    }





    // --- 전체화면 기능 구현 ---
    const fullscreenBtn = document.getElementById('fullscreenBtn');
    const exitFullscreenBtn = document.getElementById('exitFullscreenBtn');
    
    // 전체화면 진입
    const enterFullscreen = () => {
        if (document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen();
        } else if (document.documentElement.webkitRequestFullscreen) {
            document.documentElement.webkitRequestFullscreen();
        } else if (document.documentElement.msRequestFullscreen) {
            document.documentElement.msRequestFullscreen();
        }
    };
    
    // 전체화면 종료
    const exitFullscreen = () => {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        }
    };
    
    // 전체화면 상태 변경 감지
    const handleFullscreenChange = () => {
        const isFullscreen = !!(document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement);
        
        if (isFullscreen) {
            fullscreenBtn.classList.add('hidden');
            exitFullscreenBtn.classList.remove('hidden');
        } else {
            fullscreenBtn.classList.remove('hidden');
            exitFullscreenBtn.classList.add('hidden');
        }
    };
    
    // 이벤트 리스너 설정
    if (fullscreenBtn) {
        fullscreenBtn.addEventListener('click', enterFullscreen);
    }
    
    if (exitFullscreenBtn) {
        exitFullscreenBtn.addEventListener('click', exitFullscreen);
    }
    
    // 전체화면 상태 변경 감지
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);

    // --- 이벤트 리스너 설정 (Shoelace 맞춤) ---

    // 뉴스 토글
    const newsToggle = document.getElementById('news-toggle');
    if (newsToggle) {
        newsToggle.checked = localStorage.getItem('news-toggle') === 'on';
        newsToggle.addEventListener('sl-change', () => {
            localStorage.setItem('news-toggle', newsToggle.checked ? 'on' : 'off');
            window.fetchNewsFromSheet?.();
        });
    }

    // 뉴스 체크 주기 설정
    const newsIntervalInput = document.getElementById('news-interval-input');
    if (newsIntervalInput) {
        newsIntervalInput.addEventListener('sl-change', (e) => {
            const interval = e.target.value;
            if (window.setNewsCheckInterval) {
                window.setNewsCheckInterval(interval);
            }
        });
    }

    // 테이블 토글 초기화 (현재 HTML에 토글 요소가 없으므로 비활성화)
    const initTableToggles = () => {
        console.log('setup.js: 테이블 토글 초기화 시작');
        
        // 현재 HTML에 토글 요소가 없으므로 초기화하지 않음
        console.log('setup.js: 토글 요소가 HTML에 없어 초기화를 건너뜁니다.');
        
        console.log('setup.js: 테이블 토글 초기화 완료');
    };
    
    // DOM 준비 확인 및 초기화 (토글 요소가 없으므로 단순화)
    const waitForTablesAndInit = () => {
        // 테이블 요소들이 존재하는지만 확인
        const requiredTables = ['missionary-table-country', 'missionary-table-presbytery'];
        const allExist = requiredTables.every(id => {
            const element = document.getElementById(id);
            return element && element.style;
        });
        
        if (allExist) {
            console.log('setup.js: 테이블 요소들이 준비되었습니다.');
            initTableToggles();
        } else {
            console.log('setup.js: 일부 테이블 요소가 아직 준비되지 않았습니다.');
        }
    };
    
    // 1초 후 초기화 시작
    setTimeout(waitForTablesAndInit, 1000);
    
    // 중보기도자 수 기능 초기화
    const initPrayerCount = () => {
        if (window.MissionaryMap && window.MissionaryMap.initPrayerCount) {
            window.MissionaryMap.initPrayerCount();
        } else {
            // MissionaryMap이 아직 로드되지 않았으면 재시도
            setTimeout(initPrayerCount, 500);
        }
    };
    
    // 2초 후 중보기도자 수 기능 초기화
    setTimeout(initPrayerCount, 2000);
    
    // 자동재생 모드 설정
    const autoplayGroup = document.getElementById('autoplay-mode-group');
    if (autoplayGroup) {
        autoplayGroup.value = localStorage.getItem('autoplay-mode') || 'fixed'; // UI에 저장된 값 반영
        autoplayGroup.addEventListener('sl-change', () => {
            const newMode = autoplayGroup.value;
            localStorage.setItem('autoplay-mode', newMode);
            // MissionaryMap에 변경사항 전파
            if (window.MissionaryMap && typeof window.MissionaryMap.setAutoplayMode === 'function') {
                window.MissionaryMap.setAutoplayMode(newMode);
            }
        });
    }
    
    // 각종 설정값 적용 (Input)
    const setupInput = (id, storageKey, callback) => {
        const input = document.getElementById(id);
        if(!input) {
            console.log(`setup.js: ${id} 요소를 찾을 수 없습니다.`);
            return;
        }
        input.value = localStorage.getItem(storageKey) || input.value;
        input.addEventListener('sl-change', () => {
            localStorage.setItem(storageKey, input.value);
            callback?.(input.value);
        });
    };
    
    setupInput('news-interval-input', 'news-check-interval');
    setupInput('news-speed-input', 'news-speed', (value) => {
        if (window.setNewsSpeed) {
            window.setNewsSpeed(value);
        }
    });
    setupInput('news-fontsize-input', 'news-fontsize', (value) => {
        const newsBar = document.getElementById('news-bar');
        if (newsBar) {
            newsBar.style.fontSize = `${value}px`;
        }
    });
    setupInput('news-width-input', 'news-width', (value) => {
        const newsBar = document.getElementById('news-bar');
        if (newsBar) {
            newsBar.style.width = `${value}%`;
        }
    });
    setupInput('news-height-input', 'news-height', (value) => {
        const newsBar = document.getElementById('news-bar');
        if (newsBar) {
            newsBar.style.height = `${value}px`;
        }
    });

    // 색상 설정 실시간 적용
    const newsTextColor = document.getElementById('news-text-color');
    if (newsTextColor) {
        newsTextColor.value = localStorage.getItem('news-text-color') || '#ffffff';
        newsTextColor.addEventListener('sl-change', (e) => {
            const color = e.target.value;
            localStorage.setItem('news-text-color', color);
            const newsBar = document.getElementById('news-bar');
            if (newsBar) {
                newsBar.style.setProperty('--news-bar-text', color);
            }
        });
    }
    
    const newsBgColor = document.getElementById('news-bg-color');
    if (newsBgColor) {
        newsBgColor.value = localStorage.getItem('news-bg-color') || '#1a73ff';
        newsBgColor.addEventListener('sl-change', (e) => {
            const color = e.target.value;
            localStorage.setItem('news-bg-color', color);
            const newsBar = document.getElementById('news-bar');
            if (newsBar) {
                newsBar.style.setProperty('--news-bar-bg', color);
            }
        });
    }
    
    // 뉴스레터 업로드 기능
    const newsletterUploadBtn = document.getElementById('newsletter-upload-btn');
    const newsletterLinkBtn = document.getElementById('newsletter-link-btn');
    const missionaryNameInput = document.getElementById('missionary-name-input');
    const missionaryPrayerInput = document.getElementById('missionary-prayer-input');
    const missionaryDateInput = document.getElementById('missionary-date-input');
    
    if (newsletterUploadBtn) {
        newsletterUploadBtn.addEventListener('click', async () => {
            const fileInput = document.getElementById('newsletter-pdf');
            const name = missionaryNameInput?.value?.trim();
            const prayer = missionaryPrayerInput?.value?.trim();
            const date = missionaryDateInput?.value;
            
            if (!name) {
                alert('선교사 이름을 입력해주세요.');
                return;
            }
            
            if (!fileInput.files[0]) {
                alert('PDF 파일을 선택해주세요.');
                return;
            }
            
            const file = fileInput.files[0];
            if (file.type !== 'application/pdf') {
                alert('PDF 파일만 업로드 가능합니다.');
                return;
            }
            
            try {
                // 로딩 상태 표시
                newsletterUploadBtn.disabled = true;
                newsletterUploadBtn.textContent = '업로드 중...';
                
                // Firebase Storage에 업로드 (간단한 구현)
                const storageRef = window.firebase?.storage?.ref();
                if (!storageRef) {
                    throw new Error('Firebase Storage가 초기화되지 않았습니다.');
                }
                
                const fileName = `newsletters/${name}_${Date.now()}.pdf`;
                const fileRef = storageRef.child(fileName);
                const snapshot = await fileRef.put(file);
                const downloadURL = await snapshot.ref.getDownloadURL();
                
                // Firebase Database에 정보 저장
                const db = window.firebase?.database();
                if (db) {
                    await db.ref('newsletters').push({
                        name: name,
                        prayer: prayer || '현지 정착과 건강을 위해',
                        date: date || new Date().toISOString().split('T')[0],
                        url: downloadURL,
                        uploadedAt: new Date().toISOString()
                    });
                }
                
                alert('뉴스레터가 성공적으로 업로드되었습니다.');
                
                // 입력 필드 초기화
                if (fileInput) fileInput.value = '';
                if (missionaryNameInput) missionaryNameInput.value = '';
                if (missionaryPrayerInput) missionaryPrayerInput.value = '';
                if (missionaryDateInput) missionaryDateInput.value = '';
                
            } catch (error) {
                console.error('뉴스레터 업로드 실패:', error);
                alert('업로드에 실패했습니다: ' + error.message);
            } finally {
                newsletterUploadBtn.disabled = false;
                newsletterUploadBtn.textContent = '업로드';
            }
        });
    }
    
    if (newsletterLinkBtn) {
        newsletterLinkBtn.addEventListener('click', async () => {
            const name = missionaryNameInput?.value?.trim();
            const prayer = missionaryPrayerInput?.value?.trim();
            const date = missionaryDateInput?.value;
            
            if (!name) {
                alert('선교사 이름을 입력해주세요.');
                return;
            }
            
            const link = prompt('뉴스레터 외부 링크를 입력해주세요:');
            if (!link) return;
            
            try {
                // Firestore에 링크 정보 저장
                const firestore = window.firebase?.firestore();
                if (firestore) {
                    await firestore.collection('newsletters').add({
                        missionaryName: name,
                        summary: prayer || '현지 정착과 건강을 위해',
                        date: date || new Date().toISOString().split('T')[0],
                        url: link,
                        createdAt: window.firebase.firestore.FieldValue.serverTimestamp(),
                        updatedAt: window.firebase.firestore.FieldValue.serverTimestamp(),
                        isExternalLink: true
                    });
                } else {
                    throw new Error('Firestore가 초기화되지 않았습니다.');
                }
                
                alert('뉴스레터 링크가 성공적으로 저장되었습니다.');
                
                // 입력 필드 초기화
                if (missionaryNameInput) missionaryNameInput.value = '';
                if (missionaryPrayerInput) missionaryPrayerInput.value = '';
                if (missionaryDateInput) missionaryDateInput.value = '';
                
            } catch (error) {
                // 권한 오류는 일반적인 상황이므로 별도 처리
                if (error.code === 'permission-denied') {
                    console.log('Firestore 쓰기 권한이 없습니다. (일반적인 상황)');
                    alert('뉴스레터 링크 저장 권한이 없습니다. 관리자에게 문의하세요.');
                } else {
                    console.error('뉴스레터 링크 저장 실패:', error);
                    alert('저장에 실패했습니다: ' + error.message);
                }
            }
        });
    }
}); 