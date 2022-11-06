"use strict";

import * as ai        from "./ai";
import * as generator from "./generator";
import * as printer   from "./printer";
import * as utils     from "../../common/utils";
import { Queue }      from "../../common/queue";

const log = require("beautiful-log")("dungeonkit:crawl");

/**
 * Starts a new crawl in the given dungeon with the given entities.
 * @param dungeon - The dungeon for the crawl.
 * @param entities - The entities performing the crawl.
 * @return A promise for a concluded crawl.
 */
export function startCrawl(dungeon: Dungeon, entities: UnplacedCrawlEntity[], eventLog: LogEvent[], mapUpdates: MapUpdate[]): CrawlState {
	if (validateDungeonBlueprint(dungeon)) {
		return advanceToFloor(dungeon, 1, entities, eventLog, mapUpdates);
	} else {
		throw new Error(`[Code 1] Dungeon blueprint for dungeon '${dungeon.name}' failed validation.`);
	}
}

/**
 * Steps a crawl until input from the player is needed.
 * @param state - The game to run.
 * @return A promise for a concluded crawl.
 */
export function step(state: InProgressCrawlState, eventLog: LogEvent[], mapUpdates: MapUpdate[]): CrawlState {
	let entity = nextEntity(state);
	let censoredState = getCensoredState(state, entity);

	if (entity.ai) {
		let action = ai.getAction(censoredState, entity);
		log(action);

		for (let act of getActionsToTry(entity, action)) {
			if (!isValidAction(state, entity, act)) {
				continue;
			}

			let newState = execute(state, entity, action, eventLog, mapUpdates);
			log("Done executing move - filtering");

			if (state.entities.every((entity) => entity.ai)) {
				return {
					dungeon: state.dungeon,
					success: false,
					floor: state.floor.number
				};
			}

			if (utils.isCrawlOver(newState)) {
				return newState;
			}

			return step(newState, eventLog, mapUpdates);
		}

		// AI, you done goofed
		log(action);
		return step(state, eventLog, mapUpdates);
	} else {
		state.entities.unshift(state.entities.pop());
		return state;
	}
}

/**
 * Steps a crawl until input from the player is needed.
 * @param state - The game to run.
 * @return A promise for a concluded crawl.
 */
export function stepWithAction(state: InProgressCrawlState, action: Action, eventLog: LogEvent[], mapUpdates: MapUpdate[]): { valid: boolean, state: CrawlState } {
	let entity = nextEntity(state);
	let censoredState = getCensoredState(state, entity);

	if (entity.ai) {
		// What?
		log("Trying to move as AI?");
		return { valid: false, state };
	}

	if (action.type !== "wait" && action.type !== "move" && action.type !== "attack" && action.type !== "item" && action.type !== "stairs") {
		return unreachable(action);
	}

	for (let act of getActionsToTry(entity, action)) {
		if (!isValidAction(state, entity, act)) {
			continue;
		}

		let newState = execute(state, entity, act, eventLog, mapUpdates);
		log("Done executing move - filtering");

		if (state.entities.every((entity) => entity.ai)) {
			return {
				valid: true,
				state: {
					dungeon: state.dungeon,
					success: false,
					floor: state.floor.number
				}
			};
		}

		if (utils.isCrawlOver(newState)) {
			return { valid: true, state: newState };
		}

		return { valid: true, state: step(newState, eventLog, mapUpdates) };
	}

	state.entities.unshift(state.entities.pop());
	return { valid: false, state }; // Action wasn't valid
}

/**
 * Generates the set of actions to try for the given input move.  In particular, yields the move with each direction
 *     in a random order if the entity is confused, and otherwise yields just the original move.
 * @param entity - The entity taking the action.
 * @param action - The action being taken.
 */
function* getActionsToTry(entity: CrawlEntity, action: Action): Iterable<Action> {
	if (entity.status.indexOf(StatusCondition.CONFUSED) >= 0 && action.type !== "wait" && action.type !== "stairs") {
		let directions = [0, 1, 2, 3, 4, 5, 6, 7];

		while (directions.length > 0) {
			let idx = utils.randint(0, directions.length - 1);
			let t = directions[idx];
			directions[idx] = directions[directions.length - 1];
			directions[directions.length - 1] = t;

			action.direction = directions.pop();
			yield action;
		}
	} else {
		yield action;
	}
}

