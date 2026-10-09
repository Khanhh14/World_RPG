import { Scene, Input } from 'phaser';

const TILE = 48;

const COLS = 44;

const ROWS = 32;

export class Game extends Scene {

    constructor() {

        super('Game');

    }

    preload() {

        this.load.spritesheet(

            'town',

            'assets/tiny-town/Tilemap/tilemap_packed.png',

            { frameWidth: 16, frameHeight: 16 }

        );

        this.load.spritesheet(
            'dungeon',
            'assets/tiny-dungeon/Tilemap/tilemap_packed.png',
            { frameWidth: 16, frameHeight: 16 }
        );

    }

    create() {

        this.blockers = [];

        this.paths = new Set();

        this.physics.world.setBounds(

            0, 0, COLS * TILE, ROWS * TILE

        );

        this.cameras.main.setBounds(

            0, 0, COLS * TILE, ROWS * TILE

        );

        this.cameras.main.setBackgroundColor('#83c46a');

        // 1. Nền cỏ với hoa và các mảng cỏ nhỏ.

        for (let y = 0; y < ROWS; y++) {

            for (let x = 0; x < COLS; x++) {

                const value = (x * 17 + y * 31) % 43;

                const frame = value === 0 ? 2 : value < 7 ? 1 : 0;

                this.tile(x, y, frame);

            }

        }

        // 2. Vẽ sơ đồ đường trước, sau đó ghép viền.

        this.pathRect(0, 14, COLS, 3);

        this.pathRect(19, 0, 3, ROWS);

        // Quảng trường trung tâm.

        this.pathRect(16, 11, 11, 9);

        // Lối vào hai nhà phía trên.

        this.pathRect(8, 11, 2, 4);

        this.pathRect(30, 11, 2, 4);

        // Đường vòng phía dưới và lối vào nhà.

        this.pathRect(10, 24, 23, 2);

        this.pathRect(11, 23, 2, 2);

        this.pathRect(30, 23, 2, 2);

        this.drawPaths();

        // Lát đá một phần quảng trường.

        for (let y = 12; y <= 18; y++) {

            for (let x = 17; x <= 25; x++) {

                this.tile(x, y, 43, 2);

            }

        }

        // 3. Nhà.

        this.house(7, 7, 'red');

        this.house(29, 7, 'blue');

        this.house(10, 19, 'blue');

        this.house(29, 19, 'red');

        // 4. Giếng nước và ghế quanh quảng trường.

        this.createPropTextures();

        this.prop('well', 23, 15, 66, 40);

        this.prop('bench', 17, 12, 70, 20);

        this.prop('bench', 25, 18, 70, 20);

        // 5. Hàng rào quanh các khu vườn.

        this.fence(5, 5, 9);

        this.fence(28, 5, 9);

        this.fence(5, 22, 4);

        this.fence(34, 22, 5);

        this.fence(10, 28, 7);

        this.fence(28, 28, 8);

        // 6. Cây xanh và cây vàng.

        const trees = [

            [1, 1, false], [5, 1, false], [10, 1, true],

            [14, 1, false], [25, 1, false], [30, 1, true],

            [35, 1, false], [40, 1, true],

            [1, 6, false], [39, 7, false],

            [2, 19, true], [5, 25, false],

            [1, 28, false], [15, 28, true],

            [24, 28, false], [38, 26, true],

            [40, 20, false]

        ];

        for (const [x, y, autumn] of trees) {

            this.tree(x, y, autumn);

        }

        // 7. Vườn nấm: đất nhỏ có viền riêng.

        this.garden(5, 18, 3, 3);

        this.garden(35, 18, 3, 3);

        // Cây nhỏ, hoa và nấm ven nhà.

        const decorations = [

            [6, 11, 28], [11, 11, 15], [27, 11, 28],

            [33, 11, 15], [9, 22, 29], [33, 23, 29],

            [14, 20, 17], [27, 20, 17],

            [14, 8, 2], [25, 8, 2],

            [8, 27, 29], [37, 27, 29],

            [15, 18, 28], [28, 18, 15]

        ];

        for (const [x, y, frame] of decorations) {

            this.tile(x, y, frame, 100 + (y + 1) * TILE);

        }

        // Đá và biển báo có va chạm.

        this.solidTile(4, 12, 92, 30, 18);

        this.solidTile(36, 12, 92, 30, 18);

        this.solidTile(15, 13, 95, 24, 24);

        this.solidTile(27, 17, 95, 24, 24);

        // Đồ trang trí gần nhà.

        this.solidTile(13, 10, 83, 30, 22);

        this.solidTile(34, 10, 94, 30, 22);

        this.solidTile(14, 23, 83, 30, 22);

        // 8. Nhân vật.

        // Frame 96 trong Tiny Dungeon: hiệp sĩ.

        this.player = this.physics.add.sprite(

            20 * TILE,

            16 * TILE,

            'dungeon',
            96

        );

        this.player.setScale(3);

        this.player.setCollideWorldBounds(true);

        this.player.body.setSize(8, 5);

        this.player.body.setOffset(4, 11);

        this.createNPCs();

        this.physics.add.collider(this.player, this.blockers);

        this.shadow = this.add.ellipse(

            this.player.x, this.player.y + 22,

            26, 10, 0x000000, 0.2

        );

        this.cursors = this.input.keyboard.createCursorKeys();

        this.keys = this.input.keyboard.addKeys('W,A,S,D,E,ESC');

        this.createDialogueUI();
        this.activeDialogue = null;
        this.nearestNPC = null;

        this.cameras.main.startFollow(this.player, true, 0.12, 0.12);

        this.cameras.main.roundPixels = true;

        this.add.text(

            16, 16,

            'LÀNG KHỞI ĐẦU\nWASD: di chuyển · E: nói chuyện · Esc: đóng',

            {

                fontFamily: 'Arial',

                fontSize: '18px',

                color: '#ffffff',

                backgroundColor: '#20382b',

                padding: { x: 12, y: 10 }

            }

        ).setScrollFactor(0).setDepth(10000);

    }

