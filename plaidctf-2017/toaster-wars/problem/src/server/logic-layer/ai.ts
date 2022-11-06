"use strict";

import * as utils     from "../../common/utils";
import * as crawl     from "./crawl";

const log = require("beautiful-log")("dungeonkit:ai");


/**
 * Selects which action should be taken in the given state by the given AI entity.
 * @param state - The current state.
 * @param entity - The entity for which to select a action.
 * @return The selected action.
 */
export function getAction(state: CensoredEntityCrawlState, entity: CrawlEntity): Action {
	log(`Computing move for ${entity.id}`);

	let tile = utils.getTile(state.floor.map, state.self.location);

	if (state.self.location.direction === undefined) {
		state.self.location.direction = 0;
	}

	let enemy: CensoredCrawlEntity = undefined;

	for (let entity of state.entities) {
		if (entity.alignment !== state.self.alignment) {
			enemy = entity;
			break;
		}
	}

	/* Heal if we can and need to */
	if (state.self.stats.hp.current / state.self.stats.hp.max <= 0.25) {
		for (let item of state.self.items.held.items) {
			if (item.name === "Screwdriver") {
				return { type: "item", direction: 0, action: "use", item: item.id };
			}
		}
	}

	/* Attack directly if we can, or indirectly some of the time */
	let attacks = utils.shuffleList(state.self.attacks);

	for (let attack of attacks) {
		if (attack.target.type === "front") {
			for (let d = 0; d < 8; d++) {
				let targets = getTargets(state, state.self, d, attack.target);
				targets = targets.filter((entity) => entity.alignment !== state.self.alignment);
				if (targets.length > 0) {
					return { type: "attack", direction: d, attack: attack };
				}
			}
		} else {
			if (attacks.length === 1 || Math.random() < 0.20) {
				let targets = getTargets(state, state.self, 0, attack.target);
				targets = targets.filter((entity) => entity.alignment !== state.self.alignment);
				if (targets.length > 0) {
					return { type: "attack", direction: 6, attack: attack };
				}
			}
		}
	}

	/* Attempt to throw something at our foe */
	if (enemy !== undefined && utils.lineOfSight(state.self.location, enemy.location, state.floor.map)) {
		for (let item of state.self.items.held.items) {
			if (item.actions !== undefined && item.actions["throw"] !== undefined &&
			   	(item.name === "Paprika"    ||
				 item.name === "Peppercorn" ||
				 item.name === "Cayenne")) {
				let angle = utils.getAngleBetween(state.self.location, enemy.location);
				return { type: "item", direction: angle, action: "throw", item: item.id }
			}
		}
	}

	/* Attempt to move closer if we can see our -friend- enemy */
	if (enemy !== undefined) {
		let [loc, dir, dist] = utils.range(8)
		  .map(n => [n, utils.offsetLocationInDir(state.self.location, n)])
		  .filter(([d, l]) => utils.getTile(state.floor.map, l as CrawlLocation).type == DungeonTileType.FLOOR
			         && crawl.isValidMove(state, entity, d as number))
		  .map(([a, l]) => [l, a, getHeuristicDistance(l as CrawlLocation, enemy.location)])
		  .reduce(([l1, a1, d1], [l2, a2, d2]) => d1 < d2 ? [l1, a1, d1] : [l2, a2, d2]);

		if (dist < getHeuristicDistance(state.self.location, enemy.location)) {
			return { type: "move", direction: dir as number};
		}
	}


	/* If in a corridor, attempt to continue moving forward */
	if (tile.roomId === undefined) {
		for (let d = 0; d < 8; d++) {
			let dir = (state.self.location.direction + Math.ceil(d / 2) * Math.pow(-1, d % 2) + 8) % 8;

			let offsetLocation = utils.offsetLocationInDir(state.self.location, dir);
			let tile = utils.getTile(state.floor.map, offsetLocation);
			if (tile.type === DungeonTileType.FLOOR) {
				state.self.location.direction = dir;
				return { type: "move", direction: dir };
			}
		}
	}

	log("Done computing move - going in a random direction");
	return { type: "move", direction: Math.floor(Math.random() * 8) };
}

/**
 * Calculates the distance based off of a manhattan-esque calculation
 * @param loc1 - The first location
 * @param loc2 - The second location
 * @return The distance approximation
 */
function getHeuristicDistance(loc1: CrawlLocation, loc2: CrawlLocation) {
	let rowDiff = Math.abs(loc1.r - loc2.r);
	let colDiff = Math.abs(loc1.c - loc2.c);

	return Math.max(rowDiff, colDiff) + Math.min(rowDiff, colDiff) / 20;
}

/**
 * Copied from crawl because i'm tired
 *     ...
 * @param state - The state.
 * @param attacker - The attacking entity.
 * @param direction - The direction that the attacker is facing.
 * @param selector - The attack's target selector.
 * @return A list of crawl entities targeted by the attack.
 */

function getTargets(
	state: CensoredInProgressCrawlState,
	attacker: CensoredCrawlEntity,
	direction: number,
	selector: TargetSelector): CensoredCrawlEntity[] {
	switch (selector.type) {
		case "self":
			return [attacker];

		case "around":
			return state.entities.filter((entity) => utils.distance(attacker.location, entity.location) === 1
				&& (entity.alignment !== attacker.alignment || selector.includeAllies));

		case "team":
			return state.entities.filter((entity) => entity.alignment === attacker.alignment
				&& (entity !== attacker || !selector.includeSelf));

		case "front":
			let offset: [number, number] = utils.decodeDirection(direction);
			let location = { r: attacker.location.r + offset[0], c: attacker.location.c + offset[1] };

			if (direction % 2 === 1 &&
				!(selector as FrontTargetSelector).cutsCorners &&
				(!utils.isCrawlLocationInRoom(state.floor.map, attacker.location)
					|| !utils.isCrawlLocationInRoom(state.floor.map, location))) {
				return [];
			}
			return state.entities.filter((entity) => utils.areCrawlLocationsEqual(entity.location, location));

		case "room":
			let room = state.floor.map.grid[attacker.location.r][attacker.location.c].roomId;
			let selection = state.entities;

			if (room === undefined) {
				selection = selection.filter((entity) => utils.distance(attacker.location, entity.location) <= 2);
			} else {
				selection = state.entities.filter((entity) =>
					utils.inSameRoom(state.floor.map, attacker.location, entity.location));
			}

			return selection.filter((entity) => entity.alignment !== attacker.alignment
				|| (entity !== attacker && selector.includeAllies)
				|| (entity === attacker && selector.includeSelf));

		default:
			crawl.unreachable(selector);
	}
}

