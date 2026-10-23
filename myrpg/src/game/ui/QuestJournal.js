const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({
    '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
})[char]);

export function renderQuestJournal(state) {
    const quests = Array.isArray(state.data.quests)
        ? state.data.quests.filter(quest => quest.status === 'active')
        : [];
    if (quests.length === 0) {
        const loading = state.data.questLoadStatus === 'loading';
        const pending = state.data.quests?.some(quest => quest.status === 'completed');
        const message = loading
            ? 'Đang tải nhiệm vụ từ máy chủ…'
            : pending
                ? 'Nhiệm vụ đã hoàn thành. Nhận thưởng trên bảng bên cạnh thanh máu để mở nhiệm vụ tiếp theo.'
                : state.data.questLoadStatus === 'error'
                    ? state.data.questLoadError
                    : 'Bạn đã hoàn thành tất cả nhiệm vụ hiện có.';
        return `<p class="rpg-subtle">${escape(message)}</p>${state.data.questLoadStatus === 'error' ? '<button type="button" data-action="quest-retry">Tải lại nhiệm vụ</button>' : ''}`;
    }
    return `<div class="rpg-quest-list">${quests.slice(0, 1).map(quest => {
        const objective = quest.objective;
        return `<article class="rpg-quest">
            <h3>${escape(quest.name)}</h3>
            <p class="rpg-subtle">${escape(quest.description)}</p>
            <div class="rpg-quest-progress">
                <span>${escape(objective.label)}</span>
                <strong>${objective.current}/${objective.target}</strong>
            </div>
            <div class="rpg-rewards">
                <span>${quest.reward.exp} EXP · ${quest.reward.gold} vàng</span>
                <span>Đang thực hiện</span>
            </div>
        </article>`;
    }).join('')}</div>`;
}
