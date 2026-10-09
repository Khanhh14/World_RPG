import { villageNPCs } from './villageNPCs.js';

// Dữ liệu riêng của làng. Thêm/sửa đồ vật ở đây.
export const village = {
    id: 'village', title: 'LÀNG KHỞI ĐẦU',
    tileSize: 48, cols: 44, rows: 32,
    backgroundColor: '#83c46a', tileset: 'town',
    player: { x: 960, y: 768, texture: 'dungeon', frame: 96, scale: 3, speed: 200 },
    paths: [
        [0, 14, 44, 3], [19, 0, 3, 32], [16, 11, 11, 9],
        [8, 11, 2, 4], [30, 11, 2, 4], [10, 24, 23, 2],
        [11, 23, 2, 2], [30, 23, 2, 2]
    ],
    paving: [{ x: 17, y: 12, width: 9, height: 7, frame: 43 }],
    houses: [[7, 7, 'red'], [29, 7, 'blue'], [10, 19, 'blue'], [29, 19, 'red']],
    props: [['well', 23, 15, 66, 40], ['bench', 17, 12, 70, 20], ['bench', 25, 18, 70, 20]],
    fences: [[5, 5, 9], [28, 5, 9], [5, 22, 4], [34, 22, 5], [10, 28, 7], [28, 28, 8]],
    trees: [
        [1, 1, false], [5, 1, false], [10, 1, true], [14, 1, false],
        [25, 1, false], [30, 1, true], [35, 1, false], [40, 1, true],
        [1, 6, false], [39, 7, false], [2, 19, true], [5, 25, false],
        [1, 28, false], [15, 28, true], [24, 28, false], [38, 26, true], [40, 20, false]
    ],
    gardens: [[5, 18, 3, 3], [35, 18, 3, 3]],
    decorations: [
        [6, 11, 28], [11, 11, 15], [27, 11, 28], [33, 11, 15],
        [9, 22, 29], [33, 23, 29], [14, 20, 17], [27, 20, 17],
        [14, 8, 2], [25, 8, 2], [8, 27, 29], [37, 27, 29], [15, 18, 28], [28, 18, 15]
    ],
    solidTiles: [
        [4, 12, 92, 30, 18], [36, 12, 92, 30, 18],
        [15, 13, 95, 24, 24], [27, 17, 95, 24, 24],
        [13, 10, 83, 30, 22], [34, 10, 94, 30, 22], [14, 23, 83, 30, 22]
    ],
    npcs: villageNPCs
};