/**
 * Retrieves the next entity to move in the given state.
 * @param state - The state.
 * @return The next entity to move.
 */
function nextEntity(state: InProgressCrawlState): CrawlEntity {
	let next = state.entities.shift();
	state.entities.push(next);
	return next;
}

/**
 * Checks a dungeon blueprint's validity.
 * @param dungeon - The dungeon whose blueprint should be verified.
 * @return Whether or not the dungeon has a legal blueprint.
 */
function validateDungeonBlueprint(dungeon: Dungeon): boolean {
	if (dungeon.blueprint.length === 0) {
		return false;
	}

	let nextFloor = 1;

	for (let i = 0; i < dungeon.blueprint.length; i++) {
		if (dungeon.blueprint[i].range[0] !== nextFloor) {
			return false;
		}

		nextFloor = dungeon.blueprint[i].range[1] + 1;

		// TODO: more checks here
	}

	if (nextFloor !== dungeon.floors + 1) {
		return false;
	}

	return true;
}

/**
 * Returns an in-progress crawl state on the given floor in the given dungeon, with the given entities performing the
 *     crawl.
 * @param dungeon - The dungeon in which the crawl is occuring.
 * @param floor - The floor to initialize.  Must be valid for the given dungeon.
 * @param entities - The entities performing the crawl.
 * @return An in-progress crawl state with the given entities performing a crawl on the given floor.
 */
function advanceToFloor(
	dungeon: Dungeon,
	floor: number,
	entities: UnplacedCrawlEntity[],
	eventLog: LogEvent[],
	mapUpdates: MapUpdate[]): CrawlState {
	if (floor > dungeon.blueprint[dungeon.blueprint.length - 1].range[1]) {
		return {
			dungeon: dungeon,
			success: true,
			floor: floor
		};
	} else {
		let blueprint = getFloorBlueprint(dungeon, floor);
		let state = generator.generateFloor(dungeon, floor, blueprint, entities);

		state.entities.forEach((entity) => {
			updateFloorMap(state, entity, mapUpdates);
			entity.stats.attack.modifier = 0;
			entity.stats.defense.modifier = 0;
		});

		let player = state.entities.filter((ent) => !ent.ai)[0];

		eventLog.push({
			type: "start",
			entity: {
				name: player.name,
				graphics: player.graphics,
				id: player.id
			},
			floorInformation: {
				number: floor,
				width: state.floor.map.width,
				height: state.floor.map.height
			},
			self: censorSelf(player)
		});

		return state;
	}
}

/**
 * Returns the floor blueprint for the given floor in the given dungeon.
 * @param dungeon - The dungeon whose blueprint should be retreived.
 * @param floor - The floor number whose blueprint should be retreived.
 * @return The floor blueprint for the given floor in the given dungeon.
 */
function getFloorBlueprint(dungeon: Dungeon, floor: number): FloorBlueprint {
	if (floor < 0 || floor > dungeon.floors) {
		throw new RangeError(`[Code 2] Floor ${floor} is out of range for dungeon '${dungeon.name}'.`);
	}

	let lo = 0;
	let hi = dungeon.blueprint.length;

	while (lo < hi) {
		let mid = Math.floor((lo + hi) / 2);
		let bp = dungeon.blueprint[mid];

		if (floor < bp.range[0]) {
			hi = mid;
		} else if (floor > bp.range[1]) {
			lo = mid + 1;
		} else {
			return bp.blueprint;
		}
	}

	throw new RangeError(`[Code 3] A blueprint for floor ${floor} was not found in the blueprint for dungeon '${dungeon.name}'.`);
}

/**
 * Makes an object read-only.
 * @param obj - The object.
 * @return The read-only copy of the object.
 */
function makeReadOnly<T>(obj: T, logstr: string = "[base]"): T {
	return new Proxy(obj, {
		get(target: T, field: string | number | symbol): any {
			if (typeof (target as any)[field] === "object") {
				return makeReadOnly((target as any)[field], logstr + "." + field.toString());
			}
			return (target as any)[field];
		},
		set(target: T, field: string | number | symbol, value: any): boolean {
			throw new TypeError(`Attempted illegal set action on field "${field}" of read-only object.`);
		}
	});
}

