"use strict";

import * as shortid     from "shortid";

import * as printer     from "./printer";
import * as utils       from "../../common/utils";

const log = require("beautiful-log")("dungeonkit:generator");

/*
 * Generates a new crawl state on the given floor of the given dungeon with the given entities.
 * @param dungeon - The dungeon.
 * @param floor - The floor number.
 * @param blueprint - The floor blueprint.
 * @param entities - A list of entites to place on the floor.  These entities are all treated as a single group and are
 *     placed near each other, regardless of alignment.
 * @return A new crawl state on the generated floor.
 */
export function generateFloor(
	dungeon: Dungeon,
	floor: number,
	blueprint: FloorBlueprint,
	entities: UnplacedCrawlEntity[]): InProgressCrawlState {
	let state: InProgressCrawlState;

	switch (blueprint.type) {
		case "generated":
				let map = generateFloorMap(blueprint.generatorOptions);
				map = placeStairs(map);
				state = initializeState(dungeon, floor, map);
				state = placeEntityGroup(state, entities);
				state = placeEnemies(state, blueprint);
				state = placeItems(state, blueprint);
				break;

		case "static":
				state = initializeState(dungeon, floor, blueprint.map);

				for (let entity of entities) {
					let map: FloorMap = {
						width: state.floor.map.width,
						height: state.floor.map.height,
						grid: utils.tabulate((row) =>
							utils.tabulate((col) =>
								({ type: DungeonTileType.UNKNOWN }),
								state.floor.map.width),
							state.floor.map.height)
					};
					state.entities.push(Object.assign(wrap(entities.pop()), { location: blueprint.playerLocation, map }));
				}

				for (let enemy of blueprint.enemies) {
					let map: FloorMap = {
						width: state.floor.map.width,
						height: state.floor.map.height,
						grid: utils.tabulate((row) =>
							utils.tabulate((col) =>
								({ type: DungeonTileType.UNKNOWN }),
								state.floor.map.width),
							state.floor.map.height)
					};
					state.entities.push(Object.assign(wrap(generateEnemy(enemy.blueprint)), { location: enemy.location, map }));
				}

				for (let item of blueprint.items) {
					state.items.push(Object.assign({ id: shortid.generate(), location: item.location }, item.blueprint));
				}

				break;

		default:
			return unreachable(blueprint);
	}

	for (let item of state.items) {
		if (item.name === "Salt") {
			item.amount = Math.floor(Math.random() * 1280) + 1;
		}
	}

	return state;
}

/*
 * Generates a new map.
 * @param options - The generator parameters.
 * @return The generated map.
 */
function generateFloorMap(options: GeneratorOptions): FloorMap {
	let open = 0;
	let width = evaluateDistribution(options.width);
	let height = evaluateDistribution(options.height);
	let roomId = 1;

	let grid: number[][] = utils.tabulate((i) => utils.tabulate((j) => 0, width), height);
	// in this grid
	//    0 is unassigned
	//    anything lower is a room (id = -value)
	//    9 is open (corridor)
	//    10 is wall
	//    1 is a right connection on a room
	//    2 ... top
	//    3 ... left
	//    4 ... bottom
	//    5 is a right connection on a corridor
	//    6 ... top
	//    7 ... left
	//    8 ... bottom

	let init = selectFeature(options.features.rooms);

	let r = utils.randint(0, height - init.height);
	let c = utils.randint(0, width - init.width);

	let choices = placeFeature(grid, {r, c}, init, roomId);

	roomId++;

	for (let t = 0; t < options.limit; t++) {
		let {r, c} = choices[utils.randint(0, choices.length - 1)];

		if (0 < grid[r][c] && grid[r][c] < 9) {
			let placed: boolean = false;
			let feature: Feature = undefined;
			let isRoom: boolean = false;

			if (grid[r][c] < 5 || Math.random() < .5) {
				feature = selectFeature(options.features.corridors);
			} else {
				feature = selectFeature(options.features.rooms);
				isRoom = true;
			}

			for (let i = 0; i < feature.height; i++) {
				for (let j = 0; j < feature.width; j++) {
					if (canPlaceFeature(grid, {r: r - i, c: c - j}, feature, isRoom)) {
						choices =
							choices.concat(placeFeature(grid, {r: r - i, c: c - j}, feature, isRoom ? roomId++ : 0));
						placed = true;
						break;
					}
				}

				if (placed) {
					break;
				}
			}
		}
	}

	for (let i = 0; i < grid.length; i++) {
		for (let j = 0; j < grid[i].length; j++) {
			if (grid[i][j] === 9) {
				let adjacent = 0;

				for (let di = -1; di <= 1; di++) {
					for (let dj = -1; dj <= 1; dj++) {
						if (Math.abs(di) + Math.abs(dj) !== 1
							|| i + di < 0
							|| i + di > grid.length
							|| j + dj < 0
							|| j + dj > grid[i + di].length) {
							continue;
						}

						if (grid[i + di][j + dj] === 9 || grid[i + di][j + dj] < 0) {
							adjacent++;
						}
					}
				}

				if (adjacent <= 1 && Math.random() < options.cleanliness) {
					grid[i][j] = 10;
					i--;
					j--;
				}
			}
		}
	}

	return gridToFloorMap(grid);
}

