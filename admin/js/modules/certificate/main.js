import { adminAuth } from '../../core/app-init.js';
import { certificateUi } from './ui.js';
import { certificateApi } from './api.js';
import { state } from './state.js';

document.addEventListener('DOMContentLoaded', () => {
    initCertificatePage();
});

async function initCertificatePage() {
    firebase.auth().onAuthStateChanged(async (user) => {
        if (user && adminAuth.allowedEmails.includes(user.email)) {
            state.missionaries = await certificateApi.fetchMissionaries();
            setupEventListeners();
        }
    });
}

function setupEventListeners() {
    const searchInput = document.getElementById('missionarySearch');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase().trim();
            if (query.length < 2) {
                const resultsContainer = document.getElementById('searchResults');
                if (resultsContainer) resultsContainer.innerHTML = '';
                return;
            }

            const results = state.missionaries.filter(m =>
                m.name.toLowerCase().includes(query)
            );

            certificateUi.displaySearchResults(results);
        });
    }

    const generateBtn = document.getElementById('generateBtn');
    if (generateBtn) {
        generateBtn.addEventListener('click', () => certificateUi.generateCertificate());
    }
}