    tile(x, y, frame, depth = 0) {

        return this.add.image(

            x * TILE, y * TILE, 'town', frame

        ).setOrigin(0).setScale(3).setDepth(depth);

    }

    blocker(x, y, width, height) {

        const object = this.add.rectangle(

            x, y, width, height, 0xffffff, 0

        );

        this.physics.add.existing(object, true);

        this.blockers.push(object);

    }

    // Lưu các ô đường vào tập hợp để nối đường không bị chồng viền.

    pathRect(x, y, width, height) {

        for (let row = y; row < y + height; row++) {

            for (let col = x; col < x + width; col++) {

                this.paths.add(`${col},${row}`);

            }

        }

    }

    drawPaths() {

        const has = (x, y) => this.paths.has(`${x},${y}`);

        for (const position of this.paths) {

            const [x, y] = position.split(',').map(Number);

            const top = !has(x, y - 1);

            const bottom = !has(x, y + 1);

            const left = !has(x - 1, y);

            const right = !has(x + 1, y);

            let frame = 25; // Đất ở giữa đường.

            if (top && left) frame = 12;

            else if (top && right) frame = 14;

            else if (bottom && left) frame = 36;

            else if (bottom && right) frame = 38;

            else if (top) frame = 13;

            else if (bottom) frame = 37;

            else if (left) frame = 24;

            else if (right) frame = 26;

            this.tile(x, y, frame, 1);

        }

    }

    house(x, y, style) {

        const frames = style === 'red'

            ? [

                [52, 53, 54],

                [64, 65, 66],

                [72, 73, 75],

                [84, 85, 87]

            ]

            : [

                [48, 49, 50],

                [60, 61, 62],

                [76, 77, 77],

                [88, 89, 91]

            ];

        const bottom = (y + 4) * TILE;

        const depth = 100 + bottom;

        this.add.ellipse(

            (x + 1.5) * TILE, bottom - 8,

            154, 30, 0x000000, 0.15

        ).setDepth(depth - 1);

        frames.forEach((row, dy) => {

            row.forEach((frame, dx) => {

                this.tile(x + dx, y + dy, frame, depth);

            });

        });

        this.blocker(

            (x + 1.5) * TILE,

            (y + 3) * TILE,

            132, 88

        );

    }

