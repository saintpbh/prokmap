function createFloatingElement(item, point, state, constants, extraClass = '') {
    const wrapper = document.createElement("div");
    wrapper.className = `floating-missionary-wrapper ${extraClass}`;
    wrapper.style.left = `${point.x - 50}px`;
    wrapper.style.top = `${point.y - 20}px`;
    let floatClass = "floating-missionary-content";
    if(state.isAnimOn) floatClass += " anim";
    if(window.isRecent && window.isRecent(item.lastUpdate)) floatClass += " recent";
    wrapper.innerHTML = `
      <div class="${floatClass}">
        <img src="https://cdn-icons-png.flaticon.com/128/149/149071.png" alt="icon">
        <div>
          <div class="name">${item.name}</div>
          <div class="prayer">${item.prayer || '현지 정착과 건강'}</div>
        </div>
      </div>`;
    return wrapper;
}

function animateFloatingElement(element, state, constants, duration) {
    const displayTime = duration || constants.FLOAT_DISPLAY_TIME;
    if(state.isAnimOn) {
        setTimeout(() => { element.style.opacity = "1"; }, 40);
        setTimeout(() => {
            element.style.opacity = "0";
            setTimeout(() => element.remove(), 800);
        }, displayTime);
    } else {
        element.style.opacity = "1";
        setTimeout(() => element.remove(), displayTime);
    }
}

function createCountryMissionaryPopup(country, missionaries, flagUrl) {
    const wrapper = document.createElement('div');
    wrapper.className = 'country-missionary-popup';
    wrapper.innerHTML = `
        <div class="country-header">
            <img src="${flagUrl}" alt="국기" class="country-flag">
            <span class="country-name">${country}</span>
        </div>
        <div class="missionary-list">
            ${missionaries.map(m => `
                <div class="missionary-list-item">
                    <span class="missionary-name">${m.name}</span>
                    ${m.city ? `<span class="missionary-city">(${m.city})</span>` : ''}
                </div>
            `).join('')}
        </div>
    `;
    return wrapper;
}

// 전역 함수로 등록
window.createFloatingElement = createFloatingElement;
window.animateFloatingElement = animateFloatingElement; 