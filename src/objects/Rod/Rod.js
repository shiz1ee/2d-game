import { GameObject } from "../../GameObject.js";
import { Vector2 } from "../../Vector2.js";
import { Sprite } from "../../Sprite.js";
import { resources } from "../../Resource.js";
import { events } from "../../Events.js";

export class Rod extends GameObject {
    constructor(x, y) {
        super({ position: new Vector2(x, y) });

        this.sprite = new Sprite({ resource: resources.images.rod });
        this.addChild(this.sprite);

        events.on("HERO_BOX", this, (box) => {
            const w = this.sprite.frameSize.x * this.sprite.scale;
            const h = this.sprite.frameSize.y * this.sprite.scale;
            const overlaps =
                box.x < this.position.x + w &&
                box.x + box.w > this.position.x &&
                box.y < this.position.y + h &&
                box.y + box.h > this.position.y;
            if (overlaps) this.onCollideWithHero();
        });
    }

    onCollideWithHero() {
        this.destroy();
    }
}