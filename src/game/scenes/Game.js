import { BaseWorldScene } from './BaseWorldScene.js';
import { village } from '../data/village.js';

// Giữ tên export và Scene key để main.js / MainMenu.js hiện tại vẫn hoạt động.
export class Game extends BaseWorldScene {
    constructor() {
        super('Game', village);
    }
}
