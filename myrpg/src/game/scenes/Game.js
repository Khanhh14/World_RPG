import { BaseWorldScene } from './BaseWorldScene.js';
import { village } from '../data/village.js';

// Giữ dữ liệu làng hiện có; cổng hồ ở phía đông trên đường chính.
export class Game extends BaseWorldScene {
    constructor() {
        const tileSize = village.tileSize;
        const lakeGateX = (village.cols - 2) * tileSize;
        super('Game', {
            ...village,
            portals: [{x:984,feetY:192,label:'Khu Rừng Mùa Thu',target:'AutumnForest',spawn:{x:1056,y:1488}}, {
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
