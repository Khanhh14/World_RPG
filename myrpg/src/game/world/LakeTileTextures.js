export const LAKE_PREFIX = 'atlast-polish-v1-';

// Chỉ xử lý vài ô 16x16 một lần, không tạo texture cho toàn bản đồ.
export function createLakeTileTextures(scene) {
    const manager = scene.textures;
    const create = (name, width, height, paint) => {
        const key = LAKE_PREFIX + name;
        if (manager.exists(key)) return;
        const texture = manager.createCanvas(key, width, height);
        const context = texture.getContext();
        context.imageSmoothingEnabled = false;
        paint(context);
        texture.refresh();
    };
    const drawFrame = (context, key, index) => {
        const frame = manager.getFrame(key, index);
        context.drawImage(frame.source.image, frame.cutX, frame.cutY, 16, 16, 0, 0, 16, 16);
    };

    // Nước/mép sóng thật từ Tiny Battle. Thay phần cỏ xanh ở mép ô
    // bằng cát Tiny Town để nối với bãi cát bao quanh hồ.
    for (const frame of [18,19,20,36,38,54,55,56,90,91,92,93]) {
        create('water-' + frame, 16, 16, ctx => {
            drawFrame(ctx, 'town', 25);
            const sand = ctx.getImageData(0, 0, 16, 16);
            ctx.clearRect(0, 0, 16, 16);
            drawFrame(ctx, 'battle', frame);
            const pixels = ctx.getImageData(0, 0, 16, 16);
            for (let i = 0; i < pixels.data.length; i += 4) {
                const [r, g, b, a] = pixels.data.slice(i, i + 4);
                if (a === 0 || (g > r * 1.1 && g > b * 1.05)) {
                    pixels.data.set(sand.data.slice(i, i + 4), i);
                }
            }
            ctx.putImageData(pixels, 0, 0);
        });
    }
    for (let variant = 0; variant < 2; variant++) {
        create('deck-' + variant, 16, 16, ctx => {
            const rect = (color, x, y, w, h) => { ctx.fillStyle = color; ctx.fillRect(x,y,w,h); };
            rect('#644632',0,0,16,16);
            const colors = ['#bd8951','#c7965d','#b98249','#c28e55'];
            for (let plank = 0; plank < 4; plank++) {
                const y = plank * 4, seam = (plank + variant) % 2 === 0 ? 3 : 11;
                rect(colors[(plank + variant) % 4],0,y,16,3);
                rect('#ddb17b',0,y,16,1);
                rect('#a16d40',(plank * 3 + variant * 5) % 10,y+2,5,1);
                rect('#775032',seam,y,1,3);
                rect('#664735',seam+2,y+1,1,1);
            }
        });
    }
    create('post',8,12,ctx => {
        const r = (c,x,y,w,h) => { ctx.fillStyle=c;ctx.fillRect(x,y,w,h); };
        r('#573f2e',1,1,6,11);r('#a77445',2,2,4,9);r('#d3a36a',2,2,1,8);
        r('#664831',0,0,8,4);r('#d6ab75',1,0,6,3);r('#9e724a',3,1,2,1);
        r('#e0cca0',1,6,6,1);r('#bca579',1,8,6,1);
    });
}