    tree(x, y, autumn = false) {

        const frames = autumn

            ? [[9, 10, 11], [21, 22, 23], [33, 34, 35]]

            : [[6, 7, 8], [18, 19, 20], [30, 31, 32]];

        const bottom = (y + 3) * TILE;

        const depth = 100 + bottom;

        this.add.ellipse(

            (x + 1.5) * TILE, bottom - 8,

            90, 24, 0x000000, 0.15

        ).setDepth(depth - 1);

        frames.forEach((row, dy) => {

            row.forEach((frame, dx) => {

                this.tile(x + dx, y + dy, frame, depth);

            });

        });

        this.blocker((x + 1.5) * TILE, bottom - 20, 30, 24);

    }

    fence(x, y, length) {

        for (let i = 0; i < length; i++) {

            const frame = i === 0 ? 80 : i === length - 1 ? 82 : 81;

            this.tile(x + i, y, frame, 100 + (y + 1) * TILE);

        }

        this.blocker(

            (x + length / 2) * TILE,

            (y + 0.65) * TILE,

            length * TILE, 18

        );

    }

    garden(x, y, width, height) {

        for (let dy = 0; dy < height; dy++) {

            for (let dx = 0; dx < width; dx++) {

                const top = dy === 0;

                const bottom = dy === height - 1;

                const left = dx === 0;

                const right = dx === width - 1;

                let frame = 25;

                if (top) frame = left ? 12 : right ? 14 : 13;

                else if (bottom) frame = left ? 36 : right ? 38 : 37;

                else if (left) frame = 24;

                else if (right) frame = 26;

                this.tile(x + dx, y + dy, frame, 1);

                this.tile(

                    x + dx, y + dy, 29,

                    100 + (y + dy + 1) * TILE

                );

            }

        }

    }

    solidTile(x, y, frame, width, height) {

        this.tile(x, y, frame, 100 + (y + 1) * TILE);

        this.blocker(

            (x + 0.5) * TILE, (y + 0.75) * TILE,

            width, height

        );

    }

    prop(key, col, row, width, height) {

        const x = (col + 0.5) * TILE;

        const feetY = (row + 1) * TILE;

        this.add.ellipse(

            x, feetY - 5, width + 16, 18,

            0x000000, 0.18

        ).setDepth(99 + feetY);

        this.add.image(x, feetY, key)

            .setOrigin(0.5, 1)

            .setScale(3)

            .setDepth(100 + feetY);

        this.blocker(x, feetY - height / 2, width, height);

    }

    // Tạo texture bằng hình vẽ pixel, không cần ảnh bên ngoài.

    makeTexture(key, width, height, draw) {

        if (this.textures.exists(key)) return;

        const graphics = this.add.graphics();

        draw(graphics);

        graphics.generateTexture(key, width, height);

        graphics.destroy();

    }

