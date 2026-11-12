import { dragonRuins } from './dragonRuins.js';

export const diaLongBossArena = {
    ...dragonRuins,
    id: 'dia-long-boss',
    title: 'ĐẤU TRƯỜNG ĐỊA LONG',
    player: { ...dragonRuins.player, x: 21 * 48, y: 22 * 48 },
    monsters: [],
    npcs: [],
    bossArenaPortal: undefined,
    portals: [{
        kind: 'doorway', x: 21 * 48, feetY: 32 * 48, width: 192, height: 96,
        label: 'Về Phế Tích Địa Long', target: 'DragonRuins',
        spawn: { x: 21 * 48, y: 15 * 48 }
    }]
};
