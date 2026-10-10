import { BaseWorldScene } from './BaseWorldScene.js';
import { village } from '../data/village.js';

// Giữ dữ liệu làng hiện có; cổng hồ ở phía đông trên đường chính.
export class Game extends BaseWorldScene {
    constructor() {
        const tileSize = village.tileSize;
        const lakeGateX = (village.cols - 2) * tileSize;
        super('Game', {
            ...village,
            portals: [{
                x: 120, feetY: 792,
                label: 'Khu Rừng Phía Tây', target: 'WestForest',
                spawn: { x: 2496, y: 1068 }
            }, {
                x: lakeGateX, feetY: 15.5 * tileSize,
                label: 'Hồ Nước Atlast', target: 'AtlastLake',
                spawn: { x: 288, y: 912 }
            }]
        });
    }
}
