export const WORLD_MAP_GROUPS = [
    {
        name: 'Thành thị',
        places: [
            { id: 'village', name: 'Làng Khởi Đầu', scene: 'Game', spawn: { x: 960, y: 768 } },
            { id: 'yuna-city', name: 'Thành Yuna', scene: 'YunaCity', spawn: { x: 2352, y: 984 } },
            { id: 'yuna-outskirts', name: 'Ngoại ô YuNa', scene: 'YunaOutskirts', spawn: { x: 2256, y: 888 } }
        ]
    },
    {
        name: 'Khu vực bên ngoài',
        places: [
            { id: 'west-forest', name: 'Khu Rừng Phía Tây', scene: 'WestForest', spawn: { x: 2496, y: 1068 } },
            { id: 'atlast-lake', name: 'Hồ Nước Atlast', scene: 'AtlastLake', spawn: { x: 288, y: 912 } },
            { id: 'hiuuling-river', name: 'Bờ Sông HiuuLing', scene: 'HiuuLingRiver', spawn: { x: 288, y: 816 } },
            { id: 'autumn-forest', name: 'Khu Rừng Mùa Thu', scene: 'AutumnForest', spawn: { x: 1056, y: 1488 } },
            { id: 'dia-long-forest', name: 'Khu Rừng Địa Long', scene: 'DiaLongForest', spawn: { x: 1176, y: 1680 } }
        ]
    },
    {
        name: 'Hang động & đấu trường',
        places: [
            { id: 'naga-cave', name: 'Hang Động NaGa', scene: 'NagaCave', spawn: { x: 864, y: 1270 } },
            { id: 'noxii-entrance', name: 'Cửa Hang NoXII', scene: 'NoxiiEntrance', spawn: { x: 1176, y: 1440 } },
            { id: 'noxii-cave', name: 'Hang NoXII', scene: 'NoxiiCave', spawn: { x: 864, y: 1248 } },
            { id: 'guardian-cave', name: 'Hang Thủ Hộ Khu Rừng', scene: 'GuardianCave', spawn: { x: 864, y: 1248 } },
            { id: 'huyen-quy-cave', name: 'Động Huyền Quy', scene: 'HuyenQuyCave', spawn: { x: 864, y: 1248 } },
            { id: 'han-nha-mon', name: 'Hàn Nha Môn', scene: 'HanNhaMon', spawn: { x: 864, y: 1248 } },
            { id: 'hoa-phuong-cave', name: 'Hang Hỏa Phượng', scene: 'HoaPhuongCave', spawn: { x: 864, y: 1248 } },
            { id: 'dragon-ruins', name: 'Phế Tích Địa Long', scene: 'DragonRuins', spawn: { x: 1008, y: 1416 } },
            { id: 'dia-long-boss', name: 'Đấu Trường Địa Long', scene: 'DiaLongBoss', spawn: { x: 1008, y: 1056 } }
        ]
    }
];

