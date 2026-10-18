const tileSize = 48;

// Giữ đường, khoảng trống và các điểm xuất hiện không bị cây che/chặn.
const paths = [
    [0, 21, 56, 3],
    [11, 9, 3, 15],
    [30, 13, 3, 30],
    [39, 23, 3, 12]
];
const clearings = [
    [2, 5, 9, 13], [42, 5, 11, 13],
    [2, 27, 9, 12], [42, 27, 11, 12]
];
const reserved = [...paths, ...clearings];
const trees = [];

const pack = (name, frame, dropItem, locations) => locations.map(([col, row]) => ({
    name, frame, dropItem, col, row, hp: 70, damage: 10,
    ai: true, detectionRange: 260, chaseRange: 360, moveSpeed: 130
}));

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
        if (!overlaps && !sparseGap) trees.push([x, row, false]);
    }
}

export const westForest = {
    id: 'west-forest',
    title: 'KHU RỪNG PHÍA TÂY',
    tileSize,
    cols: 56,
    rows: 44,
    backgroundColor: '#83c46a', tileset: 'town',
    player: {
        x: 2496, y: 1068,
        texture: 'dungeon', frame: 96, scale: 3, speed: 200
    },
    paths,
    paving: [], houses: [], props: [], fences: [], gardens: [],
    trees,
    decorations: [
        [9, 8, 17], [16, 14, 28], [26, 11, 17],
        [35, 17, 28], [37, 29, 17], [45, 36, 28]
    ],
    solidTiles: [],
    npcs: [{
        id: 'west-forest-material-exchange',
        name: 'Thợ săn',
        role: 'monster-material-exchange',
        frame: 87,
        col: 48.5,
        row: 25.5,
        lines: ['Đổi 10 vật phẩm rơi từ quái để nhận 1 đá nâng cấp trang bị.']
    }],
    monsters: [
        ...pack('Heo rừng', 108, 'boar_hide', [
            [3.5, 7], [6.5, 7], [9.5, 7], [3.5, 12], [6.5, 12], [9.5, 12]
        ]),
        ...pack('Sói xám', 120, 'wolf_fang', [
            [43.5, 7], [46.5, 7], [49.5, 7], [43.5, 12], [46.5, 12], [49.5, 12]
        ]),
        ...pack('Slime rừng', 121, 'forest_gel', [
            [3.5, 29], [6.5, 29], [9.5, 29], [3.5, 34], [6.5, 34], [9.5, 34]
        ]),
        ...pack('Bọ cạp', 122, 'scorpion_tail', [
            [43.5, 29], [46.5, 29], [49.5, 29], [43.5, 34], [46.5, 34], [49.5, 34]
        ])
    ],
    portals: [{
        x: 1512, feetY: 2016,
        label: 'Hang động NaGa', target: 'NagaCave',
        spawn: { x: 864, y: 1270 }
    }, {
        x: 120, feetY: 1104,
        label: 'Ngoại ô thành YuNa', target: 'YunaOutskirts',
        spawn: { x: 2280, y: 888 }
    }, {
        x: 2592, feetY: 1104,
        label: 'Về Làng Khởi Đầu',
        target: 'Game',
        spawn: { x: 240, y: 748 }
    }]
};
