"use strict";

import {
	Texture,
	Sprite
} from "pixi.js";

import Constants      from "../constants";
import GraphicsObject from "./graphics-object";
import * as utils     from "../../../common/utils";

/**
 * Displays a single entity, allowing switches between animations and directions.
 */
export default class EntitySprite extends GraphicsObject {
	private _direction: number;
	private entityGraphicsDescriptor: ExpandedEntityGraphicsDescriptor;

	/**
	 * Constructs a new EntitySprite using the given graphics descriptor.
	 */
	constructor(descriptor: ExpandedEntityGraphicsDescriptor) {
		super(descriptor[0]);
		this.entityGraphicsDescriptor = descriptor;
		this.direction = 6;
	}

	/**
	 * The direction the entity sprite is facing.
	 */
	public get direction(): number {
		return this._direction;
	}

	public set direction(direction: number) {
		if (direction < 0 || direction >= 8 || !Number.isInteger(direction)) {
			throw new Error(`Invalid direction ${direction}.`);
		}

		if (direction !== this._direction) {
			this._direction = direction;
			this.changed = true;
			this.descriptor = this.entityGraphicsDescriptor[direction];
		}
	}
}

