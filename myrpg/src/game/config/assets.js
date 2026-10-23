// Các đường dẫn tính từ thư mục public, không thêm "public/".
export const ASSETS = [
    { key: 'town', url: 'assets/tiny-town/Tilemap/tilemap_packed.png' },
    { key: 'dungeon', url: 'assets/tiny-dungeon/Tilemap/tilemap_packed.png' }
];

export function loadWorldAssets(scene) {
    for (const asset of ASSETS) {
        if (!scene.textures.exists(asset.key)) {
            scene.load.spritesheet(asset.key, asset.url, {
                frameWidth: 16, frameHeight: 16
            });
        }
    }
}
