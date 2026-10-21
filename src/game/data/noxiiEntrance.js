// Tất cả chỉ số chiến đấu và thưởng bằng 150% quái Khu Rừng Phía Tây.
export const NOXII_MONSTER_STATS = {
    hp: 105, damage: 15, exp: 45, gold: 15,
    ai: true, detectionRange: 390, chaseRange: 540, moveSpeed: 195
};
const pack = (name, frame, dropItem, locations) => locations.map(([col, row]) => ({
    ...NOXII_MONSTER_STATS, name, frame, dropItem, col, row
}));
const paths = [[23, 6, 3, 28], [7, 17, 34, 3], [7, 9, 3, 11], [38, 17, 3, 11], [25, 29, 4, 3]];
const clearings = [[4, 7, 12, 9], [32, 8, 12, 9], [7, 23, 11, 8], [31, 23, 13, 8], [18, 6, 13, 8]];
const reserved = [...paths, ...clearings, [11, 0, 27, 7], [21, 28, 7, 7], [26, 28, 5, 5]];
const trees = [];
for (let row = 0; row < 32; row += 3) {
    for (let col = 0; col < 45; col += 3) {
        if (reserved.some(([x,y,w,h]) => col + 2.5 > x - .5 && col + .5 < x+w+.5 && row+3 > y-.5 && row+.5 < y+h+.5)) continue;
        if ((col * 7 + row * 11) % 5 !== 0) trees.push([col, row, false]);
    }
}
export const noxiiEntrance = {
    id: 'noxii-entrance', title: 'CỬA HANG NoXII',
    tileSize: 48, cols: 48, rows: 36, tileset: 'town', backgroundColor: '#83c46a',
    player: {x: 1176, y: 1440, texture: 'dungeon', frame: 96, scale: 3, speed: 200},
    paths, trees, npcs: [{
        id:'noxii-material-exchange',name:'Thợ rèn Doran',role:'monster-material-exchange',
        frame:86,col:27.5,row:30.5,
        lines:['Mang 10 sừng tiểu quỷ hoặc vỏ ốc ở vùng cửa hang cho ta. Có thể gộp cả ba loại để đổi 1 đá cường hóa.']
    }],
    decorations: [[5,18,17], [16,22,28], [34,30,17], [42,20,28]],
    monsters: [
        ...pack('Tiểu quỷ', 110, 'imp_horn', [[7,9], [12,9], [7,13], [12,13]]),
        ...pack('Ốc đá', 123, 'stone_snail_shell', [[35,10], [40,10], [35,14], [40,14]]),
        ...pack('Ốc thép', 124, 'steel_snail_shell', [[10,25], [15,28], [34,26], [40,28]])
    ],
    portals: [{kind: 'doorway', x: 1176, feetY: 264, width: 192, height: 72,
        target: 'NoxiiCave', spawn: {x: 864, y: 1248}},
        {x: 1176, feetY: 1584, label: 'Về Khu Rừng Phía Tây',
        target: 'WestForest', spawn: {x: 1512, y: 432}}]
};
