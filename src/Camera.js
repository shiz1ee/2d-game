import { events } from "./Events.js";
import { GameObject } from "./GameObject.js";
import {Vector2} from "./Vector2.js"

export class Camera extends GameObject {

    constructor(canvasWidth, canvasHeight) {
        super({});
        this.canvasHeight = canvasHeight;
        this.canvasWidth = canvasWidth;

        events.on("HERO_POSITION", this, targetPosition => {
            this.position = new Vector2(
                -targetPosition.x + (this.canvasWidth / 2 ),
                -targetPosition.y + (this.canvasHeight / 2)
            );
        });
    }
}