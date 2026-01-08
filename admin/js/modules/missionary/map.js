/**
 * Missionary Map Module
 */
import { AdminUtils } from '../../core/utils.js';
import { state } from './state.js';

export async function initMap() {
    if (typeof L === 'undefined') {
        const mapEl = document.getElementById('map');
        if (mapEl) AdminUtils.showLoading(mapEl);

        try {
            // CSS 로드
            if (!document.querySelector('link[href*="leaflet.css"]')) {
                const link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = 'https://unpkg.com/leaflet@1.7.1/dist/leaflet.css';
                document.head.appendChild(link);
            }

            // JS 로드
            await new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = 'https://unpkg.com/leaflet@1.7.1/dist/leaflet.js';
                script.onload = resolve;
                script.onerror = reject;
                document.body.appendChild(script);
            });

            if (mapEl) mapEl.innerHTML = '';
        } catch (error) {
            console.error('Leaflet 로드 실패:', error);
            if (mapEl) mapEl.innerHTML = '지도를 불러올 수 없습니다.';
            return;
        }
    }

    if (!state.map) {
        state.map = L.map('map').setView([20, 0], 2);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(state.map);

        state.map.on('click', (e) => {
            const { lat, lng } = e.latlng;
            setMapMarker(lat, lng);
            document.getElementById('missionaryLat').value = lat.toFixed(6);
            document.getElementById('missionaryLng').value = lng.toFixed(6);
        });
    }
}

export function setMapMarker(lat, lng) {
    if (!lat || !lng || isNaN(lat) || isNaN(lng)) return;

    if (state.marker) {
        state.marker.setLatLng([lat, lng]);
    } else if (state.map) {
        state.marker = L.marker([lat, lng], { draggable: true }).addTo(state.map);
        state.marker.on('dragend', () => {
            const pos = state.marker.getLatLng();
            document.getElementById('missionaryLat').value = pos.lat.toFixed(6);
            document.getElementById('missionaryLng').value = pos.lng.toFixed(6);
        });
    }

    if (state.map) {
        state.map.setView([lat, lng], 8);
    }
}