/**
 * Censors in an in-progress crawl state for a given entity.  This removes entities and items that the entity can't
 *     currently see and replaces the floor map with the entity's map.  It also adds a "self" field to the state for
 *     the entity to identify itself.
 * @param state - The in-progress crawl state to censor.
 * @param entity - The entity for which the state should be censored.
 * @return The given state censored for the given entity.
 */
export function getCensoredState(
	state: InProgressCrawlState,
	entity: CrawlEntity): CensoredEntityCrawlState {
	// Normally this would be made readonly; however, this was removed in an attempt to speed up the code.
	return {
		self: censorSelf(entity),
		dungeon: {
			name: state.dungeon.name,
			floors: state.dungeon.floors,
			direction: state.dungeon.direction,
			difficulty: state.dungeon.difficulty,
			graphics: state.dungeon.graphics
		},
		floor: {
			number: state.floor.number,
			map: entity.map
		},
		entities: state.entities.filter((ent: CrawlEntity) =>
			utils.isObjectVisible(state.floor.map, entity.location, ent.location)).map((ent) =>
				ent.alignment === entity.alignment ? censorSelf(ent) : censorEntity(ent)),
		items: state.items.filter((item: CrawlItem) =>
			utils.isObjectVisible(state.floor.map, entity.location, item.location))
	};
}

/**
 * Censors a single entity.  This removes, for example, its items, stats, and attacks.
 * @param entity - The entity to censor.
 * @return The censored entity.
 */
function censorEntity(entity: CrawlEntity): CensoredCrawlEntity {
	return {
		id: entity.id,
		name: entity.name,
		location: entity.location,
		graphics: entity.graphics,
		alignment: entity.alignment,
		ai: entity.ai,
		stats: {
			attack: { modifier: entity.stats.attack.modifier },
			defense: { modifier: entity.stats.defense.modifier }
		},
		status: entity.status
	};
}

/**
 * Censors an entity for themself.  Currently only removes the controller for serialization, but may remove other
 *     server-only data in the future.
 * @param entity - The entity to censor.
 * @return The censored entity.
 */
function censorSelf(entity: CrawlEntity): CensoredSelfCrawlEntity {
	return {
		id: entity.id,
		name: entity.name,
		stats: entity.stats,
		attacks: entity.attacks,
		location: entity.location,
		graphics: entity.graphics,
		alignment: entity.alignment,
		ai: entity.ai,
		items: entity.items,
		status: entity.status
	};
}

/**
 * Checks if a given action is legal for a given entity in a given state.
 * @param state - The state in which to check the action.
 * @param entity - The entity for which to check the action.
 * @param action - The action to check.
 * @return Whether or not the action is legal.
 */
export function isValidAction(
	state: CensoredInProgressCrawlState,
	entity: CrawlEntity,
	action: Action): boolean {

	switch (action.type) {
		case "wait":
			return true;

		case "move":
			return isValidMove(state, entity, action.direction);

		case "attack":
			return entity.attacks.indexOf(action.attack) >= 0 && action.attack.uses.current > 0;

		case "item":
			return true; // TODO

		case "stairs":
			return state.floor.map.grid[entity.location.r][entity.location.c].stairs;

		default:
			unreachable(action);
	}
}

/**
 * Executes the given action for the given entity in the given state.  Action legality should first be verified with
 *     isValidAction().
 * @param state - The state in which to perform the action.
 * @param entity - The entity performing the action.
 * @param action - The action to execute.
 * @return A promise for a crawl state after the action was executed.
 */
function execute(
	state: InProgressCrawlState,
	entity: CrawlEntity,
	action: Action,
	eventLog: LogEvent[],
	mapUpdates: MapUpdate[]): CrawlState {
	let result: CrawlState = undefined;

	switch (action.type) {
		case "move":
			result = executeMove(state, entity, action, eventLog);
			break;

		case "attack":
			result = executeAttack(state, entity, action, eventLog);
			break;

		case "item":
			result = executeItem(state, entity, action, eventLog);
			break;

		case "stairs":
			result = executeStairs(state, entity, action, eventLog, mapUpdates);
			break;

		case "wait":
			result = executeWait(state, entity, action, eventLog);
			break;

		default:
			unreachable(action);
			break;
	}

	return postExecute(result, entity, eventLog, mapUpdates);
}

