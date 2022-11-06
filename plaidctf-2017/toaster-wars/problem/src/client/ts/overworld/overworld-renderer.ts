"use strict";

import {
	CanvasRenderer,
	Container,
	WebGLRenderer
} from "pixi.js";

import Colors               from "../colors";
import Constants            from "../constants";
import OverworldEntityLayer from "./overworld-entity-layer";
import * as Geometry        from "../geometry";
import GraphicsObject       from "../graphics/graphics-object";
import OverworldGroundLayer from "./overworld-ground-layer";
import OverworldItemLayer   from "./overworld-item-layer";
import * as Tweener         from "../graphics/tweener";
import * as utils           from "../../../common/utils";

export default class OverworldRenderer extends Container {
	private _viewport: Viewport;
	private _zoomOut: boolean;
	private groundLayer: OverworldGroundLayer;
	private itemLayer: OverworldItemLayer;
	private entityLayer: OverworldEntityLayer;
	private selfId: string;
	private bounds: Rect;

	constructor(renderer: WebGLRenderer | CanvasRenderer) {
		super();

		this.groundLayer = new OverworldGroundLayer(renderer);
		this.itemLayer = new OverworldItemLayer(renderer);
		this.entityLayer = new OverworldEntityLayer(renderer);

		this.addChild(this.groundLayer);
		this.addChild(this.itemLayer);
		this.addChild(this.entityLayer);

		this._zoomOut = false;
	}

	public displayScene(cos: ClientOverworldScene): void {
		// console.info("Displaying scene", cos);
		this.clear();

		this.selfId = cos.self.id;

		this.groundLayer.display(cos.scene.background);
		// TODO (bluepichu): something with the item layer?
		this.entityLayer.display(cos.scene.entities.concat([cos.self]));
		this.bounds = cos.scene.bounds;
		this.updateViewport(cos.self.position);
	}

	public moveTo(position: Point): void {
		this.entityLayer.moveEntityTo(this.selfId, position);

		this.updateViewport(position);
	}

	public walk(direction: number): void {
		this.entityLayer.get(this.selfId).setAnimationOrContinue("walk");
		this.entityLayer.get(this.selfId).direction = direction;
	}

	public idle(): void {
		this.entityLayer.get(this.selfId).setAnimationOrContinue("default");
	}

	private updateViewport(position: Point): void {
		this.scale.x = 2;
		this.scale.y = 2;

		let vw = window.innerWidth;
		let vh = window.innerHeight;

		let pos = {
			x: Math.max(this.bounds.x.min + vw / 4, Math.min(this.bounds.x.max - vw / 4, position.x)),
			y: Math.max(this.bounds.y.min + vh / 4, Math.min(this.bounds.y.max - vh / 4, position.y))
		};

		this.groundLayer.x = -pos.x;
		this.groundLayer.y = -pos.y;

		this.itemLayer.x = -pos.x;
		this.itemLayer.y = -pos.y;

		this.entityLayer.x = -pos.x;
		this.entityLayer.y = -pos.y;
	}

	public clear(): void {
		this.groundLayer.clear();
		this.entityLayer.clear();
		this.itemLayer.clear();
	}
}