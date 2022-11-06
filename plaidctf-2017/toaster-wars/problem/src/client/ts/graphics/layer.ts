"use strict";

import {
	CanvasRenderer,
	Container,
	WebGLRenderer
} from "pixi.js";

import * as GraphicsDescriptorCache from "./graphics-descriptor-cache";
import GraphicsObject               from "./graphics-object";
import PrerenderContainer           from "./prerender-container";
import * as Tweener                 from "./tweener";

export default Layer;

/**
 * A single layer of objects of the same type.
 */
export abstract class Layer<T extends GraphicsObject> extends PrerenderContainer {
	protected map: Map<string, T>;
	public children: T[];

	/**
	 * Creates an empty layer.
	 */
	constructor(renderer: WebGLRenderer | CanvasRenderer) {
		super(renderer);
		this.map = new Map();
	}

	/**
	 * Generates a grahics object using the given graphics key.
	 */
	protected abstract generateGraphicsObject(key: string): T;

	/**
	 * Adds an object to the layer.
	 * @param id - The unique ID of the object to add.
	 * @param descriptor - The graphics descriptor key of the object to add.
	 * @param location - The location at which to place the object.
	 */
	public add(id: string, descriptor: string, location: Point): void {
		if (this.has(id)) {
			throw new Error(`Already have object with id ${id}.`);
		}

		let obj = this.generateGraphicsObject(descriptor);

		obj.x = location.x;
		obj.y = location.y;

		this.map.set(id, obj);

		this.addChild(obj);
	}

	/**
	 * Returns whether or not the layer contains an object with the given ID.
	 * @param id - The ID to check.
	 * @return Whether or not this layer contains an object with the given id.
	 */
	public has(id: string): boolean {
		return this.map.has(id);
	}

	/**
	 * Returns the object with the given ID, or undefined if no such object exists.
	 * @param id - The ID of the object to retrieve.
	 * @return The object with the given ID, or undefined if no such object exists.
	 */
	public get(id: string): T {
		return this.map.get(id);
	}

	/**
	 * Removes the object with the given ID if it is in the layer.
	 * @param id - The ID of the object to remove.
	 */
	public remove(id: string): void {
		if (this.map.has(id)) {
			this.removeChild(this.map.get(id));
			this.map.delete(id);
		}
	}

	/**
	 * Removes all objects from this layer.
	 */
	public clear(): void {
		this.map.forEach((child) => this.removeChild(child));
		this.map.clear();
	}

	/**
	 * Calls prerender on all children.
	 */
	public prerender(): void {
		this.children.forEach((child) => child.prerender());
	}
}