/**
 * Gets run after an action is executed.  Checks, among other things, for defeated entities.
 * @param state - The state to check.
 * @param entity - The last entity to perform an action.
 * @return The state after these checks.
 */
function postExecute(state: CrawlState, entity: CrawlEntity, eventLog: LogEvent[], mapUpdates: MapUpdate[]): CrawlState {
	if (utils.isCrawlOver(state)) {
		return state;
	}

	for (let i = 0; i < entity.status.length; i++) {
		switch (entity.status[i]) {
			case StatusCondition.CONFUSED:
			case StatusCondition.SHORT_CIRCUITED:
			case StatusCondition.POISONED:
				if (Math.random() < .125) {
					propagateLogEvent(state, {
						type: "status_recovery",
						entity: {
							id: entity.id,
							name: entity.name,
							graphics: entity.graphics
						},
						status: entity.status[i]
					}, eventLog);

					entity.status.splice(i, 1);
					i--;
				}
				break;
		}
	}

	if (entity.stats.energy.current === 0) {
		entity.stats.hp.current--;
	}

	let newState = state as InProgressCrawlState;

	newState.entities.filter((entity) => entity.stats.hp.current <= 0)
		.forEach((entity) => {
			let items = entity.items.held.items;

			if (entity.items.bag !== undefined) {
				items = items.concat(entity.items.bag.items);
			}

			for (let item of entity.items.held.items) {
				if (item.handlers.entityDefeat !== undefined) {
					item.handlers.entityDefeat(entity, state, item, true, eventLog);
					if (entity.stats.hp.current > 0) {
						return;
					}
				}
			}

			if (entity.items.bag !== undefined) {
				for (let item of entity.items.bag.items) {
					if (item.handlers.entityDefeat !== undefined) {
						item.handlers.entityDefeat(entity, state, item, false, eventLog);
						if (entity.stats.hp.current > 0) {
							return;
						}
					}
				}
			}
		});

	newState.entities.filter((entity) => entity.stats.hp.current <= 0)
		.forEach((entity) => {
			propagateLogEvent(newState, {
				type: "defeat",
				entity: {
					id: entity.id,
					name: entity.name,
					graphics: entity.graphics
				},
				location: entity.location
			}, eventLog);
			entity.items.held.items.forEach((item) => {
				executeItemDrop(newState, entity.location, item);
			});
		});

	newState.entities = newState.entities.filter((entity) => entity.stats.hp.current > 0);
	newState.entities.forEach((entity) => updateFloorMap(newState, entity, mapUpdates));

	return newState;
}

/**
 * Executes a wait action.
 * @param state - The state.
 * @param entity - The entity.
 * @param action - The action.
 * @return A promise for the state after performing the action.
 */
function executeWait(
	state: InProgressCrawlState,
	entity: CrawlEntity,
	action: WaitAction,
	eventLog: LogEvent[]): CrawlState {
	drainEnergyAndRecoverHp(entity, 1, 1);

	return state;
}

/**
 * Executes a move action.
 * @param state - The state.
 * @param entity - The entity.
 * @param action - The action.
 * @return A promise for the state after performing the action.
 */
function executeMove(
	state: InProgressCrawlState,
	entity: CrawlEntity,
	action: MoveAction,
	eventLog: LogEvent[]): CrawlState {
	let start = entity.location;

	if (!isValidMove(state, entity, action.direction)) {
		return state;
	}

	let offset: [number, number] = utils.decodeDirection(action.direction);
	let location = { r: entity.location.r + offset[0], c: entity.location.c + offset[1] };

	entity.location = location;

	propagateLogEvent(state, {
		type: "move",
		entity: {
			id: entity.id,
			name: entity.name,
			graphics: entity.graphics
		},
		start: start,
		end: entity.location,
		direction: action.direction
	}, eventLog);

	drainEnergyAndRecoverHp(entity, 2, 0.25);

	return executeItemPickup(state, entity, eventLog);
}

/**
 * Executes an item pickup action.
 * @param state - The state.
 * @param entity - The entity.
 * @param action - The action.
 * @return A promise for the state after performing the action.
 */
