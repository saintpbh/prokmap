// 노회별 파송현황 상세 전체화면(글라스모피즘)
(function() {
  function showPresbyteryStatsScreen() {
    const screen = document.getElementById('presbytery-stats-screen');
    if (!screen) return;
    document.getElementById('mobile-landing').style.display = 'none';
    screen.style.display = 'flex';
    screen.innerHTML = `
      <div class="glass-card" style="position:relative;">
        <button class="glass-close-btn" id="close-presbytery-stats" style="position:absolute;top:12px;right:16px;">✕</button>
        <div class="glass-title">노회별 파송현황</div>
        <table class="glass-table">
          <thead><tr><th style='width:30%;'>노회</th><th style='width:20%;'>인원</th><th class='country-cell' style='width:50%;text-align:center;'>국가</th></tr></thead>
          <tbody id="presbytery-stats-tbody"></tbody>
        </table>
      </div>
    `;
    // 닫기 버튼
    screen.querySelector('#close-presbytery-stats').onclick = function() {
      screen.style.display = 'none';
      document.getElementById('mobile-landing').style.display = '';
    };
    // 데이터 렌더링
    const tbody = screen.querySelector('#presbytery-stats-tbody');
    // DataManager가 없거나 데이터가 없으면 캐시 사용
    const stats = (window.DataManager && window.DataManager.getPresbyteryStats && Object.keys(window.DataManager.getPresbyteryStats()).length > 0)
      ? window.DataManager.getPresbyteryStats()
      : (window.cachedPresbyteryStats || {});
    const members = (window.DataManager && window.DataManager.state && window.DataManager.state.missionaries && window.DataManager.state.missionaries.length > 0)
      ? window.DataManager.state.missionaries
      : (window.cachedMissionaries || []);
    const presbyteries = Object.keys(stats).sort((a,b)=>a.localeCompare(b,'ko'));
    tbody.innerHTML = presbyteries.map(presbytery => {
      const missionaryList = members.filter(m => m.presbytery === presbytery);
      const countrySet = new Set(missionaryList.map(m => m.country).filter(Boolean));
      return `<tr><td style='width:30%;'>${presbytery}</td><td style='text-align:left;width:20%;'><b>${stats[presbytery]}</b></td><td class='country-cell' style='width:50%;'>${[...countrySet].join(', ')}</td></tr>`;
    }).join('');
  }
  window.showPresbyteryStatsDetail = showPresbyteryStatsScreen;
})(); 