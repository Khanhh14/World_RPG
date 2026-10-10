import { WorldObjects } from './WorldObjects.js';

// Nền ghép thành một texture, cây/đá là vật thể độc lập để xếp lớp theo chân.
export class ProceduralWorldBuilder {
    constructor(scene, data) {
        this.scene = scene; this.data = data; this.tileSize = data.tileSize;
        this.blockers = [];
        this.objects = new WorldObjects(scene, this.blockers, data.tileSize / 16);
        this.paths = new Set();
        for (const [x, y, width, height] of data.paths ?? []) {
            for (let row = y; row < y + height; row++) {
                for (let col = x; col < x + width; col++) this.paths.add(`${col},${row}`);
            }
        }
    }
    blocker(...args) { return this.objects.blocker(...args); }
    build() {
        const map = this.data;
        const key = `rpg-code-ground-v3-${map.id}`;
        if (!this.scene.textures.exists(key)) {
            const g = this.scene.add.graphics();
            const r = (color, x, y, w, h) => { g.fillStyle(color); g.fillRect(x, y, w, h); };
            const has = (x, y) => this.paths.has(`${x},${y}`);
            for (let y = 0; y < map.rows; y++) {
                for (let x = 0; x < map.cols; x++) {
                    const px = x * 16, py = y * 16;
                    const seed = (x * 73 + y * 137 + x * y * 11) >>> 0;
                    const path = has(x, y);
                    r(path ? 0xd2b77d : 0x83c46a, px, py, 16, 16);
                    // Chi tiết nhỏ có vị trí ổn định, không nhấp nháy khi trở lại map.
                    for (let n = 0; n < 5; n++) {
                        const dx = (seed + n * 7) % 14 + 1;
                        const dy = ((seed >>> 3) + n * 11) % 14 + 1;
                        r(path ? (n % 2 ? 0xdec690 : 0xc5a96f)
                            : (n % 2 ? 0x91cc76 : 0x78b85f), px + dx, py + dy, 2, 1);
                    }
                    if (path) {
                        // Viền đất lởm chởm, nối liền ở giao lộ.
                        if (!has(x, y - 1)) { r(0x9dbb68, px, py, 16, 2); r(0x83c46a, px + seed % 9, py, 3, 3); }
                        if (!has(x, y + 1)) { r(0x9dbb68, px, py + 14, 16, 2); r(0x83c46a, px + seed % 10, py + 13, 3, 3); }
                        if (!has(x - 1, y)) r(0x9dbb68, px, py, 2, 16);
                        if (!has(x + 1, y)) r(0x9dbb68, px + 14, py, 2, 16);
                    }
                }
            }
            g.generateTexture(key, map.cols * 16, map.rows * 16);
            g.destroy();
        }
        this.scene.add.image(0, 0, key).setOrigin(0).setScale(map.tileSize / 16).setDepth(0);
        for (const [x, y, variant] of map.trees ?? []) {
            this.objects.tree((x + 1.5) * map.tileSize, (y + 3) * map.tileSize, variant);
        }
        for (const item of map.objects ?? []) {
            const method = this.objects[item.type];
            if (!['grass', 'bush', 'rock', 'house'].includes(item.type)) {
                throw new Error(`Vật thể không hỗ trợ: ${item.type}`);
            }
            method.call(this.objects, item.col * map.tileSize, item.row * map.tileSize);
        }
    }
}
