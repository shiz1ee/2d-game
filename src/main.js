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
let lastNow = performance.now();
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

const STONE = { col: 9, row: 4};
const HOLE = { col: 9, row: 5 };
const WANDS_NEEDED = 4;
const PIXEL_FONT = '"Press Start 2P", monospace';
document.fonts.load('16px "Press Start 2P"');
let nearStone = false;
let dialog = null;
let holeOpen = false;
let nearHole = false;
let jump = null;
const ARC_MS = 600;
const FALL_MS = 350;
const GROW_MS = 3500;
const END_DELAY_MS = 2000;
const TYPE_MS = 130;
const DOT_MS = 500;

const startJump = () => {
  input.heldDirections.length = 0;
  jump = {
    t: 0, phase: "arc", lift: 0, shrink: 0,
    from: { x: heroPos.x, y: heroPos.y},
    to: {
      x: HOLE.col * TILE + TILE / 2 - (HITBOX.x + HITBOX.w / 2),
      y: HOLE.row * TILE + TILE / 2 - (HITBOX.y + HITBOX.h / 2),
    },
  };
};

const updateJump = (dt) => {
  jump.t += dt;
  if (jump.phase === "arc") {
    const p = Math.min(1, jump.t / ARC_MS);
    heroPos.x = jump.from.x + (jump.to.x - jump.from.x) * p;
    heroPos.y = jump.from.y + (jump.to.y - jump.from.y) * p;
    jump.lift = Math.sin(Math.PI * p) * 48;
    if (p >= 1) { jump.phase = "fall"; jump.t = 0;}
  } else if (jump.phase === "fall") {
    jump.lift = 0;
    jump.shrink = Math.min(1, jump.t / FALL_MS);
    if (jump.shrink >= 1 ) {jump.phase = "grow"; jump.t = 0;}
    } else if (jump.phase === "grow") {
      if (jump.t >= GROW_MS) { jump.phase = "done"; jump.t = 0; }
    }
};

const confirmChoice = () => {
  const insert = dialog.choice === 0;
  if (insert && inventory.length < WANDS_NEEDED) return;
  if (insert) {
    inventory.length = 0;
    holeOpen = true;
  }
  dialog = null;
};

document.addEventListener("keydown", (e) => {
  if (e.repeat) return;
  if (dialog) {
    if (e.code === "ArrowLeft" || e.code === "KeyA") dialog.choice = 0;
    if (e.code === "ArrowRight" || e.code === "KeyD") dialog.choice = 1;
    if (e.code === "Enter" || e.code === "KeyE") confirmChoice();
    if (e.code === "Escape") dialog = null;
    return;
  }
  if (e.code === "KeyE" && nearStone && fadeDir === 0 && pickupTime <= 0 && !holeOpen) {
    dialog = { choice: 0};
  }
  if (e.code === "Space" && nearHole && !jump && fadeDir === 0) {
    e.preventDefault();
    startJump();
  }
});

const rod = new Rod(TILE * 20.25, TILE * 6); 
const rods = [
  rod,
  new Rod( 8 * TILE + 8, 7 * TILE + 8, "village"),
  new Rod( 21 * TILE + 8, 11 * TILE + 8, "village"),
  new Rod( 10 * TILE + 8, 6 * TILE + 8, "house"),
]


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

rods.forEach((r) => mainScene.addChild(r));

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
    WORLD_H = 20 * TILE;
    camera.worldW = null;
    camera.worldH = null;
    heroPos.x = 624;
    heroPos.y = 156;
    facing = DOWN;
    doorProgress = 3;
  }
  events.emit("HERO_POSITION", new Vector2(
    heroPos.x + HITBOX.x + HITBOX.w / 2,
    heroPos.y + HITBOX.y + HITBOX.h / 2
  ));
  scene = name;
  lastHeroX = undefined;
};

