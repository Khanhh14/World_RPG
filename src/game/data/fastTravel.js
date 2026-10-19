// Danh sách điểm đến do Mã Phu cung cấp. Scene key phải trùng tên scene đã đăng ký.
// spawn là vị trí sprite người chơi, đặt cách NPC/cổng để tránh kẹt hoặc dịch chuyển lặp.
export const FAST_TRAVEL_STOPS = {
 village: {label:'Làng Khởi Đầu',scene:'Game',spawn:{x:1152,y:1030}},
 'yuna-city': {label:'Thành Yuna',scene:'YunaCity',spawn:{x:2160,y:1174}}
};
export const FAST_TRAVEL_ROUTES = {
 village: ['yuna-city'],
 'yuna-city': ['village']
};