/**
 * Initializes a state object.
 * @param dungeon - The dungeon.
 * @param floor - The floor number.
 * @param map - The map.
 * @return The state object.
 */
function initializeState(
	dungeon: Dungeon,
	floor: number,
	map: FloorMap): InProgressCrawlState {
	return {
		dungeon,
		floor: {
			map,
			number: floor
		},
		items: [],
		entities: []
	};
}

/**
 * Places a group of entities.  A random location is chosen in a room for the first entity, and other entities are
 *     placed within the same room spiraling out from the first entity.
 * @param state - The state.
 * @param entities - The entities to place.
 * @returns The state with the entities placed.
 */
function placeEntityGroup(state: InProgressCrawlState, entities: UnplacedCrawlEntity[]): InProgressCrawlState {
	let map: FloorMap = {
		width: state.floor.map.width,
		height: state.floor.map.height,
		grid: utils.tabulate((row) =>
			utils.tabulate((col) =>
				({ type: DungeonTileType.UNKNOWN }),
				state.floor.map.width),
			state.floor.map.height)
	};

	let location: CrawlLocation;

	do {
		location = {
			r: utils.randint(0, state.floor.map.height - 1),
			c: utils.randint(0, state.floor.map.width - 1)
		};
	} while (!(utils.isCrawlLocationInRoom(state.floor.map, location) && utils.isCrawlLocationEmpty(state, location)));

	let loc = { r: location.r, c: location.c };
	for (let i = 0; i < Math.max(state.floor.map.width, state.floor.map.height); i++) {
		for (let [dr, dc, di] of [[-1, 0, 0], [0, 1, 0], [1, 0, 1], [0, -1, 1]]) {
			for (let j = 0; j < 2 * i + di; j++) {
				if (utils.getTile(state.floor.map, loc).type === DungeonTileType.FLOOR
					&& utils.inSameRoom(state.floor.map, location, loc)
					&& utils.isCrawlLocationEmpty(state, loc)) {
					state.entities.push(Object.assign(wrap(entities.pop()), { location: { r: loc.r, c: loc.c }, map }));
					if (entities.length === 0) {
						return state;
					}
				}
				loc.r += dr;
				loc.c += dc;
			}
		}
	}

	// We need to do something with the remaining entities... let's try again.
	return placeEntityGroup(state, entities);
}

/**
 * Places the enemies for a floor.
 * @param state - The state.
 * @param blueprint - The floor blueprint.
 * @return The state with the entities placed.
 */
function placeEnemies(
	state: InProgressCrawlState,
	blueprint: GeneratedFloorBlueprint): InProgressCrawlState {
	blueprint.enemies.forEach((enemyBlueprint) => {
		let count = evaluateDistribution(enemyBlueprint.density);

		for (let i = 0; i < count; i++) {
			placeEntityGroup(state, [generateEnemy(enemyBlueprint)]);
		}
	});

	return state;
}

/**
 * Generates an enemy from a blueprint.
 * @param enemyBlueprint - The blueprint from which to generate the enemy.
 * @return The generated enemy.
 */
function generateEnemy(enemyBlueprint: EntityBlueprint): WrappedUnplacedCrawlEntity {
	return wrap({
		name: enemyBlueprint.name,
		graphics: enemyBlueprint.graphics,
		id: shortid.generate(),
		attacks: enemyBlueprint.attacks
			.sort((a, b) => Math.random() * b.weight - Math.random() * a.weight)
			.slice(0, 4)
			.map((attackBlueprint) => ({
				name: attackBlueprint.attack.name,
				animation: attackBlueprint.attack.animation,
				description: attackBlueprint.attack.description,
				target: Object.assign({}, attackBlueprint.attack.target),
				accuracy: attackBlueprint.attack.accuracy,
				power: attackBlueprint.attack.power,
				uses: Object.assign({}, attackBlueprint.attack.uses),
				onHit: attackBlueprint.attack.onHit.map((effect) => Object.assign({}, effect))
			})),
		stats: {
			level: enemyBlueprint.stats.level,
			attack: { base: enemyBlueprint.stats.attack.base, modifier: 0 },
			defense: { base: enemyBlueprint.stats.defense.base, modifier: 0 },
			hp: { max: enemyBlueprint.stats.hp.max, current: enemyBlueprint.stats.hp.current },
			energy: { max: enemyBlueprint.stats.energy.max, current: enemyBlueprint.stats.energy.current }
		},
		alignment: 0,
		ai: true,
		items: {
			held: { capacity: 1, items: [] }
		},
		status: [],
		attributes: [],
		salt: 0
	});
}

