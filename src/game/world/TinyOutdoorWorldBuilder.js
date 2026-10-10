import { WorldBuilder } from './WorldBuilder.js';
import { createLakeTileTextures, LAKE_PREFIX } from './LakeTileTextures.js';

// Cây/cỏ/đất lấy từ Tiny Town, gỗ sàn lấy từ Tiny Dungeon.
// Không tạo texture nền lớn và không dùng WorldObjects/ProceduralWorldBuilder.
export class TinyOutdoorWorldBuilder extends WorldBuilder {
    constructor(scene, data) {
        super(scene, data);
        this.water = new Set((data.water ?? []).map(([x, y]) => `${x},${y}`));
        this.docks = new Set();
        for (const [x, y, width, height] of data.docks ?? []) {
            for (let row = y; row < y + height; row++) {
                for (let col = x; col < x + width; col++) this.docks.add(`${col},${row}`);
            }
        }
    }

    build() {
        const map = this.data, size = this.tileSize;
        const has = (x,y) => this.water.has(`${x},${y}`);
        this.shore = new Set();
        if (this.water.size) {
            createLakeTileTextures(this.scene);
            // Vành cát rộng hai ô; dùng chung thuật toán nối mép đường của Tiny Town.
            for (const [x,y] of map.water) {
                for (let dy=-2;dy<=2;dy++) for(let dx=-2;dx<=2;dx++) {
                    const col=x+dx,row=y+dy;
                    if(col>=0&&row>=0&&col<map.cols&&row<map.rows) {
                        this.paths.add(`${col},${row}`);
                        if(!has(col,row)) this.shore.add(`${col},${row}`);
                    }
                }
            }
        }
        for(let y=0;y<map.rows;y++) for(let x=0;x<map.cols;x++) {
            this.tile(x,y,(x*17+y*31)%43<7?1:0);
        }
        for(const rect of map.paths ?? []) this.pathRect(...rect);
        this.drawPaths();
        // Góc lõm của mép cát được ghép bằng đúng các ô 39–42 Tiny Town.
        for(const cell of this.paths) {
            const [x,y]=cell.split(',').map(Number);
            const p=(dx,dy)=>this.paths.has(`${x+dx},${y+dy}`);
            if(p(0,-1)&&p(0,1)&&p(-1,0)&&p(1,0)) {
                let frame;
                if(!p(-1,-1)) frame=39;
                else if(!p(1,-1)) frame=40;
                else if(!p(-1,1)) frame=41;
                else if(!p(1,1)) frame=42;
                if(frame!==undefined)this.tile(x,y,frame,2);
            }
        }
        for(const [x,y] of map.water ?? []) {
            const top=!has(x,y-1),bottom=!has(x,y+1),left=!has(x-1,y),right=!has(x+1,y);
            let frame=37;
            if(top&&left)frame=18;else if(top&&right)frame=20;
            else if(bottom&&left)frame=54;else if(bottom&&right)frame=56;
            else if(top)frame=19;else if(bottom)frame=55;
            else if(left)frame=36;else if(right)frame=38;
            else if(!has(x-1,y-1))frame=90;else if(!has(x+1,y-1))frame=91;
            else if(!has(x-1,y+1))frame=93;else if(!has(x+1,y+1))frame=92;
            this.add.image(x*size,y*size,frame===37?'battle':LAKE_PREFIX+'water-'+frame,
                frame===37?37:undefined).setOrigin(0).setScale(size/16).setDepth(3);
        }
        for(const cell of this.docks) {
            const [x,y]=cell.split(',').map(Number);
            this.add.rectangle(x*size+6,y*size+6,size,size,0x243f40,0.2)
                .setOrigin(0).setDepth(4);
            this.add.image(x*size,y*size,LAKE_PREFIX+'deck-'+((x+y)%2))
                .setOrigin(0).setScale(size/16).setDepth(5);
            const edge=(dx,dy)=>!this.docks.has(`${x+dx},${y+dy}`);
            const rail=(px,py,w,h)=>this.add.rectangle(px,py,w,h,0x755034,1)
                .setOrigin(0).setDepth(6);
            if(edge(0,-1))rail(x*size,y*size,size,3);
            if(edge(0,1))rail(x*size,(y+1)*size-3,size,3);
            if(edge(1,0))rail((x+1)*size-3,y*size,3,size);
            if(edge(-1,0)&&has(x,y))rail(x*size,y*size,3,size);
        }
        // Cọc bến ở bốn góc sàn; giữ lối vào rộng và thông thoáng.
        for(const [x,y] of map.dockPosts ?? []) {
            const feet=y*size;
            this.add.image(x*size,feet,LAKE_PREFIX+'post').setOrigin(0.5,1)
                .setScale(size/16).setDepth(100+feet);
            this.blocker(x*size,feet-6,12,12);
        }
        this.buildWaterBlockers();
        for(const item of map.trees ?? [])this.tree(...item);
        for(const [x,y,frame] of map.decorations ?? []) {
            if(!has(x,y)&&!this.docks.has(`${x},${y}`)&&!this.shore.has(`${x},${y}`))
                this.tile(x,y,frame,100+(y+1)*size);
        }
    }

    buildWaterBlockers() {
        const size = this.tileSize;
        for (let row = 0; row < this.data.rows; row++) {
            let start = -1;
            for (let col = 0; col <= this.data.cols; col++) {
                const wet = col < this.data.cols && this.water.has(`${col},${row}`)
                    && !this.docks.has(`${col},${row}`);
                if (wet && start < 0) start = col;
                if (!wet && start >= 0) {
                    this.blocker((start + col) * size / 2, (row + 0.5) * size,
                        (col - start) * size, size);
                    start = -1;
                }
            }
        }
    }
}
