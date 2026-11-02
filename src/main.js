import { resources } from './Resource';
import { Sprite } from './Sprite';
import './style.css'
import { Vector2 } from './Vector2';
import { GameLoop } from "./GameLoop.js";
import { Input, DOWN, UP, LEFT, RIGHT } from "./Input.js"
import { gridCells } from './helpers/grid.js';
import { drawLevel, loadLevel, walls, TILE } from './level.js';
import { Animations } from './Animations.js';
import { FrameIndexPattern } from './FrameIndexPattern.js';
import { WALK_DOWN, WALK_UP, WALK_LEFT, WALK_RIGHT, STAND_DOWN, STAND_UP, STAND_LEFT, STAND_RIGHT } from './objects/Hero/heroAnimations.js';
import { GameObject } from './GameObject.js';

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
  frameSize: new Vector2(320, 180),
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
  position: new Vector2(gridCells(6), gridCells(5)),
  animations: new Animations({
    walkDown: new FrameIndexPattern(WALK_DOWN),
    walkUp: new FrameIndexPattern(WALK_UP),
    walkLeft: new FrameIndexPattern(WALK_LEFT),
    walkRight: new FrameIndexPattern(WALK_RIGHT),
    standDown: new FrameIndexPattern(STAND_DOWN),
    standUp: new FrameIndexPattern(STAND_UP),
    standLeft: new FrameIndexPattern(STAND_LEFT),
    standRight: new FrameIndexPattern(STAND_RIGHT),
  })
  
})

const heroDestinationPosition = new Vector2(
  gridCells(10), gridCells(5)
)

let heroFacing = DOWN; 

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


const standAnim = {
  [DOWN]: "standDown", [UP]: "standUp", [LEFT]: "standLeft", [RIGHT]: "standRight",
};

const update = (delta) => {
  if (input.direction === DOWN) {
    move(0, SPEED);
    hero.animations.play("walkDown");
    facing = DOWN;
  }
  if (input.direction === UP) {
    move(0, -SPEED);
    hero.animations.play("walkUp");
    facing = UP;
  }
  if (input.direction === LEFT) {
    move(-SPEED, 0);
    hero.animations.play("walkLeft");
    facing = LEFT;
  }
  if (input.direction === RIGHT) {
    move(SPEED, 0);
    hero.animations.play("walkRight");
    facing = RIGHT;
  }
  if (!input.direction) {
    hero.animations.play(standAnim[facing]);
  }

  hero.step(delta);
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

}


const gameLoop = new GameLoop(update, draw); 
loadLevel().then(() => gameLoop.start());