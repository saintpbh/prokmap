// utils.js
// 모든 유틸 함수는 window에 등록

// 예시: 기존에 export function foo() 였다면 아래처럼 변환
// window.foo = function() { ... }

// 실제 함수 내용을 아래에 추가해 주세요.

window.isRecent = function(updateDate) {
    if (!updateDate) return false;
    const days = (new Date() - new Date(updateDate)) / (1000 * 60 * 60 * 24);
    return days < 60;
}

window.getLatLng = function(item, country, constants) {
    if (item.lat && item.lng && !isNaN(item.lat) && !isNaN(item.lng)) {
        return [parseFloat(item.lat), parseFloat(item.lng)];
    }
    if (constants.CITY_LATLNGS && item.city && constants.CITY_LATLNGS[item.city]) {
        return constants.CITY_LATLNGS[item.city];
    }
    return constants.LATLNGS[country] || [20, 0];
}

// Firebase에서 missionaries, news 데이터를 불러오는 fetchData 함수
window.fetchData = function(callback) {
  console.log('fetchData: Firebase 데이터 로딩 시작...');
  
  if (!window.firebase || !window.firebase.database) {
    console.error('fetchData: Firebase SDK가 로드되지 않았습니다.');
    callback(new Error('Firebase not initialized'));
    return;
  }
  
  const db = window.firebase.database();
  
  // missionaries 데이터 실시간 리스너 설정 (Admin의 상세 데이터 포함)
  db.ref('missionaries').on('value', snapshot => {
    console.log('fetchData: missionaries 데이터 실시간 업데이트');
    const missionaries = [];
    snapshot.forEach(child => {
      const data = child.val();
      if (data && data.name && data.name.trim() !== '') {
        // Admin에서 관리하는 상세 정보 포함
        const enhancedMissionary = {
          ...data,
          // 기도제목 (최신 뉴스레터 요약 또는 기본 기도제목)
          prayerTitle: data.latestNewsletterSummary || data.prayerTitle || data.prayer || '기도로 함께해 주세요',
          // 최신 뉴스레터 정보
          latestNewsletter: data.latestNewsletter || null,
          latestNewsletterDate: data.latestNewsletterDate || data.sentDate || null,
          // 상세 정보
          englishName: data.englishName || data.english_name || '',
          localPhone: data.localPhone || data.local_phone || '',
          localAddress: data.localAddress || data.local_address || '',
          organization: data.organization || data.organization_name || '',
          presbytery: data.presbytery || '',
          // 가족 정보
          family: data.family || [],
          // 후원자 정보
          supporters: data.supporters || [],
          // 상태 정보
          status: data.status || 'active',
          isActive: data.isActive !== false, // 기본값은 true
          // 메타데이터
          createdAt: data.createdAt || null,
          updatedAt: data.updatedAt || null
        };
        missionaries.push(enhancedMissionary);
      }
    });
    console.log(`fetchData: ${missionaries.length}명의 선교사 데이터 로드됨 (상세 정보 포함)`);
    
    // 콜백 호출
    callback(null, { missionaries, news: [] });
  });
  
  // news 데이터 실시간 리스너 설정
  db.ref('news').on('value', newsSnap => {
    console.log('fetchData: news 데이터 실시간 업데이트');
    const news = [];
    newsSnap.forEach(child => {
      const data = child.val();
      if (data) {
        news.push(data);
      }
    });
    console.log(`fetchData: ${news.length}개의 뉴스 데이터 로드됨`);
  });
};

// 공통 함수들 - 중복 제거를 위해 통합
window.CommonUtils = {
  // 아바타 SVG 생성 함수
  createAvatarSVG: function(name, size = 80) {
    if (!name) return '';
    
    // 이름에서 이니셜 추출
    const initials = name.split(' ').map(n => n.charAt(0)).join('').toUpperCase().slice(0, 2);
    
    // 배경색 생성 (이름 기반)
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
      '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
    ];
    const colorIndex = name.charCodeAt(0) % colors.length;
    const bgColor = colors[colorIndex];
    
    const svgString = `
      <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
        <circle cx="${size/2}" cy="${size/2}" r="${size/2}" fill="${bgColor}"/>
        <text x="${size/2}" y="${size/2 + size/8}" font-family="Arial, sans-serif" font-size="${size/3}" 
              fill="white" text-anchor="middle" dominant-baseline="middle" font-weight="bold">
          ${initials}
        </text>
      </svg>
    `;
    
    return `data:image/svg+xml;base64,${this.safeBtoa(svgString)}`;
  },

  // 안전한 base64 인코딩 함수
  safeBtoa: function(str) {
    try {
      return btoa(unescape(encodeURIComponent(str)));
    } catch (e) {
      console.error('safeBtoa error:', e);
      return '';
    }
  },

  // 토스트 메시지 표시 함수
  showToast: function(message, type = 'info') {
    // 기존 토스트 제거
    const existingToast = document.querySelector('.toast-message');
    if (existingToast) {
      existingToast.remove();
    }

    // 토스트 컨테이너 생성
    const toast = document.createElement('div');
    toast.className = `toast-message toast-${type}`;
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 20px;
      border-radius: 8px;
      color: white;
      font-weight: 500;
      z-index: 1000;
      max-width: 300px;
      word-wrap: break-word;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      transform: translateX(100%);
      transition: transform 0.3s ease;
    `;

    // 타입별 스타일 설정
    const styles = {
      success: { backgroundColor: '#4CAF50' },
      error: { backgroundColor: '#F44336' },
      warning: { backgroundColor: '#FF9800' },
      info: { backgroundColor: '#2196F3' }
    };

    Object.assign(toast.style, styles[type] || styles.info);
    toast.textContent = message;

    document.body.appendChild(toast);

    // 애니메이션
    setTimeout(() => {
      toast.style.transform = 'translateX(0)';
    }, 100);

    // 자동 제거
    setTimeout(() => {
      toast.style.transform = 'translateX(100%)';
      setTimeout(() => {
        if (toast.parentNode) {
          toast.remove();
        }
      }, 300);
    }, 3000);
  },

  // 디바운스 함수
  debounce: function(func, wait) {
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

  // 파일 크기 포맷팅 함수
  formatFileSize: function(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  // 날짜 포맷팅 함수
  formatDate: function(date) {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  },

  // 안전한 JSON 파싱 함수
  safeJSONParse: function(str, defaultValue = null) {
    try {
      return JSON.parse(str);
    } catch (e) {
      console.error('JSON 파싱 오류:', e);
      return defaultValue;
    }
  },

  // 안전한 함수 실행 함수
  safeExecute: function(fn, ...args) {
    try {
      return fn(...args);
    } catch (error) {
      console.error('함수 실행 오류:', error);
      return null;
    }
  }
}; 