export const WORLD_ROUTES = [
    { from: 'village', to: 'west-forest', gate: 'Cổng Khu Rừng Phía Tây', direction: 'phía Tây của làng' },
    { from: 'village', to: 'atlast-lake', gate: 'Cổng Hồ Nước Atlast', direction: 'phía Đông của làng' },
    { from: 'village', to: 'hiuuling-river', gate: 'Cổng Bờ Sông HiuuLing', direction: 'phía Nam của làng' },
    { from: 'village', to: 'autumn-forest', gate: 'Cổng Khu Rừng Mùa Thu', direction: 'phía Bắc của làng' },
    { from: 'west-forest', to: 'village', gate: 'Cổng Về Làng Khởi Đầu', direction: 'phía Đông khu rừng' },
    { from: 'west-forest', to: 'yuna-outskirts', gate: 'Cổng Ngoại ô thành YuNa', direction: 'phía Tây khu rừng' },
    { from: 'west-forest', to: 'noxii-entrance', gate: 'Cửa Hang NoXII', direction: 'phía Bắc khu rừng' },
    { from: 'west-forest', to: 'naga-cave', gate: 'Hang động NaGa', direction: 'phía Nam khu rừng' },
    { from: 'yuna-city', to: 'yuna-outskirts', gate: 'Cổng Ngoại ô YuNa', direction: 'phía Đông thành phố' },
    { from: 'yuna-outskirts', to: 'yuna-city', gate: 'Cổng Thành Yuna', direction: 'phía Tây ngoại ô' },
    { from: 'yuna-outskirts', to: 'west-forest', gate: 'Cổng Khu Rừng Phía Tây', direction: 'phía Đông ngoại ô' },
    { from: 'yuna-outskirts', to: 'dia-long-forest', gate: 'Cổng Khu Rừng Địa Long', direction: 'phía Bắc ngoại ô' },
    { from: 'dia-long-forest', to: 'yuna-outskirts', gate: 'Cổng Về Ngoại ô YuNa', direction: 'phía Nam khu rừng' },
    { from: 'noxii-entrance', to: 'noxii-cave', gate: 'Cửa Hang NoXII', direction: 'phía Bắc khu cửa hang' },
    { from: 'noxii-entrance', to: 'west-forest', gate: 'Cổng Về Khu Rừng Phía Tây', direction: 'phía Nam khu cửa hang' },
    { from: 'noxii-cave', to: 'noxii-entrance', gate: 'Lối Ra Cửa Hang NoXII', direction: 'phía Nam hang' },
    { from: 'naga-cave', to: 'west-forest', gate: 'Cổng Về Khu Rừng Phía Tây', direction: 'phía Nam hang' },
    { from: 'atlast-lake', to: 'village', gate: 'Cổng Về Làng Khởi Đầu', direction: 'phía Tây hồ' },
    { from: 'atlast-lake', to: 'huyen-quy-cave', gate: 'Động Huyền Quy · Đáy hồ', direction: 'phía Đông hồ' },
    { from: 'huyen-quy-cave', to: 'atlast-lake', gate: 'Lối Trở Lên Hồ Atlast', direction: 'phía Nam động' },
    { from: 'hiuuling-river', to: 'village', gate: 'Cổng Về Làng Khởi Đầu', direction: 'phía Tây bờ sông' },
    { from: 'hiuuling-river', to: 'hoa-phuong-cave', gate: 'Hang Hỏa Phượng', direction: 'phía Đông bờ sông' },
    { from: 'hoa-phuong-cave', to: 'hiuuling-river', gate: 'Cổng Về Bờ Sông HiuuLing', direction: 'phía Nam hang' },
    { from: 'autumn-forest', to: 'village', gate: 'Cổng Về Làng Khởi Đầu', direction: 'phía Nam khu rừng' },
    { from: 'autumn-forest', to: 'guardian-cave', gate: 'Hang Thủ Hộ Khu Rừng', direction: 'phía Bắc khu rừng' },
    { from: 'autumn-forest', to: 'han-nha-mon', gate: 'Hàn Nha Môn', direction: 'phía Đông khu rừng' },
    { from: 'guardian-cave', to: 'autumn-forest', gate: 'Cổng Về Khu Rừng Mùa Thu', direction: 'phía Nam hang' },
    { from: 'han-nha-mon', to: 'autumn-forest', gate: 'Cổng Về Khu Rừng Mùa Thu', direction: 'phía Nam môn phái' },
    { from: 'dia-long-forest', to: 'dragon-ruins', gate: 'Cổng Phế Tích Địa Long', direction: 'phía Đông khu rừng' },
    { from: 'dragon-ruins', to: 'dia-long-forest', gate: 'Cổng Về Khu Rừng Địa Long', direction: 'phía Nam phế tích' },
    { from: 'dragon-ruins', to: 'dia-long-boss', gate: 'Vòng ấn Đấu Trường Địa Long', direction: 'chính giữa vòng ấn trong phế tích' },
    { from: 'dia-long-boss', to: 'dragon-ruins', gate: 'Cổng Về Phế Tích Địa Long', direction: 'phía Nam đấu trường' }
];

export function findWorldRoute(from, to) {
    if (from === to) return [];
    const queue = [[from, []]], visited = new Set([from]);
    while (queue.length) {
        const [current, path] = queue.shift();
        for (const edge of WORLD_ROUTES) {
            if (edge.from !== current || visited.has(edge.to)) continue;
            const next = [...path, edge];
            if (edge.to === to) return next;
            visited.add(edge.to);
            queue.push([edge.to, next]);
        }
    }
    return null;
}
