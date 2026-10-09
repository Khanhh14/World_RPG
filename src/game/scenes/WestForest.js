import { BaseWorldScene } from './BaseWorldScene.js';
import { westForest } from '../data/westForest.js';

export class WestForest extends BaseWorldScene {
    constructor() {
        super('WestForest', westForest);
    }
}
