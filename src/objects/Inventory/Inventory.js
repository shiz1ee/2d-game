import { GameObject } from "../../GameObject";
import { resources } from "../../Resource";
import { Sprite } from "../../Sprite";
import { Vector2 } from "../../Vector2";

export class Inventory extends GameObject {
    constructor() {
        super({
            position: new Vector2(0, 1)
            
        });
        const sprite = new Sprite({
            resource: resources.images.rod
        })
        this.addChild(sprite)
    }
}