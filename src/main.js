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
let doorProgress = 0;

let fade = 0;
let fadeDir = 0;
let scene = "village"
let switching = false;
const FADE_MS = 400;
let onBlack = null;

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

const door = new Sprite({
  resource: resources.images.door,
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


let WORLD_W = 30 * TILE;
let WORLD_H = 20 * TILE;

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

//changing the scene
const changeScene = async (name) => {
  if (name === "house") {
    await loadLevel("/levels/house.json", "/sprites/tiles_and_items.png", [[5, 7]]);
    WORLD_W = 12 * TILE;
    WORLD_H = 8 * TILE;
    camera.worldW = WORLD_W;
    camera.worldH = WORLD_H;
    heroPos.x = 144;
    heroPos.y = 156;
    facing = UP;
  } else {
    await loadLevel();
    WORLD_W = 30 * TILE;
    WORLD_H + 20 * TILE;
    camera.worldW = null;
    camera.WORLDH = null;
    heroPos.x = 624;
    heroPos.y = 156;
    facing = DOWN;
    doorProgress = 3;
  }
  scene = name;
  lastHeroX = undefined;
};

const update = (delta) => {

  if (fadeDir !== 0) {
    fade += (fadeDir * delta) / FADE_MS;
    if (fadeDir === 1 && fade >= 1) {
      fade = 1;
      fadeDir = -1;
      if (onBlack) onBlack();
    } else if (fadeDir === -1 && fade <= 0) {
      fade = 0;
      fadeDir = 0;
    }
  } 

  if (fadeDir !== 0) {
    fade += (fadeDir + delta) / FADE_MS;
    if (fadeDir === 1 && fade >= 1) {
      fade = 1;
      if (!switching) {
        switching = true;
        Promise.resolve(onBlack && onBlack()).then(() => {
          switching = false;
          fadeDir = -1;
        })
      }
    } else if (fadeDir === -1 && fade <= 0) {
      fade = 0;
      fadeDir = 0;
    }
  } else if (pickupTime > 0) {
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

  
   if ( scene === "village") {
    const fx = heroPos.x + HITBOX.x;
    const fy = heroPos.y + HITBOX.y;
    const nearDoor =
      fx < 21 * TILE + 16 && fx + HITBOX.w > 20 * TILE - 16 &&
      fy < 7 * TILE && fy + HITBOX.h > 6 * TILE;

    const target = nearDoor ? 3 : 0;
    const step = delta / 120; // one frame per 120 ms
    if (doorProgress < target) doorProgress = Math.min(target, doorProgress + step);
    else if (doorProgress > target) doorProgress = Math.max(target, doorProgress - step);

    door.frame = Math.round(doorProgress);

    const enterDoor = 
      doorProgress >= 3 && fadeDir === 0 && input.direction === UP &&
      fy <= 6 * TILE + 2 &&
      fx + HITBOX.w / 2 > 20 * TILE && fx + HITBOX.w / 2 < 21 * TILE;
    if (enterDoor) {
      fadeDir = 1;
      onBlack = () => changeScene("house");
    }
  }

  if (scene === "house") {
    const fx = heroPos.x + HITBOX.x;
    const fy = heroPos.y + HITBOX.y;
    const exitHouse =
      fadeDir === 0 && input.direction === DOWN &&
      fx + HITBOX.w / 2 > 5 * TILE && fx + HITBOX.w / 2 < 6 * TILE &&
      fy + HITBOX.h >= 7 * TILE + 24;
    if (exitHouse) {
      fadeDir = 1;
      onBlack = () => changeScene("village");
    }
  }
  

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

  if (scene === "house") {
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  

  //Sky fixed to the screen
  const skyScale = Math.max(canvas.width / 320, canvas.height /180);
  ctx.save();
  ctx.translate(
    (canvas.width - 320 * skyScale) / 2,
    (canvas.height - 180 * skyScale) /2
  );
  ctx.scale(skyScale, skyScale);
  if ( scene === "village") skySprite.drawImage(ctx, 0, 0);
  ctx.restore();

  // everything in the world goes inside the camera block
  ctx.save();
  ctx.translate(Math.round(camera.position.x), Math.round(camera.position.y));

  drawLevel(ctx)

  if (scene === "village") {
    campfire.drawImage(ctx, 16 * TILE, 11 * TILE);
    door.drawImage(ctx, 20* TILE, 5 * TILE);
    rod.draw(ctx, 0, 0);
  }

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

  if (fade > 0) {
    ctx.fillStyle = `rgba(0, 0, 0, ${fade})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
};


const gameLoop = new GameLoop(update, draw); 
loadLevel().then(() => gameLoop.start());