function executeItemPickup(state: InProgressCrawlState, entity: CrawlEntity, eventLog: LogEvent[]): CrawlState {
	let item = utils.getItemAtCrawlLocation(state, entity.location);

	if (item !== undefined) {
		if (item.handlers.pickup !== undefined && !item.handlers.pickup(entity, state, item, eventLog)) {
			return state;
		}

		if (entity.items.bag !== undefined && entity.items.bag.items.length < entity.items.bag.capacity) {
			propagateLogEvent(state, {
				type: "item_pickup",
				entity: {
					id: entity.id,
					name: entity.name,
					graphics: entity.graphics
				},
				item: item
			}, eventLog);
			entity.items.bag.items.push(item);
			state.items = state.items.filter((it) => it !== item);
		} else if (entity.items.held.items.length < entity.items.held.capacity) {
			propagateLogEvent(state, {
				type: "item_pickup",
				entity: {
					id: entity.id,
					name: entity.name,
					graphics: entity.graphics
				},
				item: item
			}, eventLog);
			entity.items.held.items.push(item);
			state.items = state.items.filter((it) => it !== item);
		} else {
			return state;
		}
	}

	return state;
}

/**
 * Executes an item drop action.
 * @param state - The state.
 * @param location - The location near which to drop the item.
 * @param item - The item to drop.
 * @return The state after performing the action.
 */
function executeItemDrop(state: InProgressCrawlState, location: CrawlLocation, item: Item): CrawlState {
	let loc = { r: location.r, c: location.c };

	for (let i = 0; i < Math.max(state.floor.map.width, state.floor.map.height); i++) {
		for (let [dr, dc, di] of [[-1, 0, 0], [0, 1, 0], [1, 0, 1], [0, -1, 1]]) {
			for (let j = 0; j < 2 * i + di; j++) {
				if (utils.getTile(state.floor.map, loc).type === DungeonTileType.FLOOR
					&& utils.getItemAtCrawlLocation(state, loc) === undefined) {
					let crawlItem = Object.assign(item, { location: loc });
					state.items.push(crawlItem);
					return state;
				}
				loc.r += dr;
				loc.c += dc;
			}
		}
	}
}

/**
 * Executes an item throw action.
 * @param state - The state.
 * @param entity - The entity throwing the item.
 * @param direction - The direction in which the item is being thrown.
 * @param item - The item being thrown.
 * @return The state after the item is thrown.
 */
function executeItemThrow(state: InProgressCrawlState, entity: CrawlEntity, direction: number, item: Item, eventLog: LogEvent[]): CrawlState {
	let target: CrawlLocation;

	if (item.handlers.throwTarget !== undefined) {
		target = item.handlers.throwTarget(entity, state, item, direction);
	} else {
		// Default: straight line
		let dirArr = utils.decodeDirection(direction);
		let lastLoc = { r: entity.location.r, c: entity.location.c };
		let loc = { r: entity.location.r + dirArr[0], c: entity.location.c + dirArr[1] };

		while (utils.getTile(state.floor.map, loc).type !== DungeonTileType.WALL) {
			lastLoc = loc;
			loc = { r: loc.r + dirArr[0], c: loc.c + dirArr[1] };

			if (utils.getEntityAtCrawlLocation(state, lastLoc) !== undefined) {
				break;
			}
		}

		target = lastLoc;
	}

	if ((target.r === entity.location.r && target.c === entity.location.c)
			|| (utils.getEntityAtCrawlLocation(state, target) === undefined)
			|| (item.handlers.collide === undefined)) {
		// Item falls to the ground
		eventLog.push({
			type: "item_throw",
			entity: {
				id: entity.id,
				name: entity.name,
				graphics: entity.graphics
			},
			item,
			from: entity.location,
			to: target,
			direction
		});

		eventLog.push({
			type: "item_fall",
			item
		});

		executeItemDrop(state, target, item);
	} else {
		// Item collides with an entity
		item.handlers.collide(utils.getEntityAtCrawlLocation(state, target), state, item, eventLog);
	}

	return state;
}

/**
 * Checks if a move action is legal.
 * @param state - The state.
 * @param entity - The entity.
 * @param direciton - The direction in which to move.
 * @return Whether or not the action is legal.
 */
