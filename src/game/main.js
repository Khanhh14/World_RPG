import { getCharacterProfile } from './systems/characterSession.js';
import { RUNTIME_SCENES } from './systems/RuntimeSave.js';
import { withAuth } from '../auth/bootstrap.js';
import { AUTO, Game as PhaserGame, Scale } from 'phaser';

import { Game as VillageGame } from './scenes/Game.js';
import { YunaCity } from './scenes/YunaCity.js';
import { NagaCave } from './scenes/NagaCave.js';
import { WestForest } from './scenes/WestForest.js';
import { YunaOutskirts } from './scenes/YunaOutskirts.js';
import { AtlastLake } from './scenes/AtlastLake.js';

// Hàm này chỉ được withAuth gọi sau khi xác thực thành công.
function StartGame(user, parent = 'game-container') {
    const runtime=getCharacterProfile()?.runtime;
    const all=[VillageGame,WestForest,AtlastLake,YunaOutskirts,YunaCity,NagaCave];
    const byKey={Game:VillageGame,WestForest,AtlastLake,YunaOutskirts,YunaCity,NagaCave};
    const first=byKey[runtime?.hp>0?RUNTIME_SCENES[runtime.mapId]:'Game']||VillageGame;
    const config = {
        type: AUTO,
        parent,
        callbacks: {
            preBoot: game => {game.registry.set('auth-user', user);game.registry.set('resume-runtime',runtime);},
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

        scene: [first,...all.filter(s=>s!==first)],
    };

    return new PhaserGame(config);
}

// Kiểm tra phiên hoặc hiển thị đăng nhập trước khi tạo game.
export default withAuth(StartGame);