    createPropTextures() {

        this.makeTexture('well', 32, 40, (g) => {

            // Thành giếng.

            g.fillStyle(0x4b5264);

            g.fillRect(5, 25, 22, 13);

            g.fillStyle(0x8996a6);

            g.fillRect(4, 23, 24, 5);

            g.fillStyle(0xbac5ce);

            g.fillRect(5, 23, 22, 2);

            // Lòng giếng và nước.

            g.fillStyle(0x263849);

            g.fillRect(8, 25, 16, 3);

            g.fillStyle(0x438fbe);

            g.fillRect(10, 26, 12, 2);

            // Các viên đá trên thành giếng.

            g.fillStyle(0xa7b2bd);

            g.fillRect(6, 29, 6, 3);

            g.fillRect(14, 29, 6, 3);

            g.fillRect(22, 29, 4, 3);

            g.fillRect(9, 34, 6, 3);

            g.fillRect(17, 34, 6, 3);

            // Cột gỗ.

            g.fillStyle(0x69432f);

            g.fillRect(5, 10, 3, 18);

            g.fillRect(24, 10, 3, 18);

            g.fillStyle(0xa37048);

            g.fillRect(5, 10, 1, 18);

            g.fillRect(24, 10, 1, 18);

            // Trục quay, dây và gầu.

            g.fillStyle(0x805437);

            g.fillRect(7, 17, 18, 3);

            g.fillStyle(0xdec99b);

            g.fillRect(16, 19, 1, 8);

            g.fillStyle(0x78533c);

            g.fillRect(14, 24, 5, 4);

            // Mái giếng dạng bậc pixel.

            g.fillStyle(0x783f35);

            g.fillRect(1, 10, 30, 3);

            g.fillStyle(0xb95a43);

            g.fillRect(3, 7, 26, 3);

            g.fillRect(6, 4, 20, 3);

            g.fillRect(10, 1, 12, 3);

            g.fillStyle(0xe28b5d);

            g.fillRect(10, 1, 12, 1);

            g.fillRect(6, 4, 20, 1);

            g.fillRect(3, 7, 26, 1);

        });

        this.makeTexture('bench', 32, 20, (g) => {

            // Chân ghế.

            g.fillStyle(0x4f392d);

            g.fillRect(4, 10, 3, 10);

            g.fillRect(25, 10, 3, 10);

            // Lưng ghế và mặt ghế.

            g.fillStyle(0x98633e);

            g.fillRect(2, 2, 28, 4);

            g.fillRect(2, 7, 28, 4);

            g.fillRect(1, 13, 30, 4);

            g.fillStyle(0xc58b55);

            g.fillRect(2, 2, 28, 1);

            g.fillRect(2, 7, 28, 1);

            g.fillRect(1, 13, 30, 1);

            g.fillStyle(0x65452f);

            g.fillRect(7, 3, 1, 2);

            g.fillRect(23, 8, 1, 2);

        });

    }

    // Tọa độ tính theo ô; y là vị trí chân NPC.
    createNPCs() {
        const definitions = [
            {
                name: 'Trưởng làng', frame: 86, col: 21.5, row: 13.5,
                lines: [
                    'Chào mừng cháu đến Làng Khởi Đầu!',
                    'Giếng nước nằm ở phía đông quảng trường. Người dân thường gặp nhau ở đó.',
                    'Hãy làm quen với mọi người trước khi bắt đầu chuyến phiêu lưu.'
                ]
            },
            {
                name: 'Pháp sư', frame: 84, col: 17, row: 18,
                lines: [
                    'Ta đang nghiên cứu những dấu tích trong hầm ngục.',
                    'Muốn đi xa, cháu cần chuẩn bị trang bị và thuốc hồi phục.',
                    'Khi cánh cổng hầm ngục mở, ta sẽ chỉ đường cho cháu.'
                ]
            },
            {
                name: 'Thương nhân', frame: 85, col: 30.5, row: 12.5,
                lines: [
                    'Chào khách phương xa! Ta là thương nhân của làng.',
                    'Cửa hàng đang được chuẩn bị. Sau này cháu có thể mua vật phẩm ở đây.'
                ]
            },
            {
                name: 'Dân làng', frame: 99, col: 10, row: 16.5,
                lines: [
                    'Cháu thấy vườn nấm của chúng ta chưa?',
                    'Đi theo con đường phía nam sẽ đến những ngôi nhà và khu vườn.'
                ]
            }
        ];

        this.npcs = definitions.map((data) => {
            const x = data.col * TILE;
            const feetY = data.row * TILE;
            const sprite = this.add.sprite(x, feetY - 24, 'dungeon', data.frame)
                .setScale(3)
                .setDepth(100 + feetY);

            this.add.ellipse(x, feetY - 2, 30, 10, 0x000000, 0.2)
                .setDepth(99 + feetY);

            this.add.text(x, feetY - 56, data.name, {
                fontFamily: 'Arial', fontSize: '14px',
                color: '#fff2c6', backgroundColor: '#20382b',
                padding: { x: 5, y: 3 }
            }).setOrigin(0.5, 1).setDepth(9000);

            // Chỉ chặn vùng chân, để nhân vật đi được phía sau NPC.
            this.blocker(x, feetY - 8, 24, 16);

            return { ...data, sprite, x, feetY };
        });
    }