/**
 * Places the items for a floor.
 * @param state - The state.
 * @param blueprint - The floor blueprint.
 * @return The state with the items placed.
 */
function placeItems(
	state: InProgressCrawlState,
	blueprint: GeneratedFloorBlueprint): InProgressCrawlState {
	blueprint.items.forEach((itemBlueprint) => {
		let count = evaluateDistribution(itemBlueprint.density);

		for (let i = 0; i < count; i++) {
			let location: CrawlLocation;

			do {
				location = {
					r: utils.randint(0, state.floor.map.height),
					c: utils.randint(0, state.floor.map.width)
				};
			} while (!utils.isCrawlLocationInRoom(state.floor.map, location)
				|| utils.getItemAtCrawlLocation(state, location) !== undefined);

			let item: CrawlItem = Object.assign({ id: shortid.generate(), location }, itemBlueprint.item);
			state.items.push(item);
		}
	});

	return state;
}

/**
 * Selects a feature to place in the map.
 * @param features - The list of features that can be placed.  Must be nonempty.
 * @return The feature selected for placement.
 */
function selectFeature(features: Feature[]): Feature {
	let sum = features.map((feature) => feature.weight).reduce((a, b) => a + b, 0);
	let v = Math.random() * sum;

	for (let i = 0; i < features.length; i++) {
		v -= features[i].weight;

		if (v <= 0) {
			return features[i];
		}
	}

	return features[features.length - 1];
}

/**
 * Checks if a given feature can be placed in the grid at the given location.
 * @param grid - The current grid.
 * @param location - The location to place the feature.
 * @param feature - The feature to place.
 * @param isRoom - Whether or not the feature is a room.
 * @return Whether or not the feature can be placed in that location.
 */
function canPlaceFeature(
	grid: number[][],
	location: CrawlLocation,
	feature: Feature,
	isRoom: boolean): boolean {
	let matched: boolean = false;
	let { r, c } = location;

	if (r < 0 || r + feature.height >= grid.length || c < 0 || c + feature.width >= grid[0].length) {
		return false;
	}

	for (let i = 0; i < feature.height; i++) {
		for (let j = 0; j < feature.width; j++) {
			if (grid[r + i][c + j] === 0) {
				continue;
			}

			switch (feature.grid[i][j]) {
				case "#":
					if (grid[r + i][c + j] === 9 || grid[r + i][c + j] < 0) {
						return false;
					}
					break;

				case ">":
					if (isRoom && grid[r + i][c + j] !== 7) {
						return false;
					}

					if (!isRoom && grid[r + i][c + j] !== 3 && grid[r + i][c + j] !== 7) {
						return false;
					}

					if (grid[r + i][c + j] === 3 || grid[r + i][c + j] === 7) {
						matched = true;
					}
					break;

				case "^":
					if (isRoom && grid[r + i][c + j] !== 8) {
						return false;
					}

					if (!isRoom && grid[r + i][c + j] !== 4 && grid[r + i][c + j] !== 8) {
						return false;
					}

					if (grid[r + i][c + j] === 4 || grid[r + i][c + j] === 8) {
						matched = true;
					}
					break;

				case "<":
					if (isRoom && grid[r + i][c + j] !== 5) {
						return false;
					}

					if (!isRoom && grid[r + i][c + j] !== 1 && grid[r + i][c + j] !== 5) {
						return false;
					}

					if (grid[r + i][c + j] === 1 || grid[r + i][c + j] === 5) {
						matched = true;
					}
					break;

				case "v":
					if (isRoom && grid[r + i][c + j] !== 6) {
						return false;
					}

					if (!isRoom && grid[r + i][c + j] !== 2 && grid[r + i][c + j] !== 6) {
						return false;
					}

					if (grid[r + i][c + j] === 2 || grid[r + i][c + j] === 6) {
						matched = true;
					}
					break;

				case " ":
					return false;
			}
		}
	}

	return matched;
}

/**
 * Places a feature in the grid.
 * @param grid - The current grid.
 * @param location - The location to place the feature.
 * @param feature - The feature to place.
 * @param roomId - The room ID of the feature being placed.
 * @return An array of locations at which future features can be placed.
 */
