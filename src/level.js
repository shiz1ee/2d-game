export const TILE = 32;

const REMOVED_WALLS = [
    [22, 8],
    [22, 9],
    [22, 10],
    [22, 11],
    [22, 12],
    [22, 13],
    [20, 6],
    [21, 6],
    [19, 6],
]

export const walls = new Set();
let mapData;
let firstgid = 1;
let srcTILE = 32;
let cols = 19;
let tilesetImg = new Image();

export async function loadLevel(
    jsonUrl = "/levels/level1.json",
    imgUrl = "/sprites/Serene_Village_32x32.png",
    removed = REMOVED_WALLS,
) {
    mapData = await (await fetch(jsonUrl)).json();
    firstgid = mapData.tilesets[0].firstgid;
    srcTILE = mapData.tilewidth;

    tilesetImg = new Image();
    await new Promise ((res, rej) => {
        tilesetImg.onload = res;
        tilesetImg.onerror = () => rej(new Error("Tileset image not found: " +imgUrl));
        tilesetImg.src = imgUrl;
    });
    cols = Math.floor(tilesetImg.width / srcTILE);
    console.log("tileset cols: ", cols);

    walls.clear();
    for (const layer of mapData.layers) {
        if (layer.type !== "tilelayer") continue;
        const solid = layer.properties?.some((p) => p.name === "collision" && p.value === true);
        if (!solid) continue;
        layer.data.forEach((git, i) => {
            if (git === 0) return;
            const col = i % layer.width;
            const row = Math.floor(i / layer.width);
            walls.add(`${col * TILE},${row * TILE}`);
        });
    }
    removed.forEach(([c, r]) => walls.delete(`${c * TILE},${r * TILE}`));

}

export function drawLevel(ctx) {
    for (const layer of mapData.layers) {
        if (layer.type !== "tilelayer" || !layer.visible) continue;
        layer.data.forEach((raw, i) => {
            if (raw === 0) return;

            const flipH = raw >= 0x80000000;
            const gid = raw & 0x1FFFFFFF;
            const id = gid - firstgid;

            const dx = (i % layer.width) * TILE;
            const dy = Math.floor(i / layer.width) * TILE;

            if (layer.name === "fence-tree-camp" && dx === 16 * TILE && dy === 11 * TILE) return;

            const sx = (id % cols) * srcTILE;
            const sy = Math.floor(id / cols) * srcTILE;

            if (flipH) {
                ctx.save();
                ctx.translate(dx + TILE, dy);
                ctx.scale(-1, 1);
                ctx.drawImage(tilesetImg, sx, sy, srcTILE, srcTILE, 0, 0, TILE, TILE);
                SVGTextContentElement.restore();
            } else {
                ctx.drawImage(tilesetImg, sx, sy, srcTILE, srcTILE, dx, dy, TILE, TILE);
            }

        });
    }
}

