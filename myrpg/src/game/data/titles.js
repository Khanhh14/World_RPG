export const TITLE_COST = { gold: 10000, gems: 500 };

export const TITLES = [
    { id: 'mythic-war-venerable', name: 'Vạn Cổ Chiến Tôn', description: 'Bậc tôn giả từng chinh chiến qua muôn thuở.', color: '#ffe49a', glow: '#ff9d36', aura: '#8a431c' },
    { id: 'nine-heavens-sword-emperor', name: 'Cửu Thiên Kiếm Đế', description: 'Đế giả nắm giữ kiếm đạo trên chín tầng trời.', color: '#a9efff', glow: '#39bfff', aura: '#174a7a' },
    { id: 'ten-directions-slaying-god', name: 'Thập Phương Sát Thần', description: 'Sát thần uy chấn mười phương, khiến quần ma khiếp sợ.', color: '#ffb1a3', glow: '#ff493b', aura: '#741f31' },
    { id: 'hundred-battles-peerless', name: 'Bách Chiến Vô Song', description: 'Trăm trận bất bại, chiến tích thiên hạ vô song.', color: '#e5c4ff', glow: '#ad5dff', aura: '#49236f' },
    { id: 'blood-moon-demon-venerable', name: 'Huyết Nguyệt Ma Tôn', description: 'Ma tôn dưới huyết nguyệt, áp đảo muôn loài yêu ma.', color: '#ff9cce', glow: '#f22d84', aura: '#6f1749' }
];

export const titleById = id => TITLES.find(title => title.id === id) ?? null;
