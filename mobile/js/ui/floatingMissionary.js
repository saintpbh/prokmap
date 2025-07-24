export function createFloatingElement(item, point, state, constants, extraClass = '') {
    const wrapper = document.createElement("div");
    wrapper.className = `floating-missionary-wrapper ${extraClass}`;
    wrapper.style.left = `${point.x - 50}px`;
    wrapper.style.top = `${point.y - 20}px`;
    let floatClass = "floating-missionary-content";
    if(state.isAnimOn) floatClass += " anim";
    if(isRecent(item.lastUpdate)) floatClass += " recent";
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

export function animateFloatingElement(element, state, constants, duration) {
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