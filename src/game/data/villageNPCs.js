// col, row tính theo ô; row là vị trí chân NPC.
export const villageNPCs = [
    {id:'village-coachman',name:'Mã Phu',role:'coachman',frame:100,col:24,row:20.5,lines:['Bạn muốn đi tới đâu?']},
    {
        id: 'elder',
        name: 'Trưởng làng',
        frame: 86,

        // Bên phải nhà mái đỏ phía trên.
        col: 7.5,
        row: 12,

        lines: [
            'Chào mừng cháu đến Làng Khởi Đầu!',
            'Khu cây xanh nằm ở phía tây bắc của làng.',
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
            'Học giả Sora tại Thành Yuna lưu giữ sách kỹ năng của các hệ Ma, Thần và Nhân.',
            'Muốn đi xa, cháu cần chuẩn bị trang bị và thuốc hồi phục.'
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
            'Cháu đã ghé khu cây xanh phía tây bắc chưa?',
            'Đi theo đường phía nam sẽ đến những ngôi nhà còn lại.'
        ]
    }
];