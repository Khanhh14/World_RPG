const tileSize = 48;

// Giữ đường, khoảng trống và các điểm xuất hiện không bị cây che/chặn.
const paths = [
    [0, 21, 56, 3],
    [11, 9, 3, 15],
    [30, 13, 3, 20],
    [39, 23, 3, 12]
];
const clearings = [[8, 7, 10, 9], [25, 10, 12, 9], [36, 28, 11, 10]];
const reserved = [...paths, ...clearings];
const trees = [];

for (let row = 0; row <= 39; row += 3) {
    for (let col = 0; col <= 52; col += 3) {
        const x = col + (row % 6 === 0 ? 0 : 0.75);
        // Tán cây mới rộng 2 ô, cao 2.5 ô; chừa khoảng quanh đường và bãi trống.
        const overlaps = reserved.some(([rx, ry, rw, rh]) => (
            x + 0.5 < rx + rw + 0.5 && x + 2.5 > rx - 0.5 &&
            row + 0.5 < ry + rh + 0.5 && row + 3 > ry - 0.5
        ));
        // Bỏ một số vị trí để có khoảng trống tự nhiên giữa các cụm cây.
        const sparseGap = ((col / 3) * 7 + (row / 3) * 11) % 5 === 0;
        if (!overlaps && !sparseGap) trees.push([x, row, ((col + row) / 3) % 3]);
    }
}

export const westForest = {
    id: 'west-forest',
    title: 'KHU RỪNG PHÍA TÂY',
    tileSize,
    cols: 56,
    rows: 44,
    backgroundColor: '#83c46a',
    player: {
        x: 2496, y: 1068,
        texture: 'dungeon', frame: 96, scale: 3, speed: 200
    },
    paths,
    paving: [], houses: [], props: [], fences: [], gardens: [],
    trees,
    objects: [
        { type: 'rock', col: 5, row: 19 },
        { type: 'rock', col: 21, row: 27 },
        { type: 'rock', col: 48, row: 30 },
        { type: 'bush', col: 7, row: 18 },
        { type: 'bush', col: 23, row: 8 },
        { type: 'bush', col: 47, row: 27 },
        ...trees.filter((_, i) => i % 2 === 0).map(([x, y]) => ({
            type: 'grass', col: x + 2.5, row: y + 3
        }))
    ],
    solidTiles: [],
    npcs: [],
    // Hình quái đứng yên, không có AI, sát thương hoặc thanh máu.
    monsters: [
        { col: 13, row: 12, frame: 108 },
        { col: 29, row: 15, frame: 108 },
        { col: 34, row: 16, frame: 120 },
        { col: 41, row: 33, frame: 121 },
        { col: 33.5, row: 14.5, texture: 'moss-guardian', name: 'Hộ Vệ Rêu', scale: 3 }
    ],
    portals: [{
        x: 2592, feetY: 1104,
        label: 'Về Làng Khởi Đầu',
        target: 'Game',
        spawn: { x: 240, y: 748 }
    }]
};
