import { resources } from './Resource';
import { Sprite } from './Sprite';
import './style.css'
import { Vector2 } from './Vector2';
import { GameLoop } from "./GameLoop.js";
import { Input, DOWN, UP, LEFT, RIGHT } from "./Input.js"
import { gridCells } from './helpers/grid.js';
import { moveTowards } from './helpers/moveTowards.js';

const canvas = document.querySelector("#game-canvas");
const ctx = canvas.getContext("2d");
const idleFrames = { DOWN: 1, UP: 7, LEFT: 10, RIGHT: 4};
let facing = DOWN;
const skySprite = new Sprite({
    resource: resources.images.sky,
    frameSize: new Vector2(320, 180)
  })

const groundSprite = new Sprite({
    resource: resources.images.ground,
    frameSize: new Vector2(320, 180)
  })

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

const heroPos = new Vector2(16 * 5, 16 * 5);
const input = new Input();




const update = () => {

  if (input.direction === DOWN) {
    heroPos.y += 1;
    hero.frame = 0; 
    facing = DOWN;
    
  }
  if (input.direction === UP) {
    heroPos.y -= 1;
    hero.frame = 6;
    facing = UP;
  }
  if (input.direction === LEFT) {
    heroPos.x -= 1;
    hero.frame = 9;
    facing = LEFT;
  }
  if (input.direction === RIGHT) {
    heroPos.x += 1;
    hero.frame = 3;
    facing = RIGHT;
  }

  if (!input.direction) {
    hero.frame = idleFrames[facing];
  }
};


const draw = () => {
  skySprite.drawImage(ctx, 0, 0);
  groundSprite.drawImage(ctx, 0, 0);
  
  const heroOffset = new Vector2(-8, -21);
  const heroPosX = hero.position.x+heroOffset.x;
  const heroPosY = hero.position.y+heroOffset.y;

  shadow.drawImage(ctx, heroPos.x, heroPos.y);
  hero.drawImage(ctx, heroPos.x, heroPos.y);
}

const gameLoop = new GameLoop(update, draw); 
gameLoop.start();