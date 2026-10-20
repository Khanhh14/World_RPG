import { TinyOutdoorWorldBuilder } from './TinyOutdoorWorldBuilder.js';

// Rừng Tiny Town, vách đá Tiny Battle và cột cổ Tiny Dungeon.
export class NoxiiEntranceWorld extends TinyOutdoorWorldBuilder {
    build() {
        super.build();
        const size = this.tileSize;
        const tile = (col, row, texture, frame, depth = 20) => this.add.image(col*size, row*size, texture, frame)
            .setOrigin(0).setScale(size/16).setDepth(depth);
        // Vách núi và cửa hang rộng bốn ô, nhìn xuống con đường chính.
        for (let row=0; row<6; row++) for (let col=12; col<37; col++) {
            const left=col===12, right=col===36, top=row===0, bottom=row===5;
            if (!left && !right && !top && !bottom) tile(col,row,'dungeon',14);
            else {
                const frame=top ? (left?127:right?129:128)
                    : bottom ? (left?163:right?165:164) : (left?144:147);
                tile(col,row,'battle',frame);
            }
        }
        this.add.rectangle(22*size,2*size,5*size,4*size,0x14232a).setOrigin(0).setDepth(21);
        for (const col of [21,27]) {
            tile(col,2,'dungeon',col===21?7:8,22);
            tile(col,3,'dungeon',col===21?19:20,22);
            tile(col,4,'dungeon',col===21?31:32,22);
        }
        for (let col=22; col<27; col++) tile(col,5,'dungeon',36+(col%3),22);
        this.blocker(24.5*size,3*size,25*size,6*size);
        this.add.text(24.5*size,1.5*size,'NoXII',{
            fontFamily:'Arial',fontSize:'26px',fontStyle:'bold',color:'#d3f7ee',
            stroke:'#14232a',strokeThickness:5
        }).setOrigin(.5).setDepth(30);
        // Đá vụn ở hai bên lối vào, có va chạm và chừa đường giữa.
        for (const [col,row] of [[18,7],[30,7],[17,10],[31,10],[3,21],[44,23]]) {
            tile(col,row,'dungeon',6,100+(row+1)*size);
            this.blocker((col+.5)*size,(row+.8)*size,32,20);
        }
        for (let col=21; col<=27; col++) for (let row=7; row<=9; row++) {
            tile(col,row,'dungeon',14,2);
        }
    }
}
