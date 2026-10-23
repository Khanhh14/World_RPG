function makeTexture(scene, key, width, height, draw) {
        if (scene.textures.exists(key)) return;
        const graphics = scene.add.graphics();
        draw(graphics);
        graphics.generateTexture(key, width, height);
        graphics.destroy();
    }

export function createPropTextures(scene) {
        makeTexture(scene, 'well', 32, 40, (g) => {
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
        makeTexture(scene, 'bench', 32, 20, (g) => {
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
