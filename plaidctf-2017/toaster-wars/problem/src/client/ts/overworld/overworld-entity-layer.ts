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

	public display(entities: OverworldEntity[]) {
		for (let entity of entities) {
			this.add(entity.id, entity.graphics, entity.position);
			this.get(entity.id).direction = entity.direction;
		}
	}

	public moveEntityTo(id: string, position: Point) {
		if (!this.has(id)) {
			throw new Error(`No entity with id ${id}.`);
		}

		this.get(id).position.x = position.x;
		this.get(id).position.y = position.y;
	}

	public prerender(): void {
		super.prerender();
		this.children.sort((a, b) => a.y - b.y);
	}
}