import { state } from './state.js';

export const prokUi = {
    renderList() {
        const listEl = document.getElementById('missionaryList');
        const search = document.getElementById('searchInput').value.toLowerCase();

        const filtered = state.allMissionaries.filter(m =>
            (m.name.includes(search) || m.country.includes(search)) &&
            (m.summary || m.prayerTopic)
        );

        listEl.innerHTML = '';
        filtered.forEach(m => {
            const isSelected = state.selectedIds.has(m.id);
            const div = document.createElement('div');
            div.className = 'missionary-item';
            div.style.background = isSelected ? '#e3f2fd' : '';

            let summaryPreview = m.summary || m.prayerTopic || '(내용 없음)';
            if (summaryPreview.length > 50) summaryPreview = summaryPreview.substring(0, 50) + '...';

            div.innerHTML = `
                <div style="width: 40px;">
                    <input type="checkbox" class="select-chk" value="${m.id}" ${isSelected ? 'checked' : ''}>
                </div>
                <div style="flex:1;">
                    <strong>${m.name}</strong> <small class="text-muted">| ${m.country}</small>
                </div>
                <div style="flex:2; font-size:0.9em; color:#555;">
                    ${summaryPreview.replace(/\n/g, ' ')}
                </div>
                <div style="width: 150px; text-align:center;">
                    <input type="file" id="file-${m.id}" class="form-input" style="padding: 2px; font-size: 0.8em;">
                </div>
            `;

            div.addEventListener('click', (e) => {
                if (e.target.type !== 'checkbox' && e.target.type !== 'file') {
                    const chk = div.querySelector('.select-chk');
                    chk.checked = !chk.checked;
                    this.toggleSelection(m.id, chk.checked, div);
                }
            });

            div.querySelector('.select-chk').addEventListener('change', (e) => {
                this.toggleSelection(m.id, e.target.checked, div);
            });

            div.querySelector('input[type=file]').addEventListener('change', (e) => {
                if (e.target.files.length > 0) {
                    const chk = div.querySelector('.select-chk');
                    if (!chk.checked) {
                        chk.checked = true;
                        this.toggleSelection(m.id, true, div);
                    }
                }
            });

            listEl.appendChild(div);
        });

        this.updateButtonState();
    },

    toggleSelection(id, checked, rowEl) {
        if (checked) state.selectedIds.add(id);
        else state.selectedIds.delete(id);

        if (rowEl) {
            rowEl.style.background = checked ? '#e3f2fd' : '';
        }
        this.updateButtonState();
    },

    toggleAll(checked) {
        const chks = document.querySelectorAll('.select-chk');
        chks.forEach(chk => {
            chk.checked = checked;
            this.toggleSelection(chk.value, checked, chk.closest('.missionary-item'));
        });
    },

    updateButtonState() {
        const btn = document.getElementById('uploadBtn');
        if (btn) {
            btn.disabled = state.selectedIds.size === 0;
            btn.innerHTML = `<i class="fas fa-paper-plane"></i> 선택 항목 업로드 (${state.selectedIds.size}명)`;
        }
    },

    log(message, clear = false) {
        const logEl = document.getElementById('logContent');
        if (logEl) {
            if (clear) logEl.innerText = message;
            else logEl.innerText += message;
            logEl.scrollTop = logEl.scrollHeight;
        }
    }
};
