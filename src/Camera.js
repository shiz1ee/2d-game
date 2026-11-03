import {Vector2} from "./Vector2.js"

export class Camera {

    constructor(canvasWidth = 320, canvasHeight = 180, targetSize = 16) {
        this.position = new Vector2(0, 0);
        this.canvasHeight = canvasHeight;
        this.canvasWidth = canvasWidth;
        this.targetHalf = targetSize / 2;
    }

    follow(targetPosition) {
        this.position = new Vector2(
            -targetPosition.x + (this.canvasWidth / 2 - this.targetHalf),
            -targetPosition.y + (this.canvasHeight / 2 - this.targetHalf)
        );
    }
}