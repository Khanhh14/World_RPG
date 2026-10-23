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
    tileSize: 48, cols: 48, rows: 36, backgroundColor: '#83c46a', tileset: 'town',
    player: { x: 288, y: 912, texture: 'dungeon', frame: 96, scale: 3, speed: 200 },
    paths: [[2, 18, 10, 3]],
    water,
    // Cầu gỗ từ bờ phía tây ra một sàn nhỏ; đi được trên phần gỗ.
    docks: [[11, 18, 7, 2], [17, 17, 4, 4]],
    dockPosts: [[17.25,17.3],[20.75,17.3],[17.25,20.8],[20.75,20.8]],
    trees: [
        [3, 3, false], [8, 5, false], [17, 1, false], [30, 1, false],
        [40, 5, false], [42, 12, false], [41, 25, false], [32, 30, false],
        [20, 30, false], [10, 28, false], [3, 25, false], [6, 11, false]
    ],
    decorations: [
        [6, 8, 17], [10, 11, 17], [9, 25, 28], [17, 32, 17],
        [37, 31, 17], [43, 22, 28], [42, 10, 17], [27, 5, 17],
        [8, 15, 28], [39, 29, 28]
    ],
    npcs: [{
        id: 'atlast-fisherman',
        name: 'Cần thủ',
        role: 'fishing-merchant',
        col: 18.5,
        row: 18,
        frame: 85,
        lines: [
            'Ta bán cần câu với giá 50 vàng và thu mua cá.',
            'Cá rô 5 vàng, cá chép 7 vàng, cá trê 9 vàng; cá vàng quý hiếm giá 100 vàng.'
        ]
    }],
    monsters: [],
    portals: [{
        x: 144, feetY: 960, label: 'Về Làng Khởi Đầu',
        target: 'Game', spawn: { x: 1872, y: 720 }
    },{x:2016,feetY:960,label:'Động Huyền Quy · Đáy hồ',target:'HuyenQuyCave',spawn:{x:864,y:1248}}]
};
