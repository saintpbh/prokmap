/**
 * Missionary Module State
 */
export const state = {
    allMissionaries: [],
    allSupporters: [],
    filteredMissionaries: [],
    allSupportHistory: [],
    lastKey: null,
    hasMore: true,
    PAGE_SIZE: 50,
    map: null,
    marker: null,
    currentMissionaryIdForSupport: null
};

// State change helpers if needed
export function setMissionaries(data) {
    state.allMissionaries = data;
}

export function setSupporters(data) {
    state.allSupporters = data;
}