    createDialogueUI() {
        const width = this.scale.width;
        const height = this.scale.height;
        const top = height - 174;

        this.talkHint = this.add.text(width / 2, height - 30, '', {
            fontFamily: 'Arial', fontSize: '18px', color: '#fff2c6',
            backgroundColor: '#20382b', padding: { x: 12, y: 8 }
        }).setOrigin(0.5, 1).setScrollFactor(0).setDepth(10010)
            .setVisible(false);

        const panel = this.add.rectangle(20, top, width - 40, 154, 0x15251d, 0.97)
            .setOrigin(0).setStrokeStyle(3, 0xd7bd79);

        this.dialogueName = this.add.text(40, top + 14, '', {
            fontFamily: 'Arial', fontSize: '21px', color: '#ffd166'
        });

        this.dialogueText = this.add.text(40, top + 48, '', {
            fontFamily: 'Arial', fontSize: '19px', color: '#ffffff',
            wordWrap: { width: width - 90 }, lineSpacing: 5
        });

        this.dialogueFooter = this.add.text(40, top + 126, '', {
            fontFamily: 'Arial', fontSize: '14px', color: '#b8cabd'
        });

        this.dialogueElements = [
            panel, this.dialogueName, this.dialogueText, this.dialogueFooter
        ];

        for (const element of this.dialogueElements) {
            element.setScrollFactor(0).setDepth(10020).setVisible(false);
        }
    }

    findNearestNPC() {
        const feetY = this.player.y + this.player.displayHeight / 2;
        let nearest = null;
        let minimum = 88;

        for (const npc of this.npcs) {
            const distance = Math.hypot(this.player.x - npc.x, feetY - npc.feetY);
            if (distance < minimum) {
                minimum = distance;
                nearest = npc;
            }
        }
        return nearest;
    }

    interact() {
        if (this.activeDialogue) {
            this.activeDialogue.index += 1;
            if (this.activeDialogue.index >= this.activeDialogue.npc.lines.length) {
                this.closeDialogue();
            } else {
                this.showDialogueLine();
            }
            return;
        }

        const npc = this.findNearestNPC();
        if (!npc) return;

        this.activeDialogue = { npc, index: 0 };
        this.player.setVelocity(0, 0);
        npc.sprite.setFlipX(this.player.x < npc.x);
        this.talkHint.setVisible(false);
        this.showDialogueLine();
    }

    showDialogueLine() {
        const { npc, index } = this.activeDialogue;
        this.dialogueName.setText(npc.name);
        this.dialogueText.setText(npc.lines[index]);
        const action = index === npc.lines.length - 1 ? 'đóng' : 'tiếp tục';
        this.dialogueFooter.setText(
            `${index + 1}/${npc.lines.length} · E: ${action} · Esc: đóng`
        );
        this.dialogueElements.forEach((element) => element.setVisible(true));
    }

    closeDialogue() {
        this.activeDialogue = null;
        this.dialogueElements.forEach((element) => element.setVisible(false));
    }

    update() {

        const pressE = Input.Keyboard.JustDown(this.keys.E);
        const pressEsc = Input.Keyboard.JustDown(this.keys.ESC);

        if (pressEsc && this.activeDialogue) this.closeDialogue();
        else if (pressE) this.interact();

        if (this.activeDialogue) {
            this.player.setVelocity(0, 0);
            return;
        }

        this.nearestNPC = this.findNearestNPC();
        this.talkHint.setVisible(Boolean(this.nearestNPC));
        if (this.nearestNPC) {
            this.talkHint.setText(`E · Nói chuyện với ${this.nearestNPC.name}`);
        }

        let x = 0;
        let y = 0;

        if (this.cursors.left.isDown || this.keys.A.isDown) x--;

        if (this.cursors.right.isDown || this.keys.D.isDown) x++;

        if (this.cursors.up.isDown || this.keys.W.isDown) y--;

        if (this.cursors.down.isDown || this.keys.S.isDown) y++;

        const length = Math.hypot(x, y);

        const speed = 200;

        this.player.setVelocity(

            length ? x / length * speed : 0,

            length ? y / length * speed : 0

        );

        if (x !== 0) this.player.setFlipX(x < 0);

        const feetY = this.player.y + this.player.displayHeight / 2;

        this.player.setDepth(100 + feetY);

        this.shadow.setPosition(this.player.x, this.player.y + 22);

        this.shadow.setDepth(99 + feetY);

    }

}
