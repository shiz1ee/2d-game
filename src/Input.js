export const LEFT = "LEFT"
export const RIGHT = "RIGHT"
export const UP = "UP"
export const DOWN = "DOWN"


export class Input {
    constructor() {

        this.heldDirections = [];

        document.addEventListener("keydown", (e) => {
            if (e.code === "ArrowUp" || e.code === "KeyW") {
                this.onArrowPresseed(UP);
            }
            if (e.code === "ArrowDown" || e.code === "KeyS") {
                this.onArrowPresseed(DOWN);
            }
            if (e.code === "ArrowLeft" || e.code === "KeyA") {
                this.onArrowPresseed(LEFT);
            }
            if (e.code === "ArrowRight" || e.code === "KeyD") {
                this.onArrowPresseed(RIGHT);
            }
        })

        document.addEventListener("keyup", (e) => {
            if (e.code === "ArrowUp" || e.code === "KeyW") {
                this.onArrowReleased(UP);
            }
            if (e.code === "ArrowDown" || e.code === "KeyS") {
                this.onArrowReleased(DOWN);
            }
            if (e.code === "ArrowLeft" || e.code === "KeyA") {
                this.onArrowReleased(LEFT);
            }
            if (e.code === "ArrowRight" || e.code === "KeyD") {
                this.onArrowReleased(RIGHT);
            }
        })
    }

    get direction() {
        return this.heldDirections[0];
    }

    onArrowPresseed(direction) {
        if (this.heldDirections.indexOf(direction) === -1) {
            this.heldDirections.unshift(direction);
        }
    }

    onArrowReleased(direction) {
        const index = this.heldDirections.indexOf(direction);
        if (index === -1) {
            return;
        }
        this.heldDirections.splice(index, 1);
        
    }
}