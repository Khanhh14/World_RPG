# Hướng Dẫn Sử Dụng Phaser 3

## Giới Thiệu

Phaser là một framework JavaScript mã nguồn mở để phát triển game 2D cho web. Phiên bản hiện tại là Phaser 3, cung cấp nhiều tính năng mạnh mẽ và hiệu suất cao.

## Cài Đặt

### Sử dụng CDN

```html
<script src="https://cdn.jsdelivr.net/npm/phaser@3.80.1/dist/phaser.js"></script>
```

### Sử dụng NPM

```bash
npm install phaser
```

### Sử dụng Yarn

```bash
yarn add phaser
```

## Cấu Trúc Cơ Bản

### Game Config

```javascript
const config = {
    type: Phaser.AUTO,          // WebGL hoặc Canvas tự động
    width: 800,                  // Chiều rộng game
    height: 600,                 // Chiều cao game
    backgroundColor: '#2d2d2d',  // Màu nền
    physics: {
        default: 'arcade',       // Engine vật lý
        arcade: {
            gravity: { y: 300 }, // Trọng lực
            debug: false         // Bật/tắt debug mode
        }
    },
    scene: [MainScene]           // Các scene trong game
};

const game = new Phaser.Game(config);
```

## Scene - Màn Chơi

Mỗi scene đại diện cho một màn chơi hoặc trạng thái của game.

### Tạo Scene

```javascript
class MainScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainScene' });
    }

    preload() {
        // Tải tài nguyên (hình ảnh, âm thanh, sprite...)
        this.load.image('player', 'assets/player.png');
        this.load.audio('jump', 'assets/jump.mp3');
    }

    create() {
        // Khởi tạo game objects và logic
        this.player = this.add.sprite(400, 300, 'player');
        this.jumpSound = this.sound.add('jump');
    }

    update(time, delta) {
        // Cập nhật logic game mỗi frame
        // time: thời gian từ khi game bắt đầu (ms)
        // delta: thời gian giữa 2 frame (ms)
    }
}
```

## Các Thành Phần Chính

### 1. Sprites và Images

```javascript
// Tạo image tĩnh
this.add.image(400, 300, 'background');

// Tạo sprite động
this.player = this.add.sprite(100, 100, 'player');

// Tạo sprite với physics
this.player = this.physics.add.sprite(100, 100, 'player');
```

### 2. Animations

```javascript
// Tải spritesheet
this.load.spritesheet('dude', 'assets/dude.png', {
    frameWidth: 32,
    frameHeight: 48
});

// Tạo animation
this.anims.create({
    key: 'run',
    frames: this.anims.generateFrameNumbers('dude', { start: 0, end: 3 }),
    frameRate: 10,
    repeat: -1 // -1 = lặp vô hạn
});

// Phát animation
this.player.anims.play('run');
```

### 3. Physics - Vật Lý

```javascript
// Thêm vật lý cho sprite
this.player = this.physics.add.sprite(100, 100, 'player');

// Thiết lập thuộc tính vật lý
this.player.setBounce(0.2);           // Độ nảy
this.player.setCollideWorldBounds(true); // Va chạm với biên
this.player.setVelocity(100, -200);   // Tốc độ (x, y)

// Kiểm tra va chạm giữa 2 đối tượng
this.physics.add.collider(player, platforms);

// Kiểm tra overlap (chồng lấn)
this.physics.add.overlap(player, stars, collectStar, null, this);

function collectStar(player, star) {
    star.disableBody(true, true);
    score += 10;
}
```

### 4. Input - Điều Khiển

```javascript
// Phím bàn phím
this.cursors = this.input.keyboard.createCursorKeys();

if (this.cursors.left.isDown) {
    this.player.setVelocityX(-160);
} else if (this.cursors.right.isDown) {
    this.player.setVelocityX(160);
}

// Phím tùy chỉnh
this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
    this.player.setVelocityY(-330);
}

// Chuột
this.input.on('pointerdown', (pointer) => {
    console.log(pointer.x, pointer.y);
});
```

