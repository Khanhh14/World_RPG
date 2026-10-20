import { WorldBuilder } from './WorldBuilder.js';
export class NoxiiCaveWorld extends WorldBuilder {
    build(){
        const size=this.tileSize;
        // Nền đá và cột cổ hoàn toàn từ Tiny Dungeon.
        for(let row=0;row<this.data.rows;row++) for(let col=0;col<this.data.cols;col++) {
            this.tile(col,row,14);
            if(row===0||row===31||col===0||col===35) this.tile(col,row,28,10);
        }
        this.blocker(864,24,1728,48);this.blocker(864,1512,1728,48);
        this.blocker(24,768,48,1536);this.blocker(1704,768,48,1536);
        for(let row=24;row<30;row++) for(let col=16;col<20;col++) this.tile(col,row,49,1);
        for(const col of [4,30]) for(const row of [5,12,19]) {
            for(let dy=0;dy<3;dy++) this.tile(col,row+dy,[8,20,32][dy],100+(row+3)*size);
            this.blocker((col+.5)*size,(row+2.8)*size,36,24);
        }
        const g=this.add.graphics().setDepth(2);
        g.lineStyle(5,0x8671ab,.65).strokeCircle(864,650,290);
        g.lineStyle(2,0xc4a2dc,.4).strokeCircle(864,650,263);
        for(let i=0;i<12;i++){
            const angle=i*Math.PI/6,x=864+Math.cos(angle)*276,y=650+Math.sin(angle)*276;
            g.lineStyle(3,0xbda0d4,.7).lineBetween(x-7,y,x+7,y);
            g.lineBetween(x,y-7,x,y+7);
        }
    }
}
