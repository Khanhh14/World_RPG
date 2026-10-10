const water = [];
// Hồ có bờ hơi uốn lượn; tọa độ ô nước dùng chung cho hình vẽ và va chạm.
for (let row = 5; row < 32; row++) {
    for (let col = 12; col < 42; col++) {
        const dx = (col + 0.5 - 27) / 13;
        const dy = (row + 0.5 - 18) / 11;
        const bank = 1 + Math.sin(row * 0.7) * 0.04 + Math.cos(col * 0.8) * 0.03;
        if (dx * dx + dy * dy < bank) water.push([col, row]);
    }
}

export const atlastLake = {
    id: 'atlast-lake', title: 'HỒ NƯỚC ATLAST',
    tileSize: 48, cols: 48, rows: 36, backgroundColor: '#83c46a',
    player: { x: 288, y: 912, texture: 'dungeon', frame: 96, scale: 3, speed: 200 },
    paths: [[2, 18, 10, 3]],
    water,
    // Cầu gỗ từ bờ phía tây ra một sàn nhỏ; đi được trên phần gỗ.
    docks: [[11, 18, 7, 2], [17, 17, 4, 4]],
    trees: [
        [3, 3, 0], [8, 5, 1], [17, 1, 2], [30, 1, 0],
        [40, 5, 1], [42, 12, 2], [41, 25, 0], [32, 30, 1],
        [20, 30, 2], [10, 28, 0], [3, 25, 1], [6, 11, 2]
    ],
    objects: [
        { type: 'grass', col: 6, row: 8 }, { type: 'grass', col: 10, row: 11 },
        { type: 'grass', col: 9, row: 25 }, { type: 'grass', col: 17, row: 32 },
        { type: 'grass', col: 37, row: 31 }, { type: 'grass', col: 43, row: 22 },
        { type: 'grass', col: 42, row: 10 }, { type: 'grass', col: 27, row: 5 },
        { type: 'bush', col: 8, row: 15 }, { type: 'bush', col: 39, row: 29 },
        { type: 'rock', col: 12, row: 26 }, { type: 'rock', col: 40, row: 11 }
    ],
    npcs: [], monsters: [],
    portals: [{
        x: 144, feetY: 960, label: 'Về Làng Khởi Đầu',
        target: 'Game', spawn: { x: 1872, y: 720 }
    }]
};
