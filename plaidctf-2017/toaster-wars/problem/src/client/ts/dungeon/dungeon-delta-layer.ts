"use strict";

import {
	Container,
	Text
} from "pixi.js";

import Colors       from "../colors";
import Constants    from "../constants";
import Layer        from "../graphics/layer";
import * as Tweener from "../graphics/tweener";
import * as utils   from "../../../common/utils";

export default class DungeonDeltaLayer extends Container {
	public displayDelta(location: CrawlLocation, color: number, amount: number): Thenable {
		let delta = new Text((amount > 0 ? "+" : "") + amount,
			{
				fontFamily: "Lato",
				fontSize: "800px",
				fontWeight: "500",
				fill: color,
				stroke: Colors.BLACK,
				strokeThickness: 200,
				lineJoin: "round"
			}
		);

		delta.anchor.x = .5;
		delta.anchor.y = 1;
		delta.scale.x = 0.01;
		delta.scale.y = 0.01;
		Object.assign(delta, utils.locationToPoint(location, Constants.GRID_SIZE));
		delta.y -= Constants.GRID_SIZE / 2;

		this.addChild(delta);

		return Tweener.tween(delta, { y: delta.y - 3 * Constants.GRID_SIZE  / 16}, 0.1)
				.then(() => Tweener.tween(delta, { y: delta.y - Constants.GRID_SIZE / 16, alpha: 0 }, 0.1))
				.then(() => this.removeChild(delta));
	}
}