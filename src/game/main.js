import { AUTO, Game, Scale } from 'phaser';
import { Game as VillageGame } from './scenes/Game.js';
import { WestForest } from './scenes/WestForest.js';

const StartGame = (parent = 'game-container') => new Game({
    type: AUTO,
    parent,
    width: window.innerWidth,
    height: window.innerHeight,
    pixelArt: true,
    backgroundColor: '#83c46a',
    scale: { mode: Scale.RESIZE, autoCenter: Scale.NO_CENTER },
    physics: {
        default: 'arcade',
        arcade: { gravity: { x: 0, y: 0 }, debug: false }
    },
    scene: [VillageGame, WestForest]
});

export default StartGame;
