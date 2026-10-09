// Quái mới vẽ bằng code pixel, không dùng ảnh trong Tiny Dungeon.
export function createCustomMonsterTextures(scene) {
    if (scene.textures.exists('moss-guardian')) return;

    const g = scene.add.graphics();
    const rect = (color, x, y, width, height) => {
        g.fillStyle(color, 1);
        g.fillRect(x, y, width, height);
    };

    const outline = 0x24362d;
    const bark = 0x604b36;
    const barkLight = 0x97724d;
    const moss = 0x4c8648;
    const mossLight = 0x88b85b;
    const stone = 0x6e8171;

    // Hai cành sừng trên đầu.
    rect(outline, 3, 1, 4, 8);
    rect(outline, 17, 1, 4, 8);
    rect(bark, 4, 2, 2, 6);
    rect(bark, 18, 2, 2, 6);
    rect(outline, 1, 1, 4, 3);
    rect(outline, 19, 0, 4, 3);
    rect(mossLight, 1, 1, 3, 2);
    rect(mossLight, 20, 0, 3, 2);

    // Thân đá/gỗ có đường viền tối.
    rect(outline, 6, 5, 12, 13);
    rect(outline, 4, 12, 16, 12);
    rect(stone, 7, 6, 10, 8);
    rect(bark, 6, 14, 12, 9);
    rect(barkLight, 8, 16, 2, 6);
    rect(barkLight, 14, 17, 2, 5);

    // Tay to và vai phủ rêu.
    rect(outline, 0, 12, 6, 11);
    rect(outline, 18, 12, 6, 11);
    rect(bark, 1, 15, 4, 7);
    rect(bark, 19, 15, 4, 7);
    rect(moss, 1, 12, 5, 4);
    rect(moss, 18, 12, 5, 4);
    rect(mossLight, 1, 12, 3, 2);
    rect(mossLight, 19, 12, 3, 2);

    // Rêu trên đầu và thân.
    rect(moss, 7, 5, 10, 3);
    rect(mossLight, 8, 5, 4, 2);
    rect(moss, 6, 15, 3, 4);
    rect(moss, 15, 19, 3, 3);
    rect(mossLight, 6, 15, 2, 2);

    // Mắt vàng và miệng.
    rect(outline, 7, 9, 4, 3);
    rect(outline, 13, 9, 4, 3);
    rect(0xffd166, 8, 9, 2, 2);
    rect(0xffd166, 14, 9, 2, 2);
    rect(0x25342b, 10, 13, 4, 1);

    // Lõi xanh ngọc.
    rect(outline, 10, 16, 4, 5);
    rect(0x6ad4ac, 11, 17, 2, 3);
    rect(0xc7f4c0, 11, 17, 1, 1);

    // Chân, kết thúc đúng đáy texture.
    rect(outline, 5, 23, 6, 5);
    rect(outline, 13, 23, 6, 5);
    rect(stone, 6, 24, 4, 3);
    rect(stone, 14, 24, 4, 3);
    rect(moss, 6, 24, 3, 1);
    rect(moss, 14, 24, 3, 1);

    g.generateTexture('moss-guardian', 24, 28);
    g.destroy();
}
