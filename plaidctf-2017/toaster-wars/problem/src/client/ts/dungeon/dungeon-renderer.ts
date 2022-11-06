"use strict";

import {
	CanvasRenderer,
	Container,
	WebGLRenderer
} from "pixi.js";

import Colors             from "../colors";
import Constants          from "../constants";
import DeltaLayer         from "./dungeon-delta-layer";
import EntityLayer        from "./dungeon-entity-layer";
import GraphicsObject     from "../graphics/graphics-object";
import DungeonGroundLayer from "./dungeon-ground-layer";
import ItemLayer          from "./dungeon-item-layer";
import * as Tweener       from "../graphics/tweener";
import * as utils         from "../../../common/utils";

export default class DungeonRenderer extends Container {
	private _viewport: Viewport;
	private _zoomOut: boolean;
	private groundLayer: DungeonGroundLayer;
	private itemLayer: ItemLayer;
	private entityLayer: EntityLayer;
	private deltaLayer: DeltaLayer;

	constructor(renderer: CanvasRenderer | WebGLRenderer, dungeonGraphics: string) {
		super();

		this.groundLayer = new DungeonGroundLayer(renderer, dungeonGraphics);
		this.itemLayer = new ItemLayer(renderer);
		this.entityLayer = new EntityLayer(renderer);
		this.deltaLayer = new DeltaLayer();

		this.addChild(this.groundLayer);
		this.addChild(this.itemLayer);
		this.addChild(this.entityLayer);
		this.addChild(this.deltaLayer);

		this._zoomOut = false;
	}

	public update(state: CensoredInProgressCrawlState): void {
		this.groundLayer.updateTexture();
		this.itemLayer.update(state.items);
		this.entityLayer.update(state.entities);
	}

	public updateGround(location: CrawlLocation, map: FloorMap): void {
		this.groundLayer.update(location, map);
	}

	private ensureEntityExists(entity: CondensedEntity, location: CrawlLocation): void {
		if (!this.entityLayer.has(entity.id)) {
			this.entityLayer.add(entity.id, entity.graphics, utils.locationToPoint(location, Constants.GRID_SIZE));
		}
	}

	public showWalk(entity: CondensedEntity, start: CrawlLocation, end: CrawlLocation, direction?: number): Thenable {
		this.ensureEntityExists(entity, start);

		this.entityLayer.setAnimation(entity.id, "walk");
		this.entityLayer.setDirection(entity.id, direction);

		return this.entityLayer.move(
				entity.id,
				utils.locationToPoint(start, Constants.GRID_SIZE),
				utils.locationToPoint(end, Constants.GRID_SIZE),
				Constants.CRAWL_WALK_SPEED)
			.then(() => this.entityLayer.setAnimation(entity.id, "default"));
	}

	public showAttack(entity: CondensedEntity, location: CrawlLocation, direction: number, animation: string): Thenable {
		this.ensureEntityExists(entity, location);

		this.entityLayer.setDirection(entity.id, direction);

		return this.entityLayer.waitForAnimation(entity.id, animation)
			.then(() => this.entityLayer.setAnimation(entity.id, "default"));
	}

	public showThrow(entity: CondensedEntity, from: CrawlLocation, to: CrawlLocation, direction: number, item: Item): Thenable {
		this.ensureEntityExists(entity, from);

		this.entityLayer.setDirection(entity.id, direction);

		return this.entityLayer.waitForAnimation(entity.id, "throw")
			// TODO: some kind of thrown-item animation here
			.then(() => this.entityLayer.setAnimation(entity.id, "default"));
	}

	public showHurt(entity: CondensedEntity, location: CrawlLocation, amount: number): Thenable {
		this.ensureEntityExists(entity, location);

		this.displayDelta(location, Colors.YELLOW, amount);

		return this.entityLayer.waitForAnimation(entity.id, "hurt")
			.then(() => this.entityLayer.setAnimation(entity.id, "default"));
	}

