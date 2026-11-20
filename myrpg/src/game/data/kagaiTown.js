export const kagaiTown = {
    id: 'kagai-town',
    title: 'THỊ TRẤN KAGAI',
    tileSize: 48,
    cols: 44,
    rows: 34,
    tileset: 'town',
    backgroundColor: '#83c46a',
    player: { x: 1056, y: 960, texture: 'dungeon', frame: 96, scale: 3, speed: 200 },
    paths: [
        [3, 15, 38, 3],
        [20, 1, 4, 32],
        [6, 8, 32, 2],
        [6, 26, 32, 2],
        [9, 9, 2, 7],
        [32, 9, 2, 7],
        [9, 18, 2, 8],
        [32, 18, 2, 8]
    ],
    paving: [{ x: 16, y: 11, width: 12, height: 7, frame: 43 }],
    houses: [[4, 3, 'red'], [34, 3, 'blue'], [4, 23, 'blue'], [34, 23, 'red']],
    trees: [
        [0, 0], [11, 1], [29, 1], [42, 0],
        [0, 9], [42, 9], [0, 23], [42, 22],
        [12, 31], [18, 30], [25, 30], [31, 31]
    ],
    decorations: [
        [17, 10, 17], [26, 10, 28],
        [15, 20, 28], [28, 20, 17],
        [2, 13, 17], [40, 20, 28],
        [14, 29, 28], [29, 29, 17]
    ],
    npcs: [
        {
            id: 'kagai-coachman',
            name: 'Mã Phu',
            role: 'coachman',
            frame: 100,
            col: 22,
            row: 22,
            lines: ['Bạn muốn đi tới đâu?']
        },
        {
            id: 'kagai-elder',
            name: 'Trưởng trấn Kael',
            frame: 86,
            col: 21,
            row: 10,
            lines: ['Thị trấn KaGai nằm giữa những con đường giao thương.', 'Mã Phu ở quảng trường có thể đưa con đến các vùng đất khác.']
        },
        {
            id: 'kagai-guard',
            name: 'Đội trưởng Nari',
            frame: 96,
            col: 10,
            row: 15.5,
            lines: ['Ta phụ trách tuần tra khu vực phía Tây thị trấn.', 'Hãy cẩn thận khi rời khỏi những con đường an toàn.']
        },
        {
            id: 'kagai-merchant',
            name: 'Thương nhân Fenn',
            frame: 85,
            col: 33,
            row: 15.5,
            lines: ['Đoàn hàng từ Thành Yuna thường ghé qua đây.', 'Nếu cần đi xa, hãy hỏi Mã Phu ở quảng trường.']
        },
        {
            id: 'kagai-blacksmith',
            name: 'Thợ rèn Boro',
            frame: 88,
            col: 10,
            row: 29,
            lines: ['Lò rèn của ta hoạt động cả ngày.', 'Trang bị tốt sẽ giúp con vững vàng hơn trên đường phiêu lưu.']
        },
        {
            id: 'kagai-herbalist',
            name: 'Dược sư Mei',
            frame: 87,
            col: 33,
            row: 29,
            lines: ['Ta hái thảo dược ở những cánh đồng quanh thị trấn.', 'Đừng quên chuẩn bị trước khi vào hang động.']
        }
    ],
    monsters: [],
    portals: []
};
