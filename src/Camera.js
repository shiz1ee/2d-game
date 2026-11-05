import { events } from "./Events.js";
import { GameObject } from "./GameObject.js";
import {Vector2} from "./Vector2.js"

export class Camera extends GameObject {

    constructor(canvasWidth, canvasHeight) {
        super({});
        this.canvasHeight = canvasHeight;
        this.canvasWidth = canvasWidth;

        this.worldW = null;
        this.worldH = null;

        events.on("HERO_POSITION", this, targetPosition => {
            let x = -targetPosition.x + (this.canvasWidth / 2);
            let y = -targetPosition.y + (this.canvasHeight / 2);

            if (this.worldW !== null && this.worldW <= this.canvasWidth) {
                x = (this.canvasWidth = this.worldW) / 2;
            }
            if (this.worldH !== null && this.worldH <= this.canvasHeight) {
                y = (this.canvasHeight = this.worldH) / 2;
            }
            
            this.position = new Vector2(
                x, y
            );
        });
    }
}