	public showHeal(entity: CondensedEntity, location: CrawlLocation, amount: number): Thenable {
		this.ensureEntityExists(entity, location);

		return this.displayDelta(location, Colors.GREEN, amount);
	}

	public showBelly(entity: CondensedEntity, location: CrawlLocation, amount: number): Thenable {
		this.ensureEntityExists(entity, location);

		return this.displayDelta(location, Colors.GREEN, amount);
	}

	public showDefeat(entity: CondensedEntity): Thenable {
		if (!this.entityLayer.has(entity.id)) {
			return Promise.resolve();
		}

		return this.entityLayer.waitForAnimation(entity.id, "defeat")
			.then(() => this.entityLayer.remove(entity.id));
	}

	public showDirection(entityId: string, direction: number): void {
		if (!this.entityLayer.has(entityId)) {
			return;
		}

		this.entityLayer.setDirection(entityId, direction);
	}

	private updateViewport(nextView: Viewport) {
		let center = {
			r: (nextView.r[0] + nextView.r[1]) / 2,
			c: (nextView.c[0] + nextView.c[1]) / 2
		};

		let newScale = Math.min(window.innerHeight / (nextView.r[1] - nextView.r[0]),
			window.innerWidth / (nextView.c[1] - nextView.c[0])) * .8 / Constants.GRID_SIZE;

		newScale = Math.min(newScale, 4);

		Tweener.tween(this.scale, { x: newScale, y: newScale }, Constants.VIEW_ZOOM_VELOCITY, "smooth");

		let {x: cx, y: cy} = utils.locationToPoint(center, Constants.GRID_SIZE);

		Tweener.tween(this.groundLayer, {x: -cx, y: -cy}, Constants.VIEW_MOVE_VELOCITY, "smooth");
		Tweener.tween(this.itemLayer, {x: -cx, y: -cy}, Constants.VIEW_MOVE_VELOCITY, "smooth");
		Tweener.tween(this.entityLayer, {x: -cx, y: -cy}, Constants.VIEW_MOVE_VELOCITY, "smooth");
		Tweener.tween(this.deltaLayer, {x: -cx, y: -cy}, Constants.VIEW_MOVE_VELOCITY, "smooth");
	}

	public showFloorStart(location: CrawlLocation): void {
		this.scale.x = 4;
		this.scale.y = 4;

		let {x: cx, y: cy} = utils.locationToPoint(location, Constants.GRID_SIZE);

		this.groundLayer.x = -cx;
		this.groundLayer.y = -cy;
		this.itemLayer.x = -cx;
		this.itemLayer.y = -cy;
		this.entityLayer.x = -cx;
		this.entityLayer.y = -cy;
		this.deltaLayer.x = -cx;
		this.deltaLayer.y = -cy;
	}

	public updatePosition(map: FloorMap, location: CrawlLocation): void {
		let roomBounds = this.groundLayer.getRoomBounds(utils.getTile(map, location).roomId);

		if (utils.isVoid(roomBounds)) { // in a hallway or don't know the bounds of the current room
			this._viewport = {
				r: [location.r - 2, location.r + 2],
				c: [location.c - 2, location.c + 2]
			};
		} else { // in a room whose bounds we know
			this._viewport = {
				r: [roomBounds.r[0] - 2, roomBounds.r[1] + 2],
				c: [roomBounds.c[0] - 2, roomBounds.c[1] + 2]
			};
		}

		if (!this._zoomOut) {
			this.updateViewport(this._viewport);
		}
	}

	public setZoomOut(zoom: boolean, map: FloorMap): void {
		if (this._zoomOut !== zoom) {
			if (zoom) {
				this._zoomOut = true;
				this.updateViewport({ r: [0, map.height], c: [0, map.width] });
			} else {
				this._zoomOut = false;
				this.updateViewport(this._viewport);
			}
		}
	}

	public displayDelta(location: CrawlLocation, color: number, amount: number): Thenable {
		return this.deltaLayer.displayDelta(location, color, amount);
	}

	public clear(): void {
		this.groundLayer.clear();
		this.entityLayer.clear();
		this.itemLayer.clear();
	}
}