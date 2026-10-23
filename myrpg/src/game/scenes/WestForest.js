import { BaseWorldScene } from './BaseWorldScene.js';
import { westForest } from '../data/westForest.js';
import { TinyOutdoorWorldBuilder } from '../world/TinyOutdoorWorldBuilder.js';

export class WestForest extends BaseWorldScene {
    constructor() { super('WestForest', westForest); }
    createWorld(map) { return new TinyOutdoorWorldBuilder(this, map); }
}
