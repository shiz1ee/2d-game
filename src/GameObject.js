import { Vector2 } from "./Vector2";
import { events } from "./Events.js";

export class GameObject {
    constructor({ position}) {
        this.position = position ?? new Vector2(0, 0);
        this.children = [];
        this.parent = null;
    }

    stepEntry(delta, root) {
        // call updates all children first 
        this.children.forEach((child) => child.stepEntry(delta, root));

        //call any implimented step code
        this.step(delta, root);
    }
    //called once every frame
    step(_delta) {

    }

    //Draw entry
    draw(ctx, x, y) {
        const drawPosX = x + this.position.x;
        const drawPosY = y + this.position.y;

        //Do the actual rendering foe Images
        this.drawImage(ctx, drawPosX, drawPosY);

        //pass on children
        this.children.forEach((child) => child.draw(ctx, drawPosX, drawPosY));
    }

    drawImage(ctx, drawPosX, drawPosY) {

    }

    destroy() {
        this.children.forEach(child => {
            child.destroy();
        });
        this.parent?.removeChild(this) 
    }

    addChild(gameObject) {
        gameObject.parent = this;
        this.children.push(gameObject);
    }

    removeChild(gameObject) {
        events.unsubscribe(gameObject);
        this.children = this.children.filter(g => {
            return gameObject !== g;
        })
    }
}