import { state } from './state.js';

export const certificateUi = {
    displaySearchResults(results) {
        const container = document.getElementById('searchResults');
        if (!container) return;

        if (results.length === 0) {
            container.innerHTML = '<p style="color: #999;">검색 결과가 없습니다.</p>';
            return;
        }

        container.innerHTML = results.map(m => `
            <div class="card result-item" data-id="${m.id}" style="padding: 1rem; margin-bottom: 0.5rem; cursor: pointer;">
                <strong>${m.name}</strong> - ${m.country || '정보없음'} (${m.presbytery || '정보없음'})
            </div>
        `).join('');

        container.querySelectorAll('.result-item').forEach(item => {
            item.addEventListener('click', () => {
                this.selectMissionary(item.dataset.id);
            });
        });
    },

    selectMissionary(id) {
        state.selectedMissionary = state.missionaries.find(m => m.id === id);
        document.getElementById('certificateForm').style.display = 'block';
        document.getElementById('searchResults').innerHTML = `
            <div class="card" style="padding: 1rem; background: #e3f2fd;">
                선택됨: <strong>${state.selectedMissionary.name}</strong>
            </div>
        `;
    },

    generateCertificate() {
        if (!state.selectedMissionary) {
            alert('선교사를 선택해주세요.');
            return;
        }

        const type = document.getElementById('certificateType').value;
        const langEl = document.querySelector('input[name="language"]:checked');
        const language = langEl ? langEl.value : 'ko';

        if (!type) {
            alert('증명서 종류를 선택해주세요.');
            return;
        }

        const preview = document.getElementById('certificatePreview');
        const previewArea = document.getElementById('previewArea');

        preview.innerHTML = `
            <div style="border: 2px solid #333; padding: 3rem; text-align: center; background: white;">
                <h2>${language === 'ko' ? this.getCertificateTitle(type) : this.getCertificateTitleEn(type)}</h2>
                <br><br>
                <p>${language === 'ko' ? '성명' : 'Name'}: <strong>${state.selectedMissionary.name}</strong></p>
                <p>${language === 'ko' ? '파송지' : 'Mission Field'}: <strong>${state.selectedMissionary.country || ''}, ${state.selectedMissionary.city || ''}</strong></p>
                <p>${language === 'ko' ? '소속' : 'Organization'}: <strong>${state.selectedMissionary.organization || '한국기독교장로회'}</strong></p>
                <p>${language === 'ko' ? '파송일' : 'Dispatch Date'}: <strong>${state.selectedMissionary.sent_date || '정보없음'}</strong></p>
                <br><br>
                <p>${language === 'ko' ? '발급일' : 'Issue Date'}: ${new Date().toLocaleDateString('ko-KR')}</p>
                <p>${language === 'ko' ? '발급기관: 한국기독교장로회 국제협력선교' : 'Issuer: PROK International Cooperation Mission'}</p>
            </div>
            <br>
            <p style="text-align: center; color: #666;">
                * PDF 생성 기능은 추후 구현 예정입니다. 현재는 화면 캡처하거나 인쇄 기능을 사용하세요.
            </p>
        `;

        previewArea.style.display = 'block';
    },

    getCertificateTitle(type) {
        switch (type) {
            case 'employment': return '재직증명서';
            case 'dispatch': return '파송증명서';
            case 'career': return '경력증명서';
            default: return '증명서';
        }
    },

    getCertificateTitleEn(type) {
        switch (type) {
            case 'employment': return 'Certificate of Employment';
            case 'dispatch': return 'Certificate of Dispatch';
            case 'career': return 'Certificate of Career';
            default: return 'Certificate';
        }
    }
};
