import { state } from './state.js';
import { reportApi } from './api.js';

export const reportUi = {
    renderPreview() {
        const listEl = document.getElementById('previewList');
        const countEl = document.getElementById('countDisplay');
        const uploadBtn = document.getElementById('uploadBtn');

        listEl.innerHTML = '';
        countEl.textContent = state.parsedData.length;
        uploadBtn.disabled = state.parsedData.length === 0;

        if (state.parsedData.length === 0) {
            listEl.innerHTML = '<div style="padding: 2rem; text-align: center; color: #999;">분석된 데이터가 없습니다.</div>';
            return;
        }

        state.parsedData.forEach((item, index) => {
            const match = reportApi.findMissionaryByName(item.name);
            const statusClass = match ? 'status-ok' : 'status-error';
            const matchStatus = match ? `✅ 매칭됨: ${match.name}` : '❌ 매칭 실패 (DB에 없음)';

            const div = document.createElement('div');
            div.className = 'preview-item';
            div.innerHTML = `
                <div class="preview-header">
                    <span>
                        <span style="font-size:1.1em; color:#333;">${item.name}</span>
                        <small class="${statusClass}" style="margin-left: 8px; font-weight:normal;">${matchStatus}</small>
                    </span>
                    <span>
                        ${item.country ? `<span class="badge-country">${item.country}</span>` : ''}
                        <span class="badge-date">${item.date}</span>
                    </span>
                </div>
                
                ${item.summary.length > 0 ? `
                    <div style="margin-bottom: 4px; font-weight: bold; font-size: 0.85em; color: #555;">📋 사역 보고</div>
                    <div class="text-preview">${item.summary.join('\n')}</div>
                ` : ''}
                
                ${item.prayer.length > 0 ? `
                    <div style="margin-top: 8px; margin-bottom: 4px; font-weight: bold; font-size: 0.85em; color: #555;">🙏 기도 제목</div>
                    <div class="text-preview">${item.prayer.join('\n')}</div>
                ` : ''}
            `;
            listEl.appendChild(div);
        });
    }
};
