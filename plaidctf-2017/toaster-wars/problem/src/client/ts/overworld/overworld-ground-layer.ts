"use strict";

import {
	CanvasRenderer,
	WebGLRenderer
} from "pixi.js";

import Constants                    from "../constants";
import * as GraphicsDescriptorCache from "../graphics/graphics-descriptor-cache";
import GraphicsObject               from "../graphics/graphics-object";
import Layer                        from "../graphics/layer";
import * as utils                   from "../../../common/utils";

export default class OverworldGroundLayer extends Layer<GraphicsObject> {
	public constructor(renderer: WebGLRenderer | CanvasRenderer) {
		super(renderer);
	}

	public display(objects: PlacedGraphicsObject[]) {
		this.clear();

		for (let i = 0; i < objects.length; i++) {
			let {x, y} = objects[i].position;
			this.add(i.toString(), objects[i].graphics, {x, y});
		}
	}

	protected generateGraphicsObject(key: string): GraphicsObject {
		return new GraphicsObject(GraphicsDescriptorCache.getGraphics(key));
	}
}