function placeFeature(
	grid: number[][],
	location: CrawlLocation,
	feature: Feature,
	roomId: number): CrawlLocation[] {
	let { r, c } = location;
	let choices: CrawlLocation[] = [];

	for (let i = 0; i < feature.height; i++) {
		for (let j = 0; j < feature.width; j++) {
			switch (feature.grid[i][j]) {
				case "#":
					grid[r + i][j + c] = 10;
					break;

				case ">":
					if (grid[r + i][j + c] === 0) {
						grid[r + i][j + c] = (roomId > 0) ? 1 : 5;
						choices.push({r: r + i, c: j + c});
					} else {
						grid[r + i][j + c] = 9;
					}
					break;

				case "^":
					if (grid[r + i][j + c] === 0) {
						grid[r + i][j + c] = (roomId > 0) ? 2 : 6;
						choices.push({r: r + i, c: j + c});
					} else {
						grid[r + i][j + c] = 9;
					}
					break;

				case "<":
					if (grid[r + i][j + c] === 0) {
						grid[r + i][j + c] = (roomId > 0) ? 3 : 7;
						choices.push({r: r + i, c: j + c});
					} else {
						grid[r + i][j + c] = 9;
					}
					break;

				case "v":
					if (grid[r + i][j + c] === 0) {
						grid[r + i][j + c] = (roomId > 0) ? 4 : 8;
						choices.push({r: r + i, c: j + c});
					} else {
						grid[r + i][j + c] = 9;
					}
					break;

				case " ":
					if (roomId === 0) {
						grid[r + i][j + c] = 9;
					} else {
						grid[r + i][j + c] = -roomId - 1;
					}
					break;
			}
		}
	}

	return choices;
}

/**
 * Converts a number grid to a map.
 * @param grid - The grid of numbers to convert.
 * @return The map.
 */
function gridToFloorMap(grid: number[][]): FloorMap {
	return {
		width: grid[0].length,
		height: grid.length,
		grid: grid.map((row) => row.map(numberToTile))
	};
}

/**
 * Converts a number to a tile.
 * @param val - The number to convert.
 * @return The corresponding dungeon tile.
 */
function numberToTile(val: number): DungeonTile {
	switch (val) {
		case 0:
			return { type: DungeonTileType.WALL };
		case 10:
			return { type: DungeonTileType.WALL };
		case 9:
			return { type: DungeonTileType.FLOOR };
		default:
			if (val > 0) {
				return { type: DungeonTileType.WALL };
			} else {
				return { type: DungeonTileType.FLOOR, roomId: -(val + 1) };
			}
	}
}

/**
 * Places the stairs on a map.
 * @param map - The map on which to place the stairs.
 * @return The map with the stairs.
 */
function placeStairs(map: FloorMap): FloorMap {
	let loc: CrawlLocation;

	do {
		loc = {
			r: utils.randint(0, map.height - 1),
			c: utils.randint(0, map.width - 1)
		};
	} while (!(utils.isCrawlLocationInRoom(map, loc)));

	map.grid[loc.r][loc.c].stairs = true;
	return map;
}

/**
 * Selects a value from a distribution.
 * @param distribution - The distribution.
 * @return The selected value.
 */
function evaluateDistribution(distribution: Distribution): number {
	switch (distribution.type) {
		case "binomial":
			let v = 0;

			for (let i = 0; i < distribution.n; i++) {
				v += Math.random() < distribution.p ? 1 : 0;
			}

			return v;

		case "uniform":
			return utils.randint(distribution.a, distribution.b);

		default:
			unreachable(distribution);
	}
}

interface WrappedUnplacedCrawlEntity extends UnplacedCrawlEntity {
	wrapped: boolean;
}

/**
 * Wraps an entity in a proxy to handle equipped items.
 * @param entity - The entity to wrap.
 * @return The wrapped entity.
 */
export function wrap(entity: UnplacedCrawlEntity): WrappedUnplacedCrawlEntity {
	if (isWrapped(entity)) {
		// Don't double-wrap the entity
		return entity;
	}

	return new Proxy(entity, {
		get(target: UnplacedCrawlEntity, field: string | number | symbol): any {
			let base = entity;

			if (field === "wrapped") {
				return true;
			}

			for (let item of entity.items.held.items) {
				if (item.equip !== undefined) {
					base = item.equip(base);
				}
			}

			return (base as any)[field];
		}
	}) as WrappedUnplacedCrawlEntity;
}

/**
 * Determines if the input is a wrapped.
 * @param entity - The entity to check.
 * @return Whether or not the entity is wrapped.
 */
function isWrapped(entity: UnplacedCrawlEntity): entity is WrappedUnplacedCrawlEntity {
	return "wrapped" in entity;
}

/**
 * Used for asserting that all cases should be handled.
 * @throws An error stating that the case is invalid.
 */
function unreachable(arg: never): never {
	throw new Error(`Reached default case of exhaustive switch.`);
}