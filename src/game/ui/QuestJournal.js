import { DESTINATIONS } from '../systems/RPGState.js';

const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({
    '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
})[char]);

// Nhật ký riêng: mở bằng nút Nhiệm vụ hoặc phím J.
// RPGHUD quản lý đóng/mở, bàn phím và thao tác nhận thưởng.
export function renderQuestJournal(state) {
    const d = state.data;
    return `<article class="rpg-quest">
        <h3>Những bước chân đầu tiên</h3>
        <p class="rpg-subtle">Khám phá ba khu vực bằng các cổng dịch chuyển.</p>
        <ul>${DESTINATIONS.map(([id, name]) => `<li class="${d.visited.includes(id) ? 'done' : ''}">${d.visited.includes(id) ? '✓' : '○'} ${escape(name)}</li>`).join('')}</ul>
        <div class="rpg-rewards"><span>120 EXP · 30 vàng</span>
            <button type="button" class="rpg-primary" data-action="claim" ${!state.explorationReady || d.explorationClaimed ? 'disabled' : ''}>${d.explorationClaimed ? 'Đã nhận thưởng' : state.explorationReady ? 'Nhận thưởng' : `${d.visited.length}/${DESTINATIONS.length} khu vực`}</button>
        </div>
    </article>`;
}
