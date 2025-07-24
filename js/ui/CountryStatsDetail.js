// 국가별 파송현황 상세 전체화면(글라스모피즘)
(function() {
  function showCountryStatsScreen() {
    const screen = document.getElementById('country-stats-screen');
    if (!screen) return;
    // 첫화면 숨기기
    document.getElementById('mobile-landing').style.display = 'none';
    screen.style.display = 'flex';
    screen.innerHTML = `
      <div class="glass-card" style="position:relative;">
        <button class="glass-close-btn" id="close-country-stats" style="position:absolute;top:12px;right:16px;">✕</button>
        <div class="glass-title">국가별 파송현황</div>
        <table class="glass-table">
          <thead><tr><th>국기</th><th>국가</th><th style='text-align:right;'>인원</th></tr></thead>
          <tbody id="country-stats-tbody"></tbody>
        </table>
      </div>
    `;
    // 닫기 버튼
    screen.querySelector('#close-country-stats').onclick = function() {
      screen.style.display = 'none';
      document.getElementById('mobile-landing').style.display = '';
    };
    // 데이터 렌더링
    const tbody = screen.querySelector('#country-stats-tbody');
    // DataManager가 없거나 데이터가 없으면 캐시 사용
    const stats = (window.DataManager && window.DataManager.getCountryStats && Object.keys(window.DataManager.getCountryStats()).length > 0)
      ? window.DataManager.getCountryStats()
      : (window.cachedCountryStats || {});
    const countries = Object.keys(stats).sort((a,b)=>a.localeCompare(b,'ko'));
    // missionaryMap.js의 COUNTRY_FLAGS 우선 참조
    const flagMap = (window.CountryBackgrounds && window.CountryBackgrounds.COUNTRY_FLAGS) ? window.CountryBackgrounds.COUNTRY_FLAGS : (window.MissionaryMap?.constants?.COUNTRY_FLAGS || {});
    tbody.innerHTML = countries.map(country => {
      const flagCode = flagMap[country];
      let flagImg = '';
      if (flagCode) {
        flagImg = `<img src='https://flagcdn.com/w40/${flagCode}.png' alt='' style='width:28px;height:20px;border-radius:3px;'>`;
      } else {
        flagImg = `<span style='font-size:1.3em;'>🌐</span>`;
      }
      return `<tr><td>${flagImg}</td><td>${country}</td><td style='text-align:right;'><b>${stats[country]}</b></td></tr>`;
    }).join('');
  }
  window.showCountryStatsDetail = showCountryStatsScreen;
})(); 