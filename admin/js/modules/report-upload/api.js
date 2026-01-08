import { firebaseDB } from '../../core/app-init.js';
import { state } from './state.js';

export const reportApi = {
    async fetchMissionaries() {
        return await firebaseDB.getMissionaries();
    },

    async updateMissionary(id, data) {
        await firebaseDB.updateMissionary(id, data);
    },

    parseText(rawText) {
        const lines = rawText.split('\n');
        const results = [];

        let currentDate = '';
        let currentCountry = '';
        let currentEntry = null;

        const datePattern = /^\/\/\s*(.*)/;
        const countryPattern = /^\[(.*)\]/;
        const newPersonPattern = /^([가-힣]{2,4})(\s*선교사.*)?$/;

        for (let i = 0; i < lines.length; i++) {
            let line = lines[i].trim();
            if (!line) continue;

            const dateMatch = line.match(datePattern);
            if (dateMatch) {
                currentDate = dateMatch[1].trim();
                currentCountry = '';
                continue;
            }

            const countryMatch = line.match(countryPattern);
            if (countryMatch) {
                currentCountry = countryMatch[1].trim();
                continue;
            }

            let isNewPerson = false;
            let potentialName = '';

            const nameMatch = line.match(newPersonPattern);
            if (nameMatch && !line.match(/^[-*⦁]/)) {
                const rawName = nameMatch[1];
                if (line.includes('선교사') || this.findMissionaryByName(rawName)) {
                    isNewPerson = true;
                    potentialName = rawName;
                }
            }

            if (isNewPerson) {
                if (currentEntry) results.push(currentEntry);
                currentEntry = {
                    name: potentialName,
                    rawName: line,
                    date: currentDate || 'Unknown Date',
                    country: currentCountry || '',
                    summary: [],
                    prayer: [],
                    currentSection: 'summary'
                };
                continue;
            }

            if (currentEntry) {
                if (line.startsWith('기도:')) {
                    currentEntry.currentSection = 'prayer';
                    const content = line.replace(/^기도:\s*/, '');
                    if (content) currentEntry.prayer.push(content);
                    continue;
                } else if (line.startsWith('사역:')) {
                    currentEntry.currentSection = 'summary';
                    const content = line.replace(/^사역:\s*/, '');
                    if (content) currentEntry.summary.push(content);
                    continue;
                }

                if (currentEntry.currentSection === 'prayer') {
                    currentEntry.prayer.push(line);
                } else {
                    currentEntry.summary.push(line);
                }
            }
        }

        if (currentEntry) results.push(currentEntry);
        return results;
    },

    findMissionaryByName(name) {
        return state.allMissionaries.find(m => m.name.includes(name));
    }
};
