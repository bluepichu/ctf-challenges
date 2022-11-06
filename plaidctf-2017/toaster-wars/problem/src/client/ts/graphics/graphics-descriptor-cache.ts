"use strict";

import {
	CanvasRenderer,
	Container,
	RenderTexture,
	SCALE_MODES,
	Sprite,
	Texture,
	WebGLRenderer
} from "pixi.js";

import Constants  from "../constants";
import * as utils from "../../../common/utils";

/**
 * A cache for holding expanded graphics descriptors.
 */
abstract class Cache<U, E> {
	private cache: Map<string, E>;
	protected _renderer: CanvasRenderer | WebGLRenderer;

	/**
	 * Creates an empty cache.
	 */
	public constructor() {
		this.cache = new Map();
		this._renderer = undefined;
	}

	/**
	 * The renderer used by this cache.
	 */
	public set renderer(renderer: CanvasRenderer | WebGLRenderer) {
		this._renderer = renderer;
	}

	/**
	 * Expands the given descriptor and stores it at the given key.
	 * @param key - The key at which to store the expanded descriptor.
	 * @param descriptor - The descriptor to expand.
	 */
	public set(key: string, descriptor: U): void {
		if (this.cache.has(key)) {
			return;
		}

		this.cache.set(key, this.expand(descriptor));
	}

	/**
	 * Retrieves the expanded descriptor stored at the given key.
	 * @param key - The key of the descriptor to retrieve.
	 * @return The expanded descriptor associated with the key.
	 */
	public get(key: string): E {
		if (!this.cache.has(key)) {
			throw new Error(`[Error x]: Requested key ${key} not in the graphics cache.`);
		}

		return this.cache.get(key);
	}

	/**
	 * Expands the given descriptor.
	 * @param descriptor - The descriptor to expand.
	 * @return The expanded descriptor.
	 */
	protected abstract expand(descriptor: U): E;
}

/**
 * A cache for general graphics descriptors.
 */
class GraphicsObjectCache extends Cache<GraphicsObjectDescriptor, ExpandedGraphicsObjectDescriptor> {
	/**
	 * Expands the given descriptor.
	 * @param descriptor - The descriptor to expand.
	 * @return The expanded descriptor.
	 */
	protected expand(descriptor: GraphicsObjectDescriptor): ExpandedGraphicsObjectDescriptor {
		return expandDescriptor(this._renderer, descriptor);
	}
}

/**
 * A cache for entity graphics descriptors.
 */
class EntityGraphicsCache extends Cache<EntityGraphicsDescriptor, ExpandedEntityGraphicsDescriptor> {
	/**
	 * Expands the given descriptor.
	 * @param descriptor - The descriptor to expand.
	 * @return The expanded descriptor.
	 */
	protected expand(descriptor: EntityGraphicsDescriptor): ExpandedEntityGraphicsDescriptor {
		let ret: ExpandedEntityGraphicsDescriptor = [];

		for (let i = 0; i < 8; i++) {
			let key: number;
			let reflect: boolean;

			if (i in descriptor.descriptors) {
				key = i;
				reflect = false;
			} else if (descriptor.useReflection && ((12 - i) % 8) in descriptor.descriptors) {
				key = (12 - i) % 8;
				reflect = true;
			} else {
				throw new Error(`[Error x]: Illegal entity graphics descriptor does not contain a key for direction ${i}.`);
			}

			let expanded = expandDescriptor(this._renderer, descriptor.descriptors[key], i, reflect);

			ret.push(expanded);
		}

		return ret;
	}
}

let graphicsCache: GraphicsObjectCache = new GraphicsObjectCache();
let entityCache: EntityGraphicsCache = new EntityGraphicsCache();

/**
 * Sets the renderer for the caches.
 * @param renderer - The renderer to use.
 */
export function setRenderer(renderer: WebGLRenderer | CanvasRenderer): void {
	graphicsCache.renderer = renderer;
	entityCache.renderer = renderer;
}

/**
 * Expands the given descriptor and stores it at the given key in the general graphics cache.
 * @param key - The key at which to store the expanded descriptor.
 * @param descriptor - The descriptor to expand.
 */
export function setGraphics(key: string, descriptor: GraphicsObjectDescriptor): void {
	graphicsCache.set(key, descriptor);
}

/**
 * Retrieves the expanded descriptor stored at the given key in the general graphics cache.
 * @param key - The key of the descriptor to retrieve.
 * @return The expanded descriptor associated with the key.
 */
export function getGraphics(key: string): ExpandedGraphicsObjectDescriptor {
	return graphicsCache.get(key);
}

/**
 * Expands the given descriptor and stores it at the given key in the entity graphics cache.
 * @param key - The key at which to store the expanded descriptor.
 * @param descriptor - The descriptor to expand.
 */
export function setEntityGraphics(key: string, descriptor: EntityGraphicsDescriptor): void {
	entityCache.set(key, descriptor);
}

/**
 * Retrieves the expanded descriptor stored at the given key in the entity graphics cache.
 * @param key - The key of the descriptor to retrieve.
 * @return The expanded descriptor associated with the key.
 */
export function getEntityGraphics(key: string): ExpandedEntityGraphicsDescriptor {
	return entityCache.get(key);
}

/**
 * Expands a single (generic) graphics descriptor.  Needs to be called several times to fully expand an entity graphics
 *     descriptor.
 * @param renderer - The renderer to use.
 * @param descriptor - The descriptor to expand.
 * @param direction - The direction used for offsets.
 * @param reflect - Whether or not to use reflections.
 * @return The expanded descriptor.
 */
function expandDescriptor(
		renderer: WebGLRenderer | CanvasRenderer,
		descriptor: GraphicsObjectDescriptor,
		direction: number = 0,
		reflect: boolean = false): ExpandedGraphicsObjectDescriptor {
	let expanded: ExpandedGraphicsObjectDescriptor = {};
	let [dr, dc] = utils.decodeDirection(direction);

	for (let animation in descriptor.animations) {
		expanded[animation] = [];
		for (let frame of descriptor.animations[animation]) {

			let container = new Container();

			if (frame.sprites.length === 0) {
				expanded[animation].push({
					duration: frame.duration,
					texture: Texture.EMPTY,
					anchor: { x: 0, y: 0 }
				});
				continue;
			}

			for (let spriteDescriptor of frame.sprites) {
				let sprite = Sprite.fromFrame(`${descriptor.base}-${spriteDescriptor.texture}`);

				sprite.pivot.x = spriteDescriptor.anchor.x;
				sprite.pivot.y = spriteDescriptor.anchor.y;

				if (reflect) {
					sprite.scale.x = -1;
				}

				if (spriteDescriptor.offset) {
					sprite.x = dc * spriteDescriptor.offset * Constants.GRID_SIZE;
					sprite.y = dr * spriteDescriptor.offset * Constants.GRID_SIZE;
				}

				container.addChildAt(sprite, 0);
			}

			let texture = RenderTexture.create(
					container.getBounds().width,
					container.getBounds().height,
					SCALE_MODES.NEAREST,
					window.devicePixelRatio);

			let anchor = {
				x: -container.getBounds().x,
				y: -container.getBounds().y
			};

			Object.assign(container, anchor);

			renderer.render(container, texture);

			expanded[animation].push({
				duration: frame.duration,
				texture,
				anchor
			});
		}
	}

	return expanded;
}