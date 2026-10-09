import { villageNPCs } from './villageNPCs.js';

// Khu rừng xanh phía trên bên trái, cây xếp so le.
const forestTrees = [];

for (const row of [0, 1.5, 3, 4]) {
    const offset = row === 1.5 || row === 4 ? 0.5 : 0;

    for (let col = 0; col <= 15; col += 1.5) {
        forestTrees.push([col + offset, row, false]);
    }
}

export const village = {
    id: 'village',
    title: 'LÀNG KHỞI ĐẦU',

    tileSize: 48,
    cols: 44,
    rows: 32,
    backgroundColor: '#83c46a',
    tileset: 'town',

    player: {
        x: 960,
        y: 768,
        texture: 'dungeon',
        frame: 96,
        scale: 3,
        speed: 200
    },

    // [cột, hàng, chiều rộng, chiều cao] tính theo ô.
    paths: [
        [0, 14, 44, 3],
        [19, 0, 3, 32],
        [16, 11, 11, 9],
        [8, 11, 2, 4],
        [30, 11, 2, 4],
        [10, 24, 23, 2],
        [11, 23, 2, 2],
        [30, 23, 2, 2]
    ],

    // Quảng trường lát đá.
    paving: [
        {
            x: 17,
            y: 12,
            width: 9,
            height: 7,
            frame: 43
        }
    ],

    houses: [
        [7, 7, 'red'],
        [29, 7, 'blue'],
        [10, 19, 'blue'],
        [29, 19, 'red']
    ],

    // Không đặt giếng hoặc ghế.
    props: [],

    // Đã bỏ hàng rào trong rừng phía trên bên trái.
    fences: [
        [28, 5, 9],
        [5, 22, 4],
        [34, 22, 5],
        [10, 28, 7],
        [28, 28, 8]
    ],

    // false = cây xanh.
    trees: [
        ...forestTrees,

        // Cây rải quanh phần còn lại của làng.
        [25, 1, false],
        [30, 1, false],
        [35, 1, false],
        [40, 1, false],
        [1, 8, false],
        [39, 7, false],
        [2, 19, false],
        [5, 25, false],
        [1, 28, false],
        [15, 28, false],
        [24, 28, false],
        [38, 26, false],
        [40, 20, false]
    ],

    // Không tạo vườn nấm.
    gardens: [],

    // Cây nhỏ xanh, cỏ và hoa.
    decorations: [
        [6, 11, 28],
        [11, 11, 28],
        [27, 11, 28],
        [33, 11, 28],
        [14, 20, 17],
        [27, 20, 17],
        [14, 8, 2],
        [25, 8, 2],
        [15, 18, 28],
        [28, 18, 28],
        [6, 19, 28],
        [7, 20, 17],
        [35, 19, 28],
        [37, 20, 17]
    ],

    // Đá, biển báo và đồ trang trí có va chạm.
    // [cột, hàng, frame, rộng vùng va chạm, cao vùng va chạm].
    solidTiles: [
        [4, 12, 92, 30, 18],
        [36, 12, 92, 30, 18],
        [15, 13, 95, 24, 24],
        [27, 17, 95, 24, 24],
        [13, 10, 83, 30, 22],
        [34, 10, 94, 30, 22],
        [14, 23, 83, 30, 22]
    ],

    // Vị trí và lời thoại lấy từ file NPC riêng.
    npcs: villageNPCs
};