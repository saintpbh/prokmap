// accessibility.js - 접근성 개선을 위한 스크립트

class AccessibilityManager {
    constructor() {
        this.isEnabled = false;
        this.consoleMessages = [];
        this.init();
    }

    init() {
        // 접근성 모드 비활성화 상태로 초기화
        console.log('접근성 모드가 비활성화되었습니다.');
        
        // 콘솔 가로채기 비활성화
        // this.interceptConsole();
        
        // 키보드 단축키 설정 (기본 기능만 유지)
        this.setupKeyboardShortcuts();
        
        // UI 요소 강화 (기본 접근성 속성만 유지)
        this.enhanceUIElements();
    }

    // 접근성 토글 버튼 생성 (비활성화)
    createAccessibilityToggle() {
        // 접근성 모드 비활성화로 인해 토글 버튼 생성하지 않음
        return;
        
        // 기존 코드는 주석 처리
        /*
        const toggle = document.createElement('button');
        toggle.id = 'accessibility-toggle';
        toggle.innerHTML = '♿';
        toggle.title = '접근성 모드 토글 (Alt+A)';
        toggle.className = 'accessibility-toggle';
        toggle.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 50px;
            height: 50px;
            border-radius: 50%;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            border: none;
            font-size: 20px;
            cursor: pointer;
            z-index: 1000;
            transition: all 0.3s ease;
        `;
        
        toggle.addEventListener('click', () => this.toggleAccessibilityMode());
        document.body.appendChild(toggle);
        */
    }

    toggleAccessibilityMode() {
        this.isEnabled = !this.isEnabled;
        const toggle = document.getElementById('accessibility-toggle');
        
        if (this.isEnabled) {
            toggle.innerHTML = '🔇 접근성 모드 끄기';
            toggle.style.background = 'rgba(76, 175, 80, 0.8)';
            this.announce('접근성 모드가 활성화되었습니다.');
        } else {
            toggle.innerHTML = '🔊 접근성 모드';
            toggle.style.background = 'rgba(0, 0, 0, 0.8)';
            this.announce('접근성 모드가 비활성화되었습니다.');
        }
    }

    interceptConsole() {
        const originalLog = console.log;
        const originalWarn = console.warn;
        const originalError = console.error;

        console.log = (...args) => {
            originalLog.apply(console, args);
            this.handleConsoleMessage('log', args);
        };

        console.warn = (...args) => {
            originalWarn.apply(console, args);
            this.handleConsoleMessage('warn', args);
        };

        console.error = (...args) => {
            originalError.apply(console, args);
            this.handleConsoleMessage('error', args);
        };
    }

    handleConsoleMessage(type, args) {
        if (!this.isEnabled) return;

        const message = args.join(' ');
        const timestamp = new Date().toLocaleTimeString();
        
        this.consoleMessages.push({
            type,
            message,
            timestamp
        });

        // 최근 10개 메시지만 유지
        if (this.consoleMessages.length > 10) {
            this.consoleMessages.shift();
        }

        // 중요한 메시지만 음성 안내
        if (type === 'error' || message.includes('중보기도자') || message.includes('선교사')) {
            this.announce(message);
        }
    }

