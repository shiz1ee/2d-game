export const TILE = 32;
const TILESET_COLS = 19;

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
const tilesetImg = new Image();

export async function loadLevel(
    jsonUrl = "/levels/level1.json",
    imgUrl = "/sprites/Serene_Village_32x32.png"
) {
    mapData = await (await fetch(jsonUrl)).json();
    firstgid = mapData.tilesets[0].firstgid;

    await new Promise ((res, rej) => {
        tilesetImg.onload = res;
        tilesetImg.onerror = () => rej(new Error("Tileset image not found: " +imgUrl));
        tilesetImg.src = imgUrl;
    });

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
    REMOVED_WALLS.forEach(([c, r]) => walls.delete(`${c * TILE},${r * TILE}`));
       console.log("sample keys:", [...walls].slice(0, 3), "removed count:", REMOVED_WALLS.length);
}

export function drawLevel(ctx) {
    for (const layer of mapData.layers) {
        if (layer.type !== "tilelayer" || !layer.visible) continue;
        layer.data.forEach((gid, i) => {
            if (gid === 0) return;

            const dx = (i % layer.width) * TILE;
            const dy = Math.floor(i / layer.width) * TILE;

            if (layer.name === "fence-tree-camp" && dx === 16 * TILE && dy === 11 * TILE) return;

            const id = gid - firstgid;
            const sx = (id % TILESET_COLS) * TILE;
            const sy = Math.floor(id / TILESET_COLS) * TILE;
            ctx.drawImage(tilesetImg, sx, sy, TILE, TILE, dx, dy, TILE, TILE);
        });
    }
}

