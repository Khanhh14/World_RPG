// col, row tính theo ô; row là vị trí chân NPC.
export const villageNPCs = [
    {
        id: 'elder',
        name: 'Trưởng làng',
        frame: 86,

        // Bên phải nhà mái đỏ phía trên.
        col: 7.5,
        row: 12,

        lines: [
            'Chào mừng cháu đến Làng Khởi Đầu!',
            'Giếng nước nằm ở phía đông quảng trường. Người dân thường gặp nhau ở đó.',
            'Hãy làm quen với mọi người trước khi bắt đầu chuyến phiêu lưu.'
        ]
    },
    {
        id: 'mage',
        name: 'Pháp sư',
        frame: 84,

        // Bên trái nhà mái xanh phía dưới.
        col: 10.5,
        row: 23.7,

        lines: [
            'Ta đang nghiên cứu những dấu tích trong hầm ngục.',
            'Muốn đi xa, cháu cần chuẩn bị trang bị và thuốc hồi phục.',
            'Khi cánh cổng hầm ngục mở, ta sẽ chỉ đường cho cháu.'
        ]
    },
    {
        id: 'merchant',
        name: 'Thương nhân',
        frame: 85,

        // Bên phải nhà mái xanh phía trên.
        col: 29.5,
        row: 12,

        lines: [
            'Chào khách phương xa! Ta là thương nhân của làng.',
            'Cửa hàng đang được chuẩn bị. Sau này cháu có thể mua vật phẩm ở đây.'
        ]
    },
    {
        id: 'villager',
        name: 'Dân làng',
        frame: 99,

        // Bên phải nhà mái đỏ phía dưới.
        col: 29.5,
        row: 23.7,

        lines: [
            'Cháu thấy vườn nấm của chúng ta chưa?',
            'Đi theo con đường phía nam sẽ đến những ngôi nhà và khu vườn.'
        ]
    }
];