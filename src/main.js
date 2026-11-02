import { resources } from './Resource';
import { Sprite } from './Sprite';
import './style.css'
import { Vector2 } from './Vector2';
import { GameLoop } from "./GameLoop.js";
import { Input, DOWN, UP, LEFT, RIGHT } from "./Input.js"
import { gridCells } from './helpers/grid.js';
import { moveTowards } from './helpers/moveTowards.js';
import { drawLevel, loadLevel, walls, TILE } from './level.js';


const canvas = document.querySelector("#game-canvas");
const ctx = canvas.getContext("2d");
// for removing the extra collision boxes
canvas.addEventListener("click", (e) => {
  const r = canvas.getBoundingClientRect();
  const col = Math.floor(((e.clientX - r.left) * (canvas.width / r.width)) / TILE);
  const row = Math.floor(((e.clientY - r.top) * (canvas.height / r.height)) / TILE);
  console.log(`[${col}, ${row}],`);
});

ctx.imageSmoothingEnabled = false;
const idleFrames = { DOWN: 1, UP: 7, LEFT: 10, RIGHT: 4};
let facing = DOWN;


const groundSprite = new Sprite({
    resource: resources.images.ground,
    frameSize: new Vector2(320, 180)
  })

const skySprite = new Sprite({
  resource: resources.images.sky,
  frameSize: new Vector2(320, 180)
});

const hero = new Sprite({
  resource: resources.images.hero,
  frameSize: new Vector2(32,32),
  hFrames: 3,
  vFrames: 8,
  frame: 1,
  
})

const heroDestinationPosition = new Vector2(
  gridCells(10), gridCells(5)
)

const shadow = new Sprite({
  resource: resources.images.shadow,
  frameSize: new Vector2(32,32)
})

const heroPos = new Vector2(TILE * 10, TILE * 6);
const input = new Input();

const SPEED = 1;
// feet box relative to heroPos, in on-screen pixls
const HITBOX = { x: 20, y: 44, w: 24, h: 12};

const isBlocked = (px, py) => {
  const left = px + HITBOX.x;
  const top = py + HITBOX.y;
  const right = left + HITBOX.w -1;
  const bottom = top + HITBOX.h -1;

  if (left < 0 || top < 0 || right >= canvas.width || bottom >= canvas.height) return true;

  for (let ty = Math.floor(top / TILE); ty <= Math.floor(bottom / TILE); ty++) {
    for (let tx = Math.floor(left / TILE); tx <= Math.floor(right / TILE); tx++) {
      if (walls.has(`${tx * TILE},${ty * TILE}`)) return true;
    }
  }
  return false;
};

const move = (dx, dy) => {
  if (!isBlocked(heroPos.x + dx, heroPos.y)) heroPos.x += dx;
  if (!isBlocked(heroPos.x, heroPos.y + dy)) heroPos.y += dy;
}


const update = () => {

  if (input.direction === DOWN) {
    move(0, SPEED);
    hero.frame = 0; 
    facing = DOWN;
    
  }
  if (input.direction === UP) {
    move(0, -SPEED);
    hero.frame = 6;
    facing = UP;
  }
  if (input.direction === LEFT) {
    move(-SPEED, 0);
    hero.frame = 9;
    facing = LEFT;
  }
  if (input.direction === RIGHT) {
    move(SPEED, 0);
    hero.frame = 3;
    facing = RIGHT;
  }

  if (!input.direction) {
    hero.frame = idleFrames[facing];
  }
};


const draw = () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  const skyScale = canvas.height / 180;
  ctx.save();
  ctx.scale(skyScale, skyScale);
  skySprite.drawImage(ctx, 0, 0);
  ctx.restore();

  drawLevel(ctx)


  
  const heroOffset = new Vector2(-8, -21);
  const heroPosX = hero.position.x+heroOffset.x;
  const heroPosY = hero.position.y+heroOffset.y;

  ctx.save();
  ctx.translate(heroPos.x, heroPos.y);
  ctx.scale(2, 2);
  shadow.drawImage(ctx, 0, 0);
  hero.drawImage(ctx, 0, 0);
  ctx.restore();

  ctx.strokeStyle = "lime";
  ctx.strokeRect(heroPos.x + HITBOX.x, heroPos.y + HITBOX.y, HITBOX.w, HITBOX.h);

  ctx.strokeStyle = "red";
for (const key of walls) {
  const [x, y] = key.split(",").map(Number);
  ctx.strokeRect(x, y, TILE, TILE);
}
}

const gameLoop = new GameLoop(update, draw); 
loadLevel().then(() => gameLoop.start());