// Đồ họa pixel do code tạo. Texture dùng chung giữa các map, chỉ tạo một lần.
const PREFIX = 'rpg-code-v3-';

export function createWorldObjectTextures(scene) {
    function texture(name, width, height, draw) {
        const key = PREFIX + name;
        if (scene.textures.exists(key)) return;
        const g = scene.add.graphics();
        const rect = (color, x, y, w, h) => {
            g.fillStyle(color, 1); g.fillRect(x, y, w, h);
        };
        draw(rect);
        g.generateTexture(key, width, height);
        g.destroy();
    }
    for (let variant = 0; variant < 3; variant++) {
        texture('tree-' + variant, 32, 40, r => {
            // Thân và rễ nằm đúng đáy; tán có đường viền tối và nhiều lớp lá.
            r(0x273d2a, 13, 24, 7, 16);
            r(0x694c32, 14, 25, 5, 14);
            r(0x997047, 14, 27, 2, 10);
            r(0x273d2a, 10, 38, 13, 2);
            r(0x694c32, 11, 38, 10, 1);
            const dark = [0x397b42, 0x3e8046, 0x458446][variant];
            const mid = [0x5da64e, 0x64af55, 0x6aac4d][variant];
            const light = [0x96d369, 0xa2da73, 0xa0d768][variant];
            r(dark, 11, 0, 10, 3); r(dark, 6, 3, 20, 4);
            r(dark, 3, 7, 26, 5); r(dark, 0, 12, 32, 11);
            r(dark, 3, 23, 26, 5); r(dark, 7, 28, 19, 3);
            r(mid, 10, 3, 12, 4); r(mid, 5, 7, 22, 7);
            r(mid, 2, 14, 28, 7); r(mid, 5, 21, 22, 5);
            r(light, 11, 4, 8, 3); r(light, 6, 8, 11, 4);
            r(light, 3, 14, 7, 5); r(light, 17, 10, 5, 3);
            r(0x7abd59, 12, 16, 9, 4); r(0x7abd59, 20, 21, 5, 3);
            r(dark, 8, 22, 5, 2); r(dark, 23, 16, 5, 2);
            r(light, 7, 8, 3, 1); r(light, 4, 15, 2, 1);
        });
    }
    texture('grass', 12, 10, r => {
        r(0x518e43, 2, 8, 9, 2);
        r(0x71b453, 3, 4, 2, 5); r(0x71b453, 8, 2, 2, 7);
        r(0xa0d468, 5, 1, 2, 8); r(0xa0d468, 1, 5, 2, 3);
        r(0xb8e381, 5, 1, 1, 4); r(0xb8e381, 8, 2, 1, 3);
    });
    texture('bush', 20, 14, r => {
        r(0x3c793f, 4, 1, 10, 3); r(0x3c793f, 1, 4, 17, 7);
        r(0x3c793f, 3, 11, 14, 3); r(0x69ad51, 3, 4, 13, 7);
        r(0xa0d66b, 5, 2, 7, 4); r(0xa0d66b, 2, 6, 6, 3);
        r(0x82bf5e, 11, 6, 5, 4);
    });
    texture('rock', 18, 12, r => {
        r(0x354941, 5, 1, 8, 2); r(0x354941, 2, 3, 14, 6);
        r(0x354941, 0, 9, 18, 3); r(0x98a58a, 4, 3, 9, 5);
        r(0x7e9278, 2, 7, 14, 3); r(0xc1c9ac, 5, 3, 6, 2);
        r(0x639c4e, 1, 9, 5, 2); r(0x76a556, 12, 8, 3, 2);
    });
    // Có thể dùng cho map làng sau này; khu rừng hiện không đặt nhà.
    texture('house', 48, 48, r => {
        r(0x353c32, 5, 18, 38, 30); r(0xc1ac80, 7, 22, 34, 24);
        r(0x927454, 7, 28, 34, 2); r(0x927454, 7, 38, 34, 2);
        for (let y = 0; y < 20; y += 2) {
            const inset = Math.max(0, 18 - y);
            r(0x343d32, inset, y, 48 - inset * 2, 3);
            r(y % 4 === 0 ? 0x6d6651 : 0x81765b, inset + 1, y + 1, 46 - inset * 2, 1);
        }
        r(0x343d32, 18, 31, 12, 17); r(0x624733, 20, 33, 8, 15);
        r(0xc5aa66, 26, 40, 1, 1);
        for (const x of [10, 33]) {
            r(0x4f4b37, x, 27, 6, 8); r(0x96bcc0, x + 1, 28, 4, 6);
            r(0x4f4b37, x + 3, 28, 1, 6);
        }
    });
}

// Tọa độ theo pixel: x là tâm ngang, feetY là vị trí chân vật thể.
export class WorldObjects {
    constructor(scene, blockers = [], scale = 3) {
        this.scene = scene; this.blockers = blockers; this.scale = scale;
        createWorldObjectTextures(scene);
    }

    blocker(x, y, width, height) {
        const object = this.scene.add.rectangle(x, y, width, height, 0xffffff, 0);
        this.scene.physics.add.existing(object, true);
        this.blockers.push(object);
        return object;
    }

    place(name, x, feetY, { solid = false, width = 0, height = 0, shadow = 0 } = {}) {
        if (shadow) this.scene.add.ellipse(x, feetY - 4, shadow * this.scale,
            5 * this.scale, 0x345b2d, 0.15).setDepth(99 + feetY);
        const image = this.scene.add.image(x, feetY, PREFIX + name)
            .setOrigin(0.5, 1).setScale(this.scale).setDepth(100 + feetY);
        if (solid) this.blocker(x, feetY - height * this.scale / 2,
            width * this.scale, height * this.scale);
        return image;
    }

    tree(x, feetY, variant = 0) {
        return this.place('tree-' + variant, x, feetY,
            { solid: true, width: 8, height: 6, shadow: 26 });
    }
    grass(x, feetY) { return this.place('grass', x, feetY); }
    bush(x, feetY) { return this.place('bush', x, feetY, { shadow: 16 }); }
    rock(x, feetY) {
        return this.place('rock', x, feetY, { solid: true, width: 14, height: 6, shadow: 16 });
    }
    house(x, feetY) {
        return this.place('house', x, feetY, { solid: true, width: 34, height: 20, shadow: 44 });
    }
}