export function isValidMove(
	state: CensoredInProgressCrawlState,
	entity: CrawlEntity,
	direction: number): boolean {
	if (entity.status.indexOf(StatusCondition.SHORT_CIRCUITED) >= 0) {
		return false;
	}

	let offset: [number, number] = utils.decodeDirection(direction);
	let location = { r: entity.location.r + offset[0], c: entity.location.c + offset[1] };

	if (!utils.isCrawlLocationInFloorMap(state.floor.map, location)) {
		return false;
	}

	if (!utils.isCrawlLocationEmpty(state, location)) {
		return false;
	}

	if (state.floor.map.grid[location.r][location.c].type === DungeonTileType.WALL) {
		return false;
	}

	let startInCooridor = !utils.isCrawlLocationInRoom(state.floor.map, entity.location);
	let endInCooridor = !utils.isCrawlLocationInRoom(state.floor.map, location);

	if (direction % 2 === 1 && (startInCooridor || endInCooridor)) {
		return false;
	}

	return true;
}

/**
 * Executes an attack action.
 * @param state - The state.
 * @param entity - The entity.
 * @param action - The action.
 * @return A promise for the state after performing the action.
 */
function executeAttack(
	state: InProgressCrawlState,
	entity: CrawlEntity,
	action: AttackAction,
	eventLog: LogEvent[]): CrawlState {
	action.attack.uses.current--;

	propagateLogEvent(state, {
		type: "attack",
		entity: {
			id: entity.id,
			name: entity.name,
			graphics: entity.graphics
		},
		location: entity.location,
		direction: action.direction,
		attack: action.attack
	}, eventLog);

	let targets = getTargets(state, entity, action.direction, action.attack.target);

	targets.forEach((target) => applyAttack(state, action.attack, entity, target, eventLog));

	drainEnergyAndRecoverHp(entity, 3, 0);

	return state;
}

/**
 * Retreives the targets for an attack.
 * @param state - The state.
 * @param attacker - The attacking entity.
 * @param direction - The direction that the attacker is facing.
 * @param selector - The attack's target selector.
 * @return A list of crawl entities targeted by the attack.
 */
export function getTargets(
	state: InProgressCrawlState,
	attacker: CrawlEntity,
	direction: number,
	selector: TargetSelector): CrawlEntity[];
export function getTargets(
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
			unreachable(selector);
	}
}

/**
 * Applies an attack to a single entity.
 * @param state - The state.
 * @param attack - The attack being performed.
 * @param attacker - The attacking entity.
 * @param defender - The defending entity.
 */
function applyAttack(
	state: InProgressCrawlState,
	attack: Attack,
	attacker: CrawlEntity,
	defender: CrawlEntity,
	eventLog: LogEvent[]): void {
	if (attack.accuracy !== "always" && Math.random() * 100 > attack.accuracy) {
		propagateLogEvent(state, {
			type: "miss",
			entity: {
				id: defender.id,
				name: defender.name,
				graphics: defender.graphics
			},
			location: defender.location,
		}, eventLog);
		return; // move missed
	}

	if (attack.power !== undefined) {
		let damage = computeDamage(attacker, defender, attack);
		defender.stats.hp.current -= damage;

		propagateLogEvent(state, {
			type: "stat",
			entity: {
				id: defender.id,
				name: defender.name,
				graphics: defender.graphics
			},
			location: defender.location,
			stat: "hp",
			change: -damage
		}, eventLog);
	}

	attack.onHit.forEach((effect: SecondaryEffect) => {
		switch (effect.type) {
			case "stat":
				switch (effect.stat) {
					case "attack":
						defender.stats.attack.modifier += effect.amount;
						break;

					case "defense":
						defender.stats.defense.modifier += effect.amount;
						break;

					default:
						unreachable(effect.stat);
				}

				propagateLogEvent(state, {
					type: "stat",
					entity: {
						id: defender.id,
						name: defender.name,
						graphics: defender.graphics
					},
					location: defender.location,
					stat: effect.stat,
					change: effect.amount
				}, eventLog);
				break;

			case "heal":
				propagateLogEvent(state, {
					type: "stat",
					entity: {
						id: defender.id,
						name: defender.name,
						graphics: defender.graphics
					},
					location: defender.location,
					stat: "hp",
					change: effect.amount
				}, eventLog);

				defender.stats.hp.current = Math.min(defender.stats.hp.current + effect.amount, defender.stats.hp.max);
				break;
		}
	});
}

