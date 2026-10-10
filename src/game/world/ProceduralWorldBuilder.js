import { WorldObjects } from './WorldObjects.js';

// Nền ghép thành một texture, cây/đá là vật thể độc lập để xếp lớp theo chân.
export class ProceduralWorldBuilder {
    constructor(scene, data) {
        this.scene = scene; this.data = data; this.tileSize = data.tileSize;
        this.blockers = [];
        this.objects = new WorldObjects(scene, this.blockers, data.tileSize / 16);
        this.paths = new Set();
        this.water = new Set((data.water ?? []).map(([x, y]) => `${x},${y}`));
        this.docks = new Set();
        for (const [x, y, width, height] of data.docks ?? []) {
            for (let row = y; row < y + height; row++) {
                for (let col = x; col < x + width; col++) this.docks.add(`${col},${row}`);
            }
        }
        for (const [x, y, width, height] of data.paths ?? []) {
            for (let row = y; row < y + height; row++) {
                for (let col = x; col < x + width; col++) this.paths.add(`${col},${row}`);
            }
        }
    }
    blocker(...args) { return this.objects.blocker(...args); }
    build() {
        const map = this.data;
        const key = `rpg-code-ground-v4-${map.id}`;
        if (!this.scene.textures.exists(key)) {
            const g = this.scene.add.graphics();
            const r = (color, x, y, w, h) => { g.fillStyle(color); g.fillRect(x, y, w, h); };
            const has = (x, y) => this.paths.has(`${x},${y}`);
            for (let y = 0; y < map.rows; y++) {
                for (let x = 0; x < map.cols; x++) {
                    const px = x * 16, py = y * 16;
                    const seed = (x * 73 + y * 137 + x * y * 11) >>> 0;
                    const path = has(x, y);
                    const wet = this.water.has(`${x},${y}`);
                    const dock = this.docks.has(`${x},${y}`);
                    if (dock) {
                        // Những tấm ván ngang, đường nối, vân gỗ và đinh nhỏ.
                        r(0x715136, px, py, 16, 16);
                        for (let plank = 0; plank < 4; plank++) {
                            r(plank % 2 ? 0xc69558 : 0xd3a56a, px + 1, py + plank * 4, 15, 3);
                            r(0xe4bc82, px + 1, py + plank * 4, 15, 1);
                            r(0xaa7b46, px + 4 + seed % 4, py + plank * 4 + 2, 5, 1);
                            r(0x70583e, px + 2, py + plank * 4 + 1, 1, 1);
                            r(0x70583e, px + 14, py + plank * 4 + 1, 1, 1);
                        }
                        continue;
                    }
                    if (wet) {
                        r(0x4eafcd, px, py, 16, 16);
                        const edge = [[0,-1],[0,1],[-1,0],[1,0]].some(([dx,dy]) =>
                            !this.water.has(`${x+dx},${y+dy}`));
                        if (edge) r(0x72c7d4, px, py, 16, 16);
                        r(0x89d5e3, px + seed % 7, py + 3 + seed % 4, 6, 1);
                        r(0x63bfd6, px + 3 + seed % 5, py + 11, 5, 1);
                        if (!this.water.has(`${x},${y-1}`)) r(0xb3e4dc, px, py, 16, 2);
                        if (!this.water.has(`${x},${y+1}`)) r(0xb3e4dc, px, py + 14, 16, 2);
                        if (!this.water.has(`${x-1},${y}`)) r(0xb3e4dc, px, py, 2, 16);
                        if (!this.water.has(`${x+1},${y}`)) r(0xb3e4dc, px + 14, py, 2, 16);
                        continue;
                    }
                    const shore = [[0,-1],[0,1],[-1,0],[1,0]].some(([dx,dy]) =>
                        this.water.has(`${x+dx},${y+dy}`));
                    r(path || shore ? 0xd2b77d : 0x83c46a, px, py, 16, 16);
                    // Chi tiết nhỏ có vị trí ổn định, không nhấp nháy khi trở lại map.
                    for (let n = 0; n < 5; n++) {
                        const dx = (seed + n * 7) % 14 + 1;
                        const dy = ((seed >>> 3) + n * 11) % 14 + 1;
                        r(path || shore ? (n % 2 ? 0xdec690 : 0xc5a96f)
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
        this.buildWaterBlockers();
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
    buildWaterBlockers() {
        const size = this.tileSize;
        for (let row = 0; row < this.data.rows; row++) {
            let start = -1;
            for (let col = 0; col <= this.data.cols; col++) {
                const wet = col < this.data.cols && this.water.has(`${col},${row}`)
                    && !this.docks.has(`${col},${row}`);
                if (wet && start < 0) start = col;
                if (!wet && start >= 0) {
                    this.blocker((start + col) * size / 2, (row + 0.5) * size,
                        (col - start) * size, size);
                    start = -1;
                }
            }
        }
    }

}
