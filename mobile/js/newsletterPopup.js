// missionary-map-app/public/js/newsletterPopup.js
// 뉴스레터(주로 PDF) 오버레이를 표시하는 유틸리티
// 0613-3.html 구현을 모듈화하여 재사용 가능하도록 수정
(function() {
    /**
     * 뉴스레터 URL을 받아 오버레이를 띄운다.
     * @param {string} newsletterUrlEncoded encodeURIComponent 처리된 URL
     */
    function showNewsletter(newsletterUrlEncoded) {
        const url = decodeURIComponent(newsletterUrlEncoded);

        // 기존 오버레이 제거
        const existing = document.getElementById('newsletter-overlay');
        if (existing) existing.remove();

        // 오버레이 컨테이너 생성
        const overlay = document.createElement('div');
        overlay.id = 'newsletter-overlay';
        overlay.innerHTML = `
            <div id="newsletter-content">
                <button id="newsletter-close-btn" title="닫기">✖</button>
                <div id="newsletter-media-area"></div>
            </div>`;
        document.body.appendChild(overlay);

        const area = overlay.querySelector('#newsletter-media-area');
        if (!area) return;

        // 컨텐츠 타입에 따라 렌더링 방식 결정
        if (/\.(pdf)$/i.test(url)) {
            area.innerHTML = `
                <iframe src="https://mozilla.github.io/pdf.js/web/viewer.html?file=${encodeURIComponent(url)}" 
                        style="width:90vw; height:75vh;" frameborder="0" allowfullscreen></iframe>
                <div style="font-size:0.95em; color:#777; margin-top:6px;">
                    PDF가 정상표시 안될 때 
                    <a href="${url}" target="_blank" style="color:#1574d4; text-decoration:underline;">새 창에서 열기</a>
                </div>`;
        } else if (/\.(png|jpe?g|gif|webp)$/i.test(url)) {
            area.innerHTML = `<img src="${url}" alt="Newsletter" style="max-width:90vw; max-height:80vh;">`;
        } else if (/youtube\.com|youtu\.be/.test(url)) {
            const embedUrl = url
                .replace('watch?v=', 'embed/')
                .replace('youtu.be/', 'youtube.com/embed/');
            area.innerHTML = `<iframe width="800" height="450" src="${embedUrl}" frameborder="0" allowfullscreen></iframe>`;
        } else {
            area.innerHTML = `<a href="${url}" target="_blank">${url}</a>`;
        }

        // 닫기 기능
        const closeBtn = overlay.querySelector('#newsletter-close-btn');
        closeBtn.addEventListener('click', () => overlay.remove());
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) overlay.remove();
        });
    }

    // 전역 노출
    window.showNewsletter = showNewsletter;
})(); 