### 5. Text

```javascript
// Text cơ bản
this.scoreText = this.add.text(16, 16, 'Score: 0', {
    fontSize: '32px',
    fill: '#fff',
    fontFamily: 'Arial'
});

// Cập nhật text
this.scoreText.setText('Score: ' + score);
```

### 6. Groups

```javascript
// Tạo group
this.stars = this.physics.add.group({
    key: 'star',
    repeat: 11,
    setXY: { x: 12, y: 0, stepX: 70 }
});

// Iterate qua group
this.stars.children.iterate((child) => {
    child.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8));
});
```

### 7. Camera

```javascript
// Theo dõi player
this.cameras.main.startFollow(this.player);

// Đặt giới hạn camera
this.cameras.main.setBounds(0, 0, 3200, 600);

// Zoom
this.cameras.main.setZoom(2);

// Hiệu ứng shake
this.cameras.main.shake(500);

// Fade
this.cameras.main.fadeIn(1000);
```

### 8. Audio

```javascript
// Tải audio
this.load.audio('music', 'assets/music.mp3');
this.load.audio('jump', 'assets/jump.wav');

// Phát nhạc nền
this.music = this.sound.add('music', { loop: true });
this.music.play();

// Phát sound effect
this.jumpSound = this.sound.add('jump');
this.jumpSound.play();

// Điều chỉnh volume
this.music.setVolume(0.5);
```

## Ví Dụ Game Hoàn Chỉnh

```javascript
class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
        this.score = 0;
    }

    preload() {
        this.load.image('sky', 'assets/sky.png');
        this.load.image('ground', 'assets/platform.png');
        this.load.image('star', 'assets/star.png');
        this.load.spritesheet('dude', 'assets/dude.png', {
            frameWidth: 32,
            frameHeight: 48
        });
    }

    create() {
        // Background
        this.add.image(400, 300, 'sky');

        // Platforms
        this.platforms = this.physics.add.staticGroup();
        this.platforms.create(400, 568, 'ground').setScale(2).refreshBody();
        this.platforms.create(600, 400, 'ground');
        this.platforms.create(50, 250, 'ground');
        this.platforms.create(750, 220, 'ground');

        // Player
        this.player = this.physics.add.sprite(100, 450, 'dude');
        this.player.setBounce(0.2);
        this.player.setCollideWorldBounds(true);

        // Animations
        this.anims.create({
            key: 'left',
            frames: this.anims.generateFrameNumbers('dude', { start: 0, end: 3 }),
            frameRate: 10,
            repeat: -1
        });

        this.anims.create({
            key: 'turn',
            frames: [{ key: 'dude', frame: 4 }],
            frameRate: 20
        });

        this.anims.create({
            key: 'right',
            frames: this.anims.generateFrameNumbers('dude', { start: 5, end: 8 }),
            frameRate: 10,
            repeat: -1
        });

        // Stars
        this.stars = this.physics.add.group({
            key: 'star',
            repeat: 11,
            setXY: { x: 12, y: 0, stepX: 70 }
        });

        this.stars.children.iterate((child) => {
            child.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8));
        });

        // Colliders
        this.physics.add.collider(this.player, this.platforms);
        this.physics.add.collider(this.stars, this.platforms);
        this.physics.add.overlap(this.player, this.stars, this.collectStar, null, this);

        // Input
        this.cursors = this.input.keyboard.createCursorKeys();

        // Score
        this.scoreText = this.add.text(16, 16, 'Score: 0', {
            fontSize: '32px',
            fill: '#000'
        });
    }

    update() {
        if (this.cursors.left.isDown) {
            this.player.setVelocityX(-160);
            this.player.anims.play('left', true);
        } else if (this.cursors.right.isDown) {
            this.player.setVelocityX(160);
            this.player.anims.play('right', true);
        } else {
            this.player.setVelocityX(0);
            this.player.anims.play('turn');
        }

        if (this.cursors.up.isDown && this.player.body.touching.down) {
            this.player.setVelocityY(-330);
        }
    }

    collectStar(player, star) {
        star.disableBody(true, true);
        this.score += 10;
        this.scoreText.setText('Score: ' + this.score);
    }
}

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 300 },
            debug: false
        }
    },
    scene: GameScene
};

const game = new Phaser.Game(config);
```

