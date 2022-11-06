"use strict";

import {
	CanvasRenderer,
	Container,
	DisplayObject,
	RenderTexture,
	SCALE_MODES,
	Sprite,
	WebGLRenderer
} from "pixi.js";

import Constants                    from "../constants";
import * as GraphicsDescriptorCache from "../graphics/graphics-descriptor-cache";
import GraphicsObject               from "../graphics/graphics-object";
import Layer                        from "../graphics/layer";
import * as utils                   from "../../../common/utils";

const letters = "abcdefghijklmnopqrstuvwxyz";

export default class DungeonGroundLayer extends Sprite {
	public texture: RenderTexture;

	private roomBounds: Map<number, Viewport>;
	private _descriptor: ExpandedGraphicsObjectDescriptor;
	private map: Container;
	private renderer: WebGLRenderer | CanvasRenderer;
	private textureNeedsUpdate: boolean;

	constructor(renderer: WebGLRenderer | CanvasRenderer, descriptor: string) {
		super();
		this.map = new Container();
		this.roomBounds = new Map();
		this.renderer = renderer;
		this.clear();
		this._descriptor = GraphicsDescriptorCache.getGraphics(descriptor);
		this.textureNeedsUpdate = false;
	}

	public set descriptor(descriptor: string) {
		this._descriptor = GraphicsDescriptorCache.getGraphics(descriptor);
	}

	protected generateGraphicsObject(key: string): DisplayObject {
		let frame = this._descriptor[key][0];
		let tile = new Sprite(frame.texture);
		tile.pivot.x = frame.anchor.x;
		tile.pivot.y = frame.anchor.y;
		return tile;
	}

	public update(location: CrawlLocation, map: FloorMap) {
		let roomId = utils.getTile(map, location).roomId;

		if (roomId > 0) {
			if (!this.roomBounds.has(roomId)) {
				this.roomBounds.set(roomId, { r: [location.r, location.r], c: [location.c, location.c] });
			}
			let roomBounds = this.roomBounds.get(roomId);
			roomBounds.r[0] = Math.min(roomBounds.r[0], location.r);
			roomBounds.r[1] = Math.max(roomBounds.r[1], location.r);
			roomBounds.c[0] = Math.min(roomBounds.c[0], location.c);
			roomBounds.c[1] = Math.max(roomBounds.c[1], location.c);
		}

		for (let i = location.r - 1; i <= location.r + 1; i++) {
			for (let j = location.c - 1; j <= location.c + 1; j++) {
				if (i < 0 || i >= map.height || j < 0 || j >= map.width) {
					continue;
				}

				let tileType = this.getTileType(map, { r: i, c: j });

				if (tileType !== undefined) {
					let object = this.generateGraphicsObject(tileType);
					let {x, y} = utils.locationToPoint({ r: i, c: j }, Constants.GRID_SIZE);
					object.x = x;
					object.y = y;

					this.map.addChild(object);
					this.textureNeedsUpdate = true;
				}
			}
		}
	}

	public updateTexture(): void {
		if (this.textureNeedsUpdate) {
			this.renderer.render(this.map, this.texture);
			this.textureNeedsUpdate = false;
		}
	}

	private getTileType(map: FloorMap, loc: CrawlLocation): string {
		for (let r = loc.r - 1; r <= loc.r + 1; r++) {
			for (let c = loc.c - 1; c <= loc.c + 1; c++) {
				if (utils.isCrawlLocationInFloorMap(map, { r, c }) && utils.getTile(map, { r, c }).type === DungeonTileType.UNKNOWN) {
					return undefined;
				}
			}
		}

		if (utils.getTile(map, loc).stairs) {
			return "stairs";
		}

		if (utils.getTile(map, loc).type === DungeonTileType.FLOOR) {
			return "default";
		}

		let pattern = 0;

		for (let i = 0; i < 8; i++) {
			let [dr, dc] = utils.decodeDirection(i);

			pattern <<= 1;
			let [r, c] = [loc.r + dr, loc.c + dc];

			if (utils.getTile(map, { r, c }).type === DungeonTileType.WALL
				|| !utils.isCrawlLocationInFloorMap(map, { r, c })) {
				pattern |= 1;
			}
		}

		let cornerChecks = [
			[0b01000000, 0b10100000],
			[0b00010000, 0b00101000],
			[0b00000100, 0b00001010],
			[0b00000001, 0b10000010]
		];

		for (let [corner, sides] of cornerChecks) {
			if ((pattern & corner) > 0 && (pattern & sides) < sides) {
				pattern = pattern & ~corner;
			}
		}

		let variant = Math.floor(Math.random() * (Object.keys(this._descriptor).filter((key) => parseInt(key.split("-")[1], 16) === pattern).length));

		return `wall-${("00" + pattern.toString(16)).substr(-2)}-${letters.charAt(variant)}`;
	}

	public getRoomBounds(roomId: number): Viewport {
		return this.roomBounds.get(roomId);
	}

	public clear(): void {
		this.roomBounds.clear();
		this.map.removeChildren();
		this.texture.destroy();
		this.texture = RenderTexture.create(2048, 2048, SCALE_MODES.NEAREST, window.devicePixelRatio || 1);
	}
}