/**
 * Computes the damage for an attack.
 * @param attacker - The attacking entity.
 * @param defender - The defending entity.
 * @param attack - The attack being used.
 * @return The resulting damage on the defender.
 */
function computeDamage(attacker: Entity, defender: Entity, attack: Attack): number {
	let a = getModifiedStat(attacker.stats.attack) + attack.power;
	let b = attacker.stats.level;
	let c = getModifiedStat(defender.stats.defense);
	let d = ((a - c) / 8) + (b * 2 / 3);

	if (d < 0) {
		return 0;
	}

	let baseDamage = (((d * 2) - c) + 10) + ((d * d) / 20);
	let multiplier = (Math.random() * 2 + 7) / 8;
	return Math.round(baseDamage * multiplier);
}

/**
 * Retreives a stat, as modified by stat modifiers.
 * @param stat - The stat to retrieve.
 * @return The modified stat.
 */
function getModifiedStat(stat: BaseModifierStat): number {
	let multiplier = 1;

	if (stat.modifier > 0) {
		multiplier = 2 - Math.pow(0.75, stat.modifier);
	} else if (stat.modifier < 0) {
		multiplier = Math.pow(0.75, -stat.modifier);
	}

	return stat.base * multiplier;
}

/**
 * Executes an item action.
 * @param state - The state.
 * @param entity - The entity.
 * @param action - The action.
 * @return A promise for the state after performing the action.
 */
function executeItem(
	state: InProgressCrawlState,
	entity: CrawlEntity,
	action: ItemAction,
	eventLog: LogEvent[]): CrawlState {
	let item: Item;
	let held: boolean;

	for (let it of entity.items.held.items) {
		if (action.item === it.id) {
			item = it;
			held = true;
			break;
		}
	}

	if (entity.items.bag !== undefined) {
		for (let it of entity.items.bag.items) {
			if (action.item === it.id) {
				item = it;
				held = false;
				break;
			}
		}
	}

	if (item === undefined) {
		return state;
	}

	switch (action.action) {
		case "use":
			item.handlers.use(entity, state, item, held, eventLog);
			if (held) {
				entity.items.held.items = entity.items.held.items.filter((it) => it.id !== item.id);
			} else {
				entity.items.bag.items = entity.items.bag.items.filter((it) => it.id !== item.id);
			}
			break;

		case "throw":
			if (held) {
				entity.items.held.items = entity.items.held.items.filter((it) => it.id !== item.id);
			} else {
				entity.items.bag.items = entity.items.bag.items.filter((it) => it.id !== item.id);
			}
			executeItemThrow(state, entity, action.direction, item, eventLog);
			break;

		case "drop":
			if (held) {
				entity.items.held.items = entity.items.held.items.filter((it) => it.id !== item.id);
			} else {
				entity.items.bag.items = entity.items.bag.items.filter((it) => it.id !== item.id);
			}
			executeItemDrop(state, entity.location, item);
			propagateLogEvent(state, {
				type: "item_drop",
				entity: {
					id: entity.id,
					name: entity.name,
					graphics: entity.graphics
				},
				item
			}, eventLog);
			break;

		case "equip":
			entity.items.bag.items = entity.items.bag.items.filter((it) => it !== item);
			entity.items.held.items.push(item);
			break;

		case "unequip":
			entity.items.held.items = entity.items.held.items.filter((it) => it !== item);
			entity.items.bag.items.push(item);
			break;

		default:
			unreachable(action.action);
			break;
	}

	drainEnergyAndRecoverHp(entity, 1, 0.5);

	return state;
}

function drainEnergyAndRecoverHp(entity: CrawlEntity, energyDrain: number, hpRecoverProbability: number): void {
	if (entity.stats.hp.current > 0 && entity.stats.energy.current > 0) {
		if (entity.status.indexOf(StatusCondition.POISONED) >= 0) {
			entity.stats.hp.current = Math.max(0, entity.stats.hp.current - 1);
		} else if (Math.random() < hpRecoverProbability) {
			entity.stats.hp.current = Math.min(entity.stats.hp.current + 1, entity.stats.hp.max);
		}
		entity.stats.energy.current = Math.max(0, entity.stats.energy.current - energyDrain);
	}
}

