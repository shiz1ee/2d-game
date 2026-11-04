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
import { WALK_DOWN, WALK_UP, WALK_LEFT, WALK_RIGHT, STAND_DOWN, STAND_UP, STAND_LEFT, STAND_RIGHT, PICK_UP_DOWN } from './objects/Hero/heroAnimations.js';
import { Camera } from './Camera.js';
import { GameObject } from './GameObject.js';
import { Rod } from './objects/Rod/Rod.js';
import { events } from './Events.js';
import { Inventory } from './objects/Inventory/Inventory.js';


const canvas = document.querySelector("#game-canvas");
const ctx = canvas.getContext("2d");
// for removing the extra collision boxes
canvas.addEventListener("click", (e) => {
  const r = canvas.getBoundingClientRect();
  const col = Math.floor((((e.clientX - r.left) * (canvas.width / r.width)) - camera.position.x) / TILE);
  const row = Math.floor((((e.clientY - r.top) * (canvas.height / r.height)) - camera.position.y) / TILE);
  console.log(`[${col}, ${row}],`);
});

ctx.imageSmoothingEnabled = false;
const idleFrames = { DOWN: 1, UP: 7, LEFT: 10, RIGHT: 4};
let facing = DOWN;

let pickupTime = 0;
const inventory = [];
events.on("HERO_PICKS_UP_ITEM", null, (data) => {
  pickupTime = 500; // ms
  inventory.push(data.image);
});


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
    pickUpDown: new FrameIndexPattern(PICK_UP_DOWN),
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

const campfire = new Sprite({
  resource: resources.images.campfire,
  frameSize: new Vector2(32, 32),
  hFrames: 4,
  vFrames: 1,
  frame: 0,
});

const heroPos = new Vector2(TILE * 10, TILE * 6);
const input = new Input();

const rod = new Rod(TILE * 20.25, TILE * 6); 


const SPEED = 1;
// feet box relative to heroPos, in on-screen pixls
const HITBOX = { x: 20, y: 44, w: 24, h: 12};

const isBlocked = (px, py) => {
  const left = px + HITBOX.x;
  const top = py + HITBOX.y;
  const right = left + HITBOX.w -1;
  const bottom = top + HITBOX.h -1;

  if (left < 0 || top < 0 || right >= WORLD_W || bottom >= WORLD_H) return true;

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


const WORLD_W = 30 * TILE;
const WORLD_H = 20 * TILE;

let lastHeroX , lastHeroY;

const mainScene = new GameObject({});
const camera = new Camera(canvas.width, canvas.height);
mainScene.addChild(camera);

mainScene.addChild(rod);

const resize = () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  camera.canvasWidth = canvas.width;
  camera.canvasHeight = canvas.height;
  ctx.imageSmoothingEnabled = false;
  lastHeroX = undefined;
};
window.addEventListener("resize", resize)
resize();

const update = (delta) => {

  if (pickupTime > 0) {
    pickupTime -= delta;
    hero.animations.play("pickUpDown");
  } else {

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
    }

  hero.stepEntry(delta, null);
  campfire.frame = Math.floor(performance.now() / 100) % 4;

  events.emit("HERO_BOX", {
    x: heroPos.x + HITBOX.x, y: heroPos.y + HITBOX.y,
    w: HITBOX.w, h: HITBOX.h,
  });

  mainScene.stepEntry(delta, mainScene);
  
  //homing but as a camera
  if (lastHeroX !== heroPos.x || lastHeroY !== heroPos.y) {
    lastHeroX = heroPos.x;
    lastHeroY = heroPos.y;
    events.emit("HERO_POSITION", new Vector2(
      heroPos.x + HITBOX.x + HITBOX.w / 2,
      heroPos.y + HITBOX.y + HITBOX.h / 2
    ));
  }
};


const draw = () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  

  //Sky fixed to the screen
  const skyScale = Math.max(canvas.width / 320, canvas.height /180);
  ctx.save();
  ctx.translate(
    (canvas.width - 320 * skyScale) / 2,
    (canvas.height - 180 * skyScale) /2
  );
  ctx.scale(skyScale, skyScale);
  skySprite.drawImage(ctx, 0, 0);
  ctx.restore();

  // everything in the world goes inside the camera block
  ctx.save();
  ctx.translate(Math.round(camera.position.x), Math.round(camera.position.y));

  drawLevel(ctx)
  campfire.drawImage(ctx, 16 * TILE, 11 * TILE);
  rod.draw(ctx, 0, 0);

  ctx.save();
  ctx.translate(heroPos.x, heroPos.y);
  ctx.scale(2, 2);
  shadow.drawImage(ctx, 0, 0);
  hero.drawImage(ctx, 0, 0);
  if (pickupTime > 0 && resources.images.rod.isLoaded) {
    const S = 24;
    ctx.drawImage(resources.images.rod.image, 16 -S /2, 18 -S, S, S);
  }
  ctx.restore();

  ctx.strokeStyle = "lime";
  ctx.strokeRect(heroPos.x + HITBOX.x, heroPos.y + HITBOX.y, HITBOX.w, HITBOX.h);
  ctx.restore();
  ctx.save();
  
  const SLOT = 48, PAD = 12, GAP = 8;
  inventory.forEach((img, i) => {
    const x = PAD + i * (SLOT + GAP);
    const y = PAD;
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fillRect(x, y, SLOT, SLOT);
    ctx.strokeStyle = "white";
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, SLOT, SLOT);
    if (img.isLoaded) ctx.drawImage(img.image, x + 8,y + 8, SLOT - 16, SLOT - 16);
  })
  ctx.restore();
};


const gameLoop = new GameLoop(update, draw); 
loadLevel().then(() => gameLoop.start());