import { withAuth } from '../auth/bootstrap.js';
import { AUTO, Game as PhaserGame, Scale } from 'phaser';

import { Game as VillageGame } from './scenes/Game.js';
import { WestForest } from './scenes/WestForest.js';
import { YunaOutskirts } from './scenes/YunaOutskirts.js';
import { AtlastLake } from './scenes/AtlastLake.js';

// Hàm này chỉ được withAuth gọi sau khi xác thực thành công.
function StartGame(user, parent = 'game-container') {
    const config = {
        type: AUTO,
        parent,
        callbacks: {
            preBoot: game => game.registry.set('auth-user', user),
        },

        width: window.innerWidth,
        height: window.innerHeight,

        pixelArt: true,
        backgroundColor: '#83c46a',

        scale: {
            mode: Scale.RESIZE,
            autoCenter: Scale.NO_CENTER,
        },

        physics: {
            default: 'arcade',
            arcade: {
                gravity: {
                    x: 0,
                    y: 0,
                },
                debug: false,
            },
        },

        scene: [
            VillageGame,
            WestForest,
            AtlastLake,
            YunaOutskirts,
        ],
    };

    return new PhaserGame(config);
}

// Kiểm tra phiên hoặc hiển thị đăng nhập trước khi tạo game.
export default withAuth(StartGame);