    announce(message) {
        if (!this.isEnabled) return;

        // 기존 안내 요소 제거
        const existingAnnouncement = document.getElementById('accessibility-announcement');
        if (existingAnnouncement) {
            existingAnnouncement.remove();
        }

        // 새로운 안내 요소 생성
        const announcement = document.createElement('div');
        announcement.id = 'accessibility-announcement';
        announcement.setAttribute('aria-live', 'polite');
        announcement.setAttribute('aria-atomic', 'true');
        announcement.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.9);
            color: white;
            padding: 20px 30px;
            border-radius: 10px;
            font-size: 16px;
            z-index: 810;
            max-width: 400px;
            text-align: center;
            backdrop-filter: blur(10px);
            border: 2px solid rgba(255, 255, 255, 0.2);
        `;
        announcement.textContent = message;

        document.body.appendChild(announcement);

        // 3초 후 자동 제거
        setTimeout(() => {
            if (announcement.parentNode) {
                announcement.remove();
            }
        }, 3000);
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Alt + A: 접근성 모드 토글 (비활성화)
            if (e.altKey && e.key === 'a') {
                e.preventDefault();
                console.log('접근성 모드가 비활성화되어 있습니다.');
                return;
            }

            // Alt + C: 콘솔 메시지 읽기 (비활성화)
            if (e.altKey && e.key === 'c') {
                e.preventDefault();
                console.log('접근성 모드가 비활성화되어 있습니다.');
                return;
            }

            // Alt + H: 도움말 (비활성화)
            if (e.altKey && e.key === 'h') {
                e.preventDefault();
                console.log('접근성 모드가 비활성화되어 있습니다.');
                return;
            }
        });

        // 전체화면 모드 감지 (기본 기능은 유지)
        this.detectFullscreenMode();
    }

    detectFullscreenMode() {
        const updateFullscreenClass = () => {
            if (document.fullscreenElement || 
                document.webkitFullscreenElement || 
                document.mozFullScreenElement || 
                document.msFullscreenElement) {
                document.body.classList.add('fullscreen-mode');
            } else {
                document.body.classList.remove('fullscreen-mode');
            }
        };

        // 전체화면 변경 이벤트 리스너
        document.addEventListener('fullscreenchange', updateFullscreenClass);
        document.addEventListener('webkitfullscreenchange', updateFullscreenClass);
        document.addEventListener('mozfullscreenchange', updateFullscreenClass);
        document.addEventListener('MSFullscreenChange', updateFullscreenClass);

        // 초기 상태 확인
        updateFullscreenClass();
    }

    readConsoleMessages() {
        if (!this.isEnabled) {
            this.announce('접근성 모드를 먼저 활성화해주세요.');
            return;
        }

        if (this.consoleMessages.length === 0) {
            this.announce('읽을 콘솔 메시지가 없습니다.');
            return;
        }

        const recentMessages = this.consoleMessages.slice(-3);
        const messageText = recentMessages.map(msg => 
            `${msg.timestamp}: ${msg.message}`
        ).join('. ');

        this.announce(`최근 콘솔 메시지: ${messageText}`);
    }

    showHelp() {
        const helpText = `
            접근성 단축키:
            Alt + A: 접근성 모드 토글
            Alt + C: 콘솔 메시지 읽기
            Alt + H: 도움말 표시
        `;
        this.announce(helpText);
    }

    // UI 요소에 접근성 속성 추가
    enhanceUIElements() {
        // 중보기도자 수 요소
        const prayerCount = document.getElementById('prayer-count-info');
        if (prayerCount) {
            prayerCount.setAttribute('role', 'status');
            prayerCount.setAttribute('aria-live', 'polite');
        }

        // 지도 가이드
        const mapGuide = document.getElementById('mapGuide');
        if (mapGuide) {
            mapGuide.setAttribute('role', 'note');
            mapGuide.setAttribute('aria-label', '지도 사용 안내');
        }

        // 검색 입력창
        const searchInput = document.getElementById('missionary-search');
        if (searchInput) {
            searchInput.setAttribute('aria-label', '선교사 검색');
            searchInput.setAttribute('aria-describedby', 'search-help');
        }
    }
}

// 페이지 로드 시 접근성 관리자 초기화
document.addEventListener('DOMContentLoaded', () => {
    window.accessibilityManager = new AccessibilityManager();
    
    // DOM이 완전히 로드된 후 UI 요소 강화
    setTimeout(() => {
        window.accessibilityManager.enhanceUIElements();
    }, 1000);
});

// 전역 함수로 접근성 기능 노출 (비활성화)
window.announceToScreenReader = (message) => {
    // 접근성 모드가 비활성화되어 있음
    console.log('접근성 모드가 비활성화되어 있습니다.');
};

window.toggleAccessibilityMode = () => {
    // 접근성 모드가 비활성화되어 있음
    console.log('접근성 모드가 비활성화되어 있습니다.');
}; 