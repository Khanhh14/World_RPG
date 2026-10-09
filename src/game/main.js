import { AUTO, Game, Scale } from 'phaser';
import { Game as VillageGame } from './scenes/Game.js';

const config = {
    type: AUTO,
    width: 1024,
    height: 768,
    parent: 'game-container',
    pixelArt: true,
    backgroundColor: '#83c46a',

    scale: {
        mode: Scale.FIT,
        autoCenter: Scale.CENTER_BOTH
    },

    physics: {
        default: 'arcade',
        arcade: {
            gravity: { x: 0, y: 0 },
            debug: false
        }
    },

    scene: [VillageGame]
};

const StartGame = (parent = 'game-container') => {
    return new Game({ ...config, parent });
};

export default StartGame;