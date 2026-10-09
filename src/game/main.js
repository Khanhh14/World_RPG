import { Boot } from './scenes/Boot';
import { Game as MainGame } from './scenes/Game';
import { GameOver } from './scenes/GameOver';
import { MainMenu } from './scenes/MainMenu';
import { Preloader } from './scenes/Preloader';
import { AUTO, Game, Scale } from 'phaser';

const config = {
    type: AUTO,
    width: 1024,
    height: 768,
    parent: 'game-container',
    backgroundColor: '#028af8',
    type: AUTO,
    pixelArt: true,


    // Tự co giãn và căn giữa game trong trang web.
    scale: {
        mode: Scale.FIT,
        autoCenter: Scale.CENTER_BOTH
    },

    // Xử lý chuyển động và va chạm cho RPG góc nhìn từ trên xuống.
    physics: {
        default: 'arcade',
        arcade: {
            gravity: {
                x: 0,
                y: 0
            },
            debug: false
        }
    },

    // Các màn hình của game.
    scene: [
        Boot,
        Preloader,
        MainMenu,
        MainGame,
        GameOver
    ]
};

const StartGame = (parent) => {
    return new Game({ ...config, parent });
};

export default StartGame;