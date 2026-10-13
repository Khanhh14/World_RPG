import assert from 'node:assert/strict';
import test from 'node:test';
import { renderQuestJournal } from '../src/game/ui/QuestJournal.js';

const quest = (id, status, name) => ({
    id,
    status,
    name,
    description: `Mô tả ${name}`,
    reward: { exp: 100, gold: 20 },
    objective: { label: 'Hoàn thành mục tiêu', current: 1, target: 3 }
});

test('quest journal shows only the active quest', () => {
    const html = renderQuestJournal({
        data: {
            quests: [
                quest('first_steps', 'claimed', 'Nhiệm vụ cũ'),
                quest('fishing_atlast_15', 'active', 'Nhiệm vụ hiện tại'),
                quest('hunt_west_forest_20', 'active', 'Nhiệm vụ kế tiếp')
            ]
        }
    });

    assert.match(html, /Nhiệm vụ hiện tại/);
    assert.doesNotMatch(html, /Nhiệm vụ cũ|Nhiệm vụ kế tiếp|Nhận thưởng/);
});

test('quest journal does not show a completed quest', () => {
    const html = renderQuestJournal({
        data: {
            quests: [quest('first_steps', 'completed', 'Nhiệm vụ đã xong')],
            questLoadStatus: 'ready'
        }
    });

    assert.doesNotMatch(html, /Nhiệm vụ đã xong|0?\/3/);
    assert.match(html, /Nhận thưởng trên bảng bên cạnh thanh máu/);
});