/**
 * Executes a stairs action.
 * @param state - The state.
 * @param entity - The entity.
 * @param action - The action.
 * @return The promise for the state after performing the action.
 */
function executeStairs(state: InProgressCrawlState,
	entity: CrawlEntity,
	action: StairsAction,
	eventLog: LogEvent[],
	mapUpdates: MapUpdate[]): CrawlState {
	if (state.floor.map.grid[entity.location.r][entity.location.c].stairs) {
		propagateLogEvent(state, {
			type: "stairs",
			entity: {
				name: entity.name,
				id: entity.id,
				graphics: entity.graphics
			}
		}, eventLog);

		// state.entities.forEach((entity) => entity.controller.wait());

		let advancers = state.entities.filter((entity) => !entity.ai);
		return advanceToFloor(state.dungeon, state.floor.number + 1, advancers, eventLog, mapUpdates);
	}

	return state;
}

/**
 * Delivers a log event to all entities that should receive it (usually based on location and/or alignment).
 * @param state - The state.
 * @param event - The event.
 */
export function propagateLogEvent(state: InProgressCrawlState, event: LogEvent, eventLog: LogEvent[]): void {
	switch (event.type) {
		case "wait":
		case "attack":
		case "stat":
		case "miss":
			if (state.entities.some((entity) => !entity.ai && utils.isObjectVisible(state.floor.map, entity.location, event.location))) {
				eventLog.push(event);
			}
			break;

		case "move":
			if (state.entities.some((entity) => !entity.ai && (utils.isObjectVisible(state.floor.map, entity.location, event.start) || utils.isObjectVisible(state.floor.map, entity.location, event.end)))) {
				eventLog.push(event);
			}
			break;

		case "start":
		case "stairs":
		case "defeat":
		case "message":
		case "item_pickup":
		case "item_drop":
		case "item_throw":
		case "item_fall":
		case "status_affliction":
		case "status_recovery":
			eventLog.push(event);
			break;

		default:
			unreachable(event);
	}
}

/**
 * Updates an entity's map by doing a floodfill to discover new tiles.
 * @param state - The state.
 * @param entity - The entity.
 */
function updateFloorMap(state: InProgressCrawlState, entity: CrawlEntity, mapUpdates: MapUpdate[]): void {
	// Do a floodfill to find all locations that need to be added

	let entityGrid = entity.map.grid;
	let isAi = entity.ai;
	let location = entity.location;

	let queue: Queue<CrawlLocation> = new Queue<CrawlLocation>();

	for (let r = location.r - 3; r <= location.r + 3; r++) {
		for (let c = location.c - 3; c <= location.c + 3; c++) {
			if (utils.inRange(r, 0, state.floor.map.height) && utils.inRange(c, 0, state.floor.map.width) && entityGrid[r][c].type === DungeonTileType.UNKNOWN) {
				if (!isAi) {
					mapUpdates.push({ location: { r, c }, tile: state.floor.map.grid[r][c] });
				}
				entityGrid[r][c] = state.floor.map.grid[r][c];
				queue.add({ r, c });
			}
		}
	}

	while (queue.size > 0) {
		let loc = queue.poll();

		if (state.floor.map.grid[loc.r][loc.c].type !== DungeonTileType.WALL
			&& utils.inSameRoom(state.floor.map, loc, entity.location)) {
			// Keep on expanding
			for (let r = loc.r - 3; r <= loc.r + 3; r++) {
				for (let c = loc.c - 3; c <= loc.c + 3; c++) {
					if (utils.inRange(r, 0, state.floor.map.height) && utils.inRange(c, 0, state.floor.map.width) && entityGrid[r][c].type === DungeonTileType.UNKNOWN) {
						if (!isAi) {
							mapUpdates.push({ location: { r, c }, tile: state.floor.map.grid[r][c] });
						}
						entityGrid[r][c] = state.floor.map.grid[r][c];
						queue.add({ r, c });
					}
				}
			}
		}
	}
}

/**
 * Used for asserting that all cases should be handled.
 * @throws An error stating that the case is invalid.
 */
export function unreachable(arg: never): never {
	throw new Error(`Reached default case of exhaustive switch.`);
}