## Tips & Best Practices

### 1. Tối Ưu Hiệu Năng

- Sử dụng `texture atlas` thay vì nhiều image riêng lẻ
- Tắt debug mode trong production (`debug: false`)
- Sử dụng object pooling cho các đối tượng tái sử dụng
- Giới hạn số lượng particles

### 2. Quản Lý Scene

```javascript
// Chuyển scene
this.scene.start('NextScene');

// Tạm dừng scene
this.scene.pause('CurrentScene');

// Tiếp tục scene
this.scene.resume('CurrentScene');

// Chạy song song nhiều scene
this.scene.launch('UIScene');
```

### 3. Responsive Design

```javascript
const config = {
    type: Phaser.AUTO,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: 800,
        height: 600
    },
    scene: MainScene
};
```

## Tài Nguyên Học Tập

- **Trang chủ Phaser**: https://phaser.io/
- **Documentation**: https://photonstorm.github.io/phaser3-docs/
- **Examples**: https://phaser.io/examples
- **Tutorial chính thức**: https://phaser.io/tutorials/making-your-first-phaser-3-game
- **Forum**: https://phaser.discourse.group/
- **Discord**: https://discord.gg/phaser

## Công Cụ Hữu Ích

- **Tiled Map Editor**: Tạo tilemap cho game
- **TexturePacker**: Tạo sprite atlas
- **Aseprite**: Vẽ pixel art và sprite
- **Phaser Editor 2D**: IDE chuyên cho Phaser

## Kết Luận

Phaser 3 là một framework mạnh mẽ và dễ học để tạo game 2D. Với tài liệu phong phú và cộng đồng lớn, bạn có thể bắt đầu tạo game ngay hôm nay!

---

**Chúc bạn phát triển game vui vẻ! 🎮**

## Tiny RPG - Lưu tiến trình theo tài khoản

Tiến trình giao diện vẫn được lưu tạm trên trình duyệt theo ID tài khoản; nhiệm vụ và phần thưởng được lưu trên MySQL theo nhân vật.

Trong **Sự kiện → Săn Quái & Boss**, hạ quái thường đạt các mốc 100, 300, 500, 1.000, 1.500, 2.000; hạ boss đạt các mốc 10, 20, 40, 70, 100. Mỗi mốc nhận một lần, tiến độ và giao dịch quà được lưu theo nhân vật trên máy chủ. Quà gồm vàng, đá quý, vật phẩm nâng cấp/cánh/kỹ năng và vũ khí sự kiện theo class.

Sau khi đã có các bảng `quests` và `character_quests`, chạy `backend/quest-progress.sql` một lần trên MySQL của game để tạo bảng chống ghi nhận sự kiện nhiệm vụ lặp. Khởi động lại backend sau khi chạy migration. Backend tự tạo tiến độ cho ba nhiệm vụ theo thứ tự: khám phá ba khu vực, câu 15 con cá ở Hồ Atlast, rồi hạ 20 quái ở Khu Rừng Phía Tây. Game chỉ hiển thị nhiệm vụ hiện tại; nhiệm vụ tiếp theo mở sau khi nhận thưởng nhiệm vụ trước. Tiến độ được ghi nhận khi vào khu vực, nhận cá thành công hoặc hạ quái; phần thưởng EXP/vàng chỉ được cộng khi bấm **Nhận thưởng**.