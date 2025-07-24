// 긴급뉴스 바(news-bar) 기능 분리
(function() {
  let newsListCache = [];
  let updateTimer = null;
  let currentSpeed = parseInt(localStorage.getItem('news-speed'), 10) || 100000;

  function applyNewsSpeed() {
    const bar = document.getElementById('news-bar');
    if (!bar) return;
    const textEl = bar.querySelector('.news-text');
    if (textEl) {
      textEl.style.animationDuration = currentSpeed + 'ms';
    }
  }

  window.setNewsSpeed = function(ms) {
    currentSpeed = parseInt(ms, 10) || 100000;
    localStorage.setItem('news-speed', currentSpeed);
    applyNewsSpeed();
  };

  // 뉴스 체크 주기 설정 함수 추가
  window.setNewsCheckInterval = function(minutes) {
    const intervalMin = parseInt(minutes, 10) || 10;
    localStorage.setItem('news-check-interval', intervalMin);
    
    // 기존 타이머 정리
    if (updateTimer) {
      clearTimeout(updateTimer);
    }
    
    // 새 타이머 설정
    updateTimer = setTimeout(fetchNewsFromSheet, intervalMin * 60000);
    
    console.log(`뉴스 체크 주기가 ${intervalMin}분으로 변경되었습니다.`);
  };

  // 숨쉬기(글로우) 애니메이션용 CSS 추가
  function ensureGlowStyle() {
    if (!document.getElementById('news-glow-style')) {
      const style = document.createElement('style');
      style.id = 'news-glow-style';
      style.innerHTML = `
        @keyframes glow-breath {
          0%,100% { box-shadow: 0 0 0px 0px #fff, 0 0 0px 0px #fff; }
          50% { box-shadow: 0 0 24px 8px #fff8, 0 0 48px 16px #fff4; }
        }
        #news-bar.news-loading {
          animation: glow-breath 2.2s ease-in-out infinite;
        }
      `;
      document.head.appendChild(style);
    }
  }

  // news.js - 긴급뉴스 기능 (Shoelace 기반)

  /**
   * 뉴스바 엘리먼트를 생성하고 UI에 추가합니다.
   * 이미 생성된 경우 기존 엘리먼트를 반환합니다.
   * @returns {HTMLElement} 뉴스바 엘리먼트
   */
  function createNewsBar() {
    let newsBar = document.getElementById('news-bar');
    if (newsBar) {
      return newsBar;
    }

    newsBar = document.createElement('div');
    newsBar.id = 'news-bar';
    document.body.appendChild(newsBar);

    const closeBtn = document.createElement('sl-icon-button');
    closeBtn.name = 'x-lg';
    closeBtn.label = '닫기';
    closeBtn.className = 'close-news-btn';
    closeBtn.addEventListener('click', () => {
      newsBar.style.display = 'none';
      document.getElementById('mapGuide').style.display = '';
      localStorage.setItem('news-closed-by-user', 'true');
    });
    newsBar.appendChild(closeBtn);

    return newsBar;
  }

  /**
   * "뉴스 불러오는 중..." 상태의 뉴스바를 표시합니다.
   */
  function showLoadingNewsBar() {
    const newsBar = createNewsBar();
    newsBar.className = 'news-loading';
    newsBar.style.display = 'flex'; // 로딩 중일 때만 표시
    document.getElementById('mapGuide').style.display = 'none';
    
    newsBar.innerHTML = '<div class="loading-text">뉴스를 불러오는 중입니다...</div>' + newsBar.innerHTML;
    
    // 글로우 애니메이션 적용
    const glow = document.createElement('div');
    glow.className = 'glow-breath';
    newsBar.appendChild(glow);
  }

  /**
   * 실제 뉴스 내용을 담은 뉴스바를 표시합니다.
   * @param {Array<string>} newsItems - 표시할 뉴스 문자열 배열
   */
  function showNewsBar(newsItems) {
    const newsBar = createNewsBar();
    newsBar.className = ''; // 로딩 클래스 제거
    newsBar.style.display = 'flex'; // 뉴스가 있을 때만 표시
    document.getElementById('mapGuide').style.display = 'none';
    localStorage.removeItem('news-closed-by-user');

    const newsContent = newsItems.join(' *** ');
    const marqueeContainer = document.createElement('div');
    marqueeContainer.className = 'marquee-container';

    const marqueeText = document.createElement('div');
    marqueeText.className = 'marquee-text';
    marqueeText.textContent = newsContent;
    
    marqueeContainer.appendChild(marqueeText);

    // 기존 내용 삭제 (닫기 버튼 제외)
    while (newsBar.firstChild && newsBar.firstChild.nodeName !== 'SL-ICON-BUTTON') {
      newsBar.removeChild(newsBar.firstChild);
    }
    newsBar.prepend(marqueeContainer);
    
    // 스타일 적용
    setNewsStylesFromStorage();
    
    // 마퀴 애니메이션 시작
    setTimeout(() => {
      if (marqueeText) {
        marqueeText.style.animation = 'marquee-left 100s linear infinite';
      }
    }, 100);
  }

  /**
   * 로컬 스토리지에서 뉴스바 관련 스타일을 읽어와 적용합니다.
   */
  function setNewsStylesFromStorage() {
    const newsBar = document.getElementById('news-bar');
    if (!newsBar) return;

    const speed = localStorage.getItem('news-speed') || '100';
    const fontSize = localStorage.getItem('news-fontsize') || '18';
    const width = localStorage.getItem('news-width') || '80';
    const height = localStorage.getItem('news-height') || '50';
    const textColor = localStorage.getItem('news-text-color') || '#ffffff';
    const bgColor = localStorage.getItem('news-bg-color') || '#1a73ff';

    const marqueeText = newsBar.querySelector('.marquee-text');
    if (marqueeText) {
      // 속도를 초 단위로 변환하여 애니메이션에 적용
      const speedSeconds = parseInt(speed, 10);
      marqueeText.style.animationDuration = `${speedSeconds}s`;
    }
    
    newsBar.style.setProperty('--news-bar-text', textColor);
    newsBar.style.setProperty('--news-bar-bg', bgColor);
    newsBar.style.fontSize = `${fontSize}px`;
    newsBar.style.width = `${width}%`;
    newsBar.style.height = `${height}px`;
  }

  async function fetchNewsFromSheet() {
    showLoadingNewsBar();
    const url = 'https://docs.google.com/spreadsheets/d/1Low1INdkDKbucXAzL4i59SpIPXBNmxzz23mo03EoVuI/export?format=csv&gid=0';
    try {
      const res = await fetch(url);
      const text = await res.text();
      const parsed = Papa.parse(text, { header: true });
      const newsList = parsed.data
        .filter(row => {
          const idx = parseInt(row.Index, 10);
          return !isNaN(idx) && idx >= 1 && row.News && row.News.trim();
        })
        .map(row => row.News.trim());
      if (newsList.length > 0) {
        // 뉴스가 있으면 뉴스바 표시 및 토글 on
        localStorage.setItem('news-toggle', 'on');
        showNewsBar(newsList);
      } else {
        // 뉴스가 없으면 뉴스바 완전히 숨기기
        localStorage.setItem('news-toggle', 'off');
        localStorage.setItem('news-bar-hidden', 'true');
        var bar = document.getElementById('news-bar');
        if (bar) {
          bar.style.display = 'none';
          bar.remove(); // DOM에서 완전히 제거
        }
        var guide = document.getElementById('mapGuide');
        if (guide) guide.style.display = '';
        console.log('뉴스 데이터가 없어 뉴스바를 숨겼습니다.');
      }
    } catch (e) {
      // 뉴스를 불러오지 못했을 때 뉴스바를 숨깁니다.
      localStorage.setItem('news-toggle', 'off');
      localStorage.setItem('news-bar-hidden', 'true');
      var bar = document.getElementById('news-bar');
      if (bar) {
        bar.style.display = 'none';
        bar.remove(); // DOM에서 완전히 제거
      }
      var guide = document.getElementById('mapGuide');
      if (guide) guide.style.display = '';
      console.error('뉴스 데이터를 불러오는 데 실패했습니다:', e);
    }
    // 주기(분 단위) 설정값 적용
    let intervalMin = parseInt(localStorage.getItem('news-check-interval'), 10);
    if (isNaN(intervalMin) || intervalMin < 1) intervalMin = 10;
    if (updateTimer) clearTimeout(updateTimer);
    updateTimer = setTimeout(fetchNewsFromSheet, intervalMin * 60000);
  }

  window.showNewsBar = showNewsBar;
  window.fetchNewsFromSheet = fetchNewsFromSheet;

  // DOMContentLoaded에서 뉴스바/토글 기본 상태를 명확히 설정
  window.addEventListener('DOMContentLoaded', function() {
    // 뉴스바는 기본적으로 완전히 숨김
    var bar = document.getElementById('news-bar');
    if (bar) {
      bar.style.display = 'none';
      bar.classList.remove('news-loading');
      // 기존 뉴스바가 있으면 완전히 제거
      bar.remove();
    }
    // 안내문구는 항상 보임
    var guide = document.getElementById('mapGuide');
    if (guide) guide.style.display = '';
    // 토글도 off로 설정
    localStorage.setItem('news-toggle', 'off');
    // 뉴스바 숨김 상태 저장
    localStorage.setItem('news-bar-hidden', 'true');
    // 최초 1회 뉴스 체크만 시작 (fetchNewsFromSheet 내부에서 주기적 체크)
    fetchNewsFromSheet();
  });
})(); 