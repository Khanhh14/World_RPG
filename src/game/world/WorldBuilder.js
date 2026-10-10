import { createPropTextures } from './propTextures.js';

// Bộ ghép bản đồ từ các tile của Tiny Town.
// Mỗi bản đồ dùng một instance riêng; không chia sẻ blockers giữa các Scene.
export class WorldBuilder {
    constructor(scene, data) {
        this.scene = scene;
        this.data = data;
        this.tileSize = data.tileSize;
        this.tileset = data.tileset;
        this.blockers = [];
        this.paths = new Set();
    }

    get add() { return this.scene.add; }
    get physics() { return this.scene.physics; }

    build() {
        const data = this.data;
        for (let y = 0; y < data.rows; y++) {
            for (let x = 0; x < data.cols; x++) {
                const value = (x * 17 + y * 31) % 43;
                this.tile(x, y, value === 0 ? 2 : value < 7 ? 1 : 0);
            }
        }
        for (const rect of data.paths ?? []) this.pathRect(...rect);
        this.drawPaths();
        for (const area of data.paving ?? []) {
            for (let y = area.y; y < area.y + area.height; y++) {
                for (let x = area.x; x < area.x + area.width; x++) {
                    this.tile(x, y, area.frame, 2);
                }
            }
        }
        for (const item of data.houses ?? []) this.house(...item);
        createPropTextures(this.scene);
        for (const item of data.props ?? []) this.prop(...item);
        for (const item of data.fences ?? []) this.fence(...item);
        for (const item of data.trees ?? []) this.tree(...item);
        for (const item of data.gardens ?? []) this.garden(...item);
        for (const [x, y, frame] of data.decorations ?? []) {
            this.tile(x, y, frame, 100 + (y + 1) * this.tileSize);
        }
        for (const item of data.solidTiles ?? []) this.solidTile(...item);
    }

    tile(x, y, frame, depth = 0) {
        return this.add.image(
            x * this.tileSize, y * this.tileSize, this.tileset, frame
        ).setOrigin(0).setScale(this.tileSize / 16).setDepth(depth);
    }

    blocker(x, y, width, height) {
        const object = this.add.rectangle(
            x, y, width, height, 0xffffff, 0
        );
        this.physics.add.existing(object, true);
        this.blockers.push(object);
        return object;
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
        const bottom = (y + 4) * this.tileSize;
        const depth = 100 + bottom;
        this.add.ellipse(
            (x + 1.5) * this.tileSize, bottom - 8,
            154, 30, 0x000000, 0.15
        ).setDepth(depth - 1);
        frames.forEach((row, dy) => {
            row.forEach((frame, dx) => {
                this.tile(x + dx, y + dy, frame, depth);
            });
        });
        this.blocker(
            (x + 1.5) * this.tileSize,
            (y + 3) * this.tileSize,
            132, 88
        );
    }

    tree(x, y, autumn = false) {
        const frames = autumn ? [3, 15] : [4, 16];
        const col = x + 1, row = y + 1;
        const centerX = (col + 0.5) * this.tileSize;
        const bottom = (row + 2) * this.tileSize;
        const depth = 100 + bottom;
        this.add.ellipse(centerX,bottom-6,this.tileSize*0.8,this.tileSize*0.25,0,0.15).setDepth(depth-1);
        frames.forEach((frame,index)=>this.tile(col,row+index,frame,depth));
        this.blocker(centerX,bottom-10,this.tileSize*0.5,18);
    }

    fence(x, y, length) {
        for (let i = 0; i < length; i++) {
            const frame = i === 0 ? 80 : i === length - 1 ? 82 : 81;
            this.tile(x + i, y, frame, 100 + (y + 1) * this.tileSize);
        }
        this.blocker(
            (x + length / 2) * this.tileSize,
            (y + 0.65) * this.tileSize,
            length * this.tileSize, 18
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
                    100 + (y + dy + 1) * this.tileSize
                );
            }
        }
    }

    solidTile(x, y, frame, width, height) {
        this.tile(x, y, frame, 100 + (y + 1) * this.tileSize);
        this.blocker(
            (x + 0.5) * this.tileSize, (y + 0.75) * this.tileSize,
            width, height
        );
    }

    prop(key, col, row, width, height) {
        const x = (col + 0.5) * this.tileSize;
        const feetY = (row + 1) * this.tileSize;
        this.add.ellipse(
            x, feetY - 5, width + 16, 18,
            0x000000, 0.18
        ).setDepth(99 + feetY);
        this.add.image(x, feetY, key)
            .setOrigin(0.5, 1)
            .setScale(this.tileSize / 16)
            .setDepth(100 + feetY);
        this.blocker(x, feetY - height / 2, width, height);
    }
    // Tạo texture bằng hình vẽ pixel, không cần ảnh bên ngoài.
}
