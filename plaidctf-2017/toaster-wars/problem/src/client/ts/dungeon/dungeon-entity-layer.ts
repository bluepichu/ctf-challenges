"use strict";

import Constants                    from "../constants";
import EntitySprite                 from "../graphics/entity-sprite";
import * as GraphicsDescriptorCache from "../graphics/graphics-descriptor-cache";
import GraphicsObject               from "../graphics/graphics-object";
import Layer                        from "../graphics/layer";
import * as Tweener                 from "../graphics/tweener";
import * as utils                   from "../../../common/utils";

export default class DungeonEntityLayer extends Layer<EntitySprite> {
	protected generateGraphicsObject(key: string): EntitySprite {
		let descriptor = GraphicsDescriptorCache.getEntityGraphics(key);
		let obj = new EntitySprite(descriptor);
		obj.z = 2;

		return obj;
	}

	public update(entities: CensoredCrawlEntity[]) {
		let current = new Set(this.map.keys());
		let visible = new Set(entities.map((entity) => entity.id));
		let toAdd = new Set([...visible].filter((id) => !current.has(id)));
		let toRemove = new Set([...current].filter((id) => !visible.has(id)));

		toAdd.forEach((id) => {
			let entity = entities.filter((entity) => entity.id === id)[0];
			this.add(id, entity.graphics, utils.locationToPoint(entity.location, Constants.GRID_SIZE));
		});

		toRemove.forEach((id) => {
			this.remove(id);
		});
	}

	public move(id: string, start: Point, end: Point, speed: number): Thenable {
		if (!this.has(id)) {
			throw new Error(`No entity with id ${id}.`);
		}

		this.get(id).x = start.x;
		this.get(id).y = start.y;

		return Tweener.tween(this.get(id), end, speed);
	}

	public setAnimation(id: string, animation: string): void {
		this.get(id).setAnimation(animation);
	}

	public waitForAnimation(id: string, animation: string): Thenable {
		return this.get(id).setAnimation(animation);
	}

	public setDirection(id: string, direction: number): void {
		this.get(id).direction = direction;
	}

	public prerender(): void {
		super.prerender();
		this.children.sort((a, b) => a.y - b.y);
	}
}