import { GameObject } from "../../GameObject";
import { Vector2 } from "../../Vector2";

export class Hero extends GameObject {
    constructor(x, y) {
        super({
            positon: new Vector2(x, y)
        })
    }
}