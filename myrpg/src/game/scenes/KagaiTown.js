import { kagaiTown } from '../data/kagaiTown.js';
import { BaseWorldScene } from './BaseWorldScene.js';

export class KagaiTown extends BaseWorldScene {
    constructor() {
        super('KagaiTown', kagaiTown);
    }
}