const update = (delta) => {

  const now = performance.now();
  const realDt = Math.min(now - lastNow, 250);
  lastNow = now;

  if (fadeDir !== 0) {
    fade += (fadeDir * realDt) / FADE_MS;
    if (fadeDir === 1 && fade >= 1) {
      fade = 1;
      if (!switching) {
        switching = true;
        Promise.resolve(onBlack && onBlack()).then(() => {
          switching = false;
          fadeDir = -1;
        });
      }
    } else if (fadeDir === -1 && fade <= 0) {
      fade = 0;
      fadeDir = 0;
    }
  }

  if (jump) {
    updateJump(realDt);
    hero.animations.play(standAnim[facing]);
  } else if (fadeDir !== 0) {
    hero.animations.play(standAnim[facing]);
  } else if (pickupTime > 0) {
    pickupTime -= delta;
    hero.animations.play("pickUpDown");
  } else if (dialog) {hero.animations.play(standAnim[facing]);} else {

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


  if (scene === "village") {
    const cx = heroPos.x + HITBOX.x + HITBOX.w / 2;
    const cy = heroPos.y + HITBOX.y + HITBOX.h / 2;
    const sx = STONE.col * TILE + TILE / 2;
    const sy = STONE.row * TILE + TILE / 2;
    nearStone = Math.hypot(cx - sx, cy - sy) < TILE * 1.5;
    const hx = HOLE.col * TILE + TILE / 2;
    const hy = HOLE.row * TILE +TILE / 2;
    nearHole = holeOpen && Math.hypot(cx - hx, cy - hy) < TILE * 2;
  } else {
    nearStone = false;
    nearHole = false;
  }

  events.emit("HERO_BOX", {
    x: heroPos.x + HITBOX.x, y: heroPos.y + HITBOX.y,
    w: HITBOX.w, h: HITBOX.h,
    scene,
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

const drawPromt = () => {
  if (!nearStone || dialog || holeOpen) return;
  const bob = Math.round(Math.sin(performance.now() / 250)) * 2;
  const x = STONE.col * TILE + TILE / 2;
  const y = STONE.row * TILE - 8 + bob;
  ctx.save();
  ctx.font = `16px ${PIXEL_FONT}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.lineWidth = 4;
  ctx.strokeStyle = "black";
  ctx.strokeText("E", x, y);
  ctx.fillStyle = "white";
  ctx.fillText("E", x, y);
  ctx.restore();
};

const drawDialog = () => {
  if (!dialog) return;
  const W = Math.min(canvas.width - 40, 720);
  const H = 110;
  const x = Math.round((canvas.width - W) / 2);
  const y = canvas.height - H - 24;
  const hasEnough = inventory.length >= WANDS_NEEDED;

  ctx.save();
  ctx.fillStyle = "#0f1b2d";
  ctx.fillRect(x, y, W, H);
  ctx.strokeStyle = "white";
  ctx.lineWidth = 4;
  ctx.strokeRect(x + 2, y + 2, W - 4, H - 4);
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 7, y + 7, W - 14, H - 14);

  ctx.textBaseline = "top";
  ctx.textAlign = "left";
  ctx.font = `14px ${PIXEL_FONT}`;
  ctx.fillStyle = "white";
  ctx.fillText(`Insert ${WANDS_NEEDED} wands into the stone?`, x + 24, y + 28);
  ctx.fillStyle = "#aaa";
  ctx.fillText(`${inventory.length} / ${WANDS_NEEDED}`, x + 24, y + 64);

  const labels = ["Insert", "No"];
  const BW = 110, BH = 36;
  labels.forEach((label, i) => {
    const bx = x + i * (BW + 8);
    const by = y - BH - 8;
    const selected = dialog.choice === i;
    const disabled = i === 0 && !hasEnough;
    ctx.fillStyle = "black";
    ctx.fillRect(bx, by, BW, BH);
    ctx.strokeStyle = selected ? "white" : "#666";
    ctx.lineWidth = 4;
    ctx.strokeRect(bx + 2, by + 2, BW - 4, BH -4);
    ctx.fillStyle = disabled ? "#555" : "white";
    ctx.font = `12px ${PIXEL_FONT}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label, bx + BW / 2, by + BH / 2);
  });
  ctx.restore();
};

const drawHole = () => {
  if (!holeOpen || scene !== "village") return;
  const cx = HOLE.col * TILE + TILE / 2;
  const cy = HOLE.row * TILE + TILE / 2;
  const P = 4;
  for (let py = -3; py <= 3; py++) {
    for (let px = -4; px <= 4; px++) {
      const d = (px * px) / 16 + (py * py) / 9;
      if (d > 1) continue;
      ctx.fillStyle = d > 0.55 ? "#1a0f0a" : "black";
      ctx.fillRect(cx + px * P - P / 2, cy + py * P - P / 2, P, P);
    }
  }
};

const drawJumpLabel = () => {
  if (!holeOpen || scene !== "village" || jump) return;
  const bob = Math.round(Math.sin(performance.now() / 250)) * 2;
  const x = HOLE.col * TILE + TILE / 2;
  const y = HOLE.row * TILE - 4 + bob;
  ctx.save();
  ctx.font = `12px ${PIXEL_FONT}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.lineWidth = 4;
  ctx.strokeStyle = "black";
  ctx.fillStyle = "white";
  ctx.fillText("JUMP", x, y);
  ctx.restore();
}

const drawJumpCircle = () => {
  if (!jump || (jump.phase !== "grow" && jump.phase !== "done")) return;
  const cx = HOLE.col * TILE + TILE / 2 + Math.round(camera.position.x);
  const cy = HOLE.row * TILE + TILE / 2 + Math.round(camera.position.y);
  const far = Math.hypot(
    Math.max(cx, canvas.width - cx),
    Math.max(cy, canvas.height - cy)
  );
  const p = jump.phase === "done" ? 1 : jump.t / GROW_MS;
  const r = 18 + (far - 18) * p * p;
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = "black";
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI *2);
  ctx.fill();
  ctx.restore();
};

const drawEnding = () => {
  if (!jump || jump.phase !== "done") return;
  const t = jump.t - END_DELAY_MS;
  if (t < 0) return;

  const full = "TO BE CONTINUED";
  const typed = Math.min(full.length, Math.floor(t / TYPE_MS) + 1);
  let text = full.slice(0, typed);
  if (typed === full.length) {
    const tDots = t - (full.length -1) * TYPE_MS;
    text += ".".repeat((Math.floor(tDots / DOT_MS) % 3) + 1);
  }

  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.font = '56px "Courier New", Courier, monospace';
  ctx.letterSpacing = "4px";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  
  const x = (canvas.width - ctx.measureText(full + "...").width) / 2;
  const y = canvas.height /2;
  ctx.fillStyle = "#ff2a2a";
  ctx.shadowColor = "#ff0000";
  ctx.shadowBlur = 24;
  ctx.fillText(text, x, y);
  ctx.shadowBlur = 34;
  ctx.fillText(text, x, y);
  ctx.shadowBlur = 8;
  ctx.fillText(text, x, y);
  ctx.restore();
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
  }
  rods.forEach((r) => { if (r.scene === scene) r.draw(ctx, 0, 0); });
  drawPromt();
  drawHole();

  ctx.save();
  ctx.translate(heroPos.x, heroPos.y);
  ctx.scale(2, 2);
  shadow.drawImage(ctx, 0, 0);
  if (jump) {
    const s = 1 - jump.shrink;
    const fx = (HITBOX.x + HITBOX.w / 2) / 2;
    const fy = (HITBOX.y + HITBOX.h / 2) / 2;
    ctx.translate(fx, fy - jump.lift / 2);
    ctx.scale(s, s);
    ctx.translate(-fx, -fy);
  }
  hero.drawImage(ctx, 0, 0);
  if (pickupTime > 0 && resources.images.rod.isLoaded) {
    const S = 24;
    ctx.drawImage(resources.images.rod.image, 16 -S /2, 18 -S, S, S);
  }
  ctx.restore();
  drawJumpLabel();


  
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

  drawJumpCircle();
  drawEnding();
  drawDialog();

  if (fade > 0) {
    ctx.fillStyle = `rgba(0, 0, 0, ${fade})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
};


const gameLoop = new GameLoop(update, draw); 
loadLevel().then(() => gameLoop.start());