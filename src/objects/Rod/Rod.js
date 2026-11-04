import {GameObject} from "../../GameObject.js";
import { Vector2 } from "../../Vector2.js";
import { Sprite } from "../../Sprite.js";
import { resources } from "../../Resource.js";
import { events } from "../../Events.js";

export class Rod extends GameObject {
    constructor(x,y) {
        super({
            position: new Vector2(x, y)
        });
        const sprite = new Sprite({
            resource: resources.images.rod,
        })
        this.addChild(sprite);


        events.on("HERO_POSITION", this, pos => {
            // detect overlap
        })

        
    }

    onCollideWithHero() {
        this.destroy();
    }

}