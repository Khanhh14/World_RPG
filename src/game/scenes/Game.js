import { BaseWorldScene } from './BaseWorldScene.js';
import { village } from '../data/village.js';

// Dùng nguyên dữ liệu làng bạn đang có, chỉ bổ sung cổng phía tây.
export class Game extends BaseWorldScene {
    constructor() {
        super('Game', {
            ...village,
            portals: [{
                x: 120,
                feetY: 792,
                label: 'Khu Rừng Phía Tây',
                target: 'WestForest',
                spawn: { x: 2496, y: 1068 }
            }]
        });
    }
}
