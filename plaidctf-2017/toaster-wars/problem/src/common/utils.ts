"use strict";

/**
 * Converts a direction number into a number tuple that describes the direction.
 * @param direction - The number of the direction to decode.
 * @return A number tuple describing the direction, in the form [dr, dc].
 * @throws {Error} Will throw an error if direction is not an integer.
 */
export function decodeDirection(direction: number): [number, number] {
	switch (((direction % 8) + 8) % 8) {
		case 0:
			return [0, 1];
		case 1:
			return [-1, 1];
		case 2:
			return [-1, 0];
		case 3:
			return [-1, -1];
		case 4:
			return [0, -1];
		case 5:
			return [1, -1];
		case 6:
			return [1, 0];
		case 7:
			return [1, 1];
		default:
			throw new Error(`[Code 4] ${direction} is not a valid direction.`);
	}
}

/**
 * Checks two locations for equality.
 * @param a - The first location.
 * @param b - The second location.
 * @return Whether or not the two locations are equal.
 */
export function areCrawlLocationsEqual(a: CrawlLocation, b: CrawlLocation): boolean {
	return (a.r === b.r) && (a.c === b.c);
}

/**
 * Retrieves the entity at the given location.
 * @param state - The state.
 * @param location - The location.
 * @return The entity at the given location in the given state, or undefined if no entity occupies that location.
 */
export function getEntityAtCrawlLocation(state: InProgressCrawlState,
	location: CrawlLocation): CrawlEntity | undefined;
export function getEntityAtCrawlLocation(state: CensoredInProgressCrawlState,
	location: CrawlLocation): CensoredCrawlEntity | undefined;

export function getEntityAtCrawlLocation(state: InProgressCrawlState,
	location: CrawlLocation): CrawlEntity | undefined {
	return state.entities.find((entity) => areCrawlLocationsEqual(entity.location, location));
}

/**
 * Retrieves the item at the given location.
 * @param state - The state.
 * @param location - The location.
 * @return The item at the given location in the given state, or undefined if no item occupies that location.
 */
export function getItemAtCrawlLocation(state: InProgressCrawlState, location: CrawlLocation): CrawlItem | undefined {
	return state.items.find((item) => areCrawlLocationsEqual(item.location, location));
}

/**
 * Checks if no entity is occupying the given location.
 * @param state - The state.
 * @param location - The location.
 * @return Whether or not the location is empty in the given state.
 */
export function isCrawlLocationEmpty(state: CensoredInProgressCrawlState,
	location: CrawlLocation): boolean {
	return getEntityAtCrawlLocation(state, location) === undefined;
}

/**
 * Checks if the given location is valid for the given map.
 * @param map - The map.
 * @param location - The location.
 * @return Whether or not the location is valid for the given map.
 */
export function isCrawlLocationInFloorMap(map: FloorMap, location: CrawlLocation): boolean {
	return isValidCrawlLocation(location) && location.r < map.height && location.c < map.width;
}

/**
 * Checks if the given state represents a crawl that has concluded.
 * @param state - The state.
 * @return Whether or not the crawl is over.
 */
export function isCrawlOver(state: CrawlState): state is ConcludedCrawlState {
	return "success" in state;
}

/**
 * Returns the first value so that it is within the bounds described by the other two.  In other words, if v > max,
 * returns v, if v < min, returns min, and otherwise returns v.
 * @param v - The value to bound.
 * @param min - The minimum return value.
 * @param max - The maximum return value.
 * @return The value, bounded as described.
 * @throws {RangeError} Will throw an error if min > max.
 */
export function bound(v: number, min: number, max: number): number {
	if (min > max) {
		throw new RangeError(`[Code 5] Max (${max}) is less than min (${min}).`);
	}

	if (v < min) {
		return min;
	}

	if (v > max) {
		return max;
	}

	return v;
}

/**
 * Returns a random integer between min and max, inclusive on both ends.
 * @param min - The minimum return value.
 * @param max - The maximum return value.
 * @return A random integer between minimum and maximum, inclusive on both ends.
 * @throws {RangeError} Will throw an error if min > max.
 */
export function randint(min: number, max: number): number {
	if (min > max) {
		throw new RangeError(`[Code 5] Max (${max}) is less than min (${min}).`);
	}

	return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Returns the minimum distance between two locations, allowing diagonal moves.
 * @param a - The first location.
 * @param b - The second location.
 * @return The distance between the two locations.
 */
export function distance(a: CrawlLocation, b: CrawlLocation): number {
	return Math.max(Math.abs(a.r - b.r), Math.abs(a.c - b.c));
}

/**
 * Constructs a new list with the given length using the given function to produce each element.
 * @param fn - The function used to produce the elements of the list, which must take a single parameter - the index.
 * @param length - The length of the resulting list (rounded down and set to 0 if negative).
 * @return The list.
 */
export function tabulate<T>(fn: (i: number) => T, length: number): T[] {
	let ret: T[] = [];

	length = Math.floor(length);

	for (let i = 0; i < length; i++) {
		ret.push(fn(i));
	}

	return ret;
}

/**
 * Checks if the given location is within a room in the given map.
 * @param map - The map.
 * @param location - The location.
 * @return Whether or not the location is in a room.
 */
export function isCrawlLocationInRoom(map: FloorMap, location: CrawlLocation) {
	return isCrawlLocationInFloorMap(map, location)
		&& getTile(map, location).roomId !== undefined;
}

/**
 * Checks if both given locations are in the same room in the given map.
 * @param map - The map.
 * @param a - The first location.
 * @param b - The second location.
 * @return Whether or not the two locations are in the same room.
 */
export function inSameRoom(map: FloorMap, a: CrawlLocation, b: CrawlLocation): boolean {
	return isCrawlLocationInRoom(map, a)
		&& isCrawlLocationInRoom(map, b)
		&& map.grid[a.r][a.c].roomId === map.grid[b.r][b.c].roomId;
}

/**
 * Returns whether or not the given value is within the given range, inclusive on the low side and exclusive on the high
 *     side.
 * @param v - The value to check.
 * @param min - The minimum value of the range.
 * @param max - The maximum vlaue of the range.
 * @return Whether or not v is in the range [min, max).
 */
export function inRange(v: number, min: number, max: number): boolean {
	return min <= v && v < max;
}

/**
 * Checks whether or not an object at the given location would be visible in the given map if standing at the given
 *     observation location.
 * @param map - The map.
 * @param observer - The observation location.
 * @param location - The location to check.
 * @return Whether or not the given location is visible in the given map if standing at the given observation location.
 */
export function isObjectVisible(map: FloorMap, observer: CrawlLocation, location: CrawlLocation): boolean {
	if (!isValidCrawlLocation(observer) || !isValidCrawlLocation(location)) {
		return false;
	}

	return inSameRoom(map, observer, location) || distance(observer, location) <= 2;
}

/**
 * Checks whether or not the given location is valid; that is, its row and column are both non-negative integers.
 * @param location - The location to check.
 * @return Whether or not location is valid.
 */
export function isValidCrawlLocation(location: CrawlLocation): boolean {
	return location.r >= 0 && location.c >= 0 && Number.isInteger(location.r) && Number.isInteger(location.c);
}

/**
 * Checks whether or not two entities are aligned.
 * @param a - The first entity.
 * @param b - The second entity.
 * @return Whether or not the two entities are aligned.
 */
export function areAligned(a: CensoredCrawlEntity, b: CensoredCrawlEntity): boolean {
	return a.alignment !== 0 && a.alignment === b.alignment;
}

/**
 * Retreives the tile at the given location in the given map, or an unknown tile if the location is not in the map or
 *     is invalid.
 * @param map - The map.
 * @param location - The location from which to retrieve the tile.
 * @return The tile at the given location in the map.
 */
export function getTile(map: FloorMap, location: CrawlLocation): DungeonTile {
	if (isCrawlLocationInFloorMap(map, location)) {
		return map.grid[location.r][location.c];
	}
	return { type: DungeonTileType.UNKNOWN };
}

/**
 * Transforms the given location to display coordinates.
 * @param location - The location to transform into coordinates.
 * @param gridSize - The size of each tile.
 * @return The display coordinates of the given location in the given grid size.
 */
export function locationToPoint(location: CrawlLocation, gridSize: number): Point {
	return {
		x: location.c * gridSize,
		y: location.r * gridSize
	};
}

/**
 * Returns whether or not the input is void.
 * @param v - The object to check.
 * @return Whether or not the object is void.
 */
export function isVoid<T>(v: T | void): v is void {
	return v === undefined;
}		

/**
 * Offsets a location in a given direction
 * @param location - The location of the base object
 * @param direction - The direction to offset it by
 * @return The offset location
 */ 

export function offsetLocationInDir(location: CrawlLocation, direction: number): CrawlLocation {
	let [dr, dc] = decodeDirection(direction)
	return {
		r: location.r + dr,
		c: location.c + dc,
		direction: location.direction
	}
}

/**
 * Shuffles a list
 * @param input - The list to be shuffled
 * @return The shuffled list
 */

export function shuffleList<T>(input: T[]): T[] {
	let output = input.slice()
	for (let i = 0; i < output.length; i++) {
		let dest = Math.floor(Math.random() * (output.length - i)) + i;
		let tmp = output[dest];
		output[dest] = output[i];
		output[i] = tmp;
	}
	return output;
}

/**
 * Finds the (direction) angle between two crawl locations
 * @param loc1 - The first location
 * @param loc2 - The second location
 * @requires  - loc1 and loc2 have line of sight
 * @returns - The relative direction angle
 */

export function getAngleBetween(loc1: CrawlLocation, loc2: CrawlLocation) {
	let dr = Math.sign(loc2.r - loc1.r);
	let dc = Math.sign(loc2.c - loc1.c);
	     if (dr == 0  && dc == 1 ) return 0;
	else if (dr == -1 && dc == 1 ) return 1;
	else if (dr == -1 && dc == 0 ) return 2;
	else if (dr == -1 && dc == -1) return 3;
	else if (dr == 0  && dc == -1) return 4;
	else if (dr == 1  && dc == -1) return 5;
	else if (dr == 1  && dc == 0 ) return 6;
	else if (dr == 1  && dc == 1 ) return 7;
	else throw new Error('Getting angle between overlapping locations');

}

/**
 * Checks whether two crawl locations have line of sight
 * @param loc1 - The first location
 * @param loc2 - The second location
 * @param map - The floormap
 * @return Whether or not they have line of sight
 */
export function lineOfSight(loc1: CrawlLocation, loc2: CrawlLocation, map: FloorMap): boolean {
	let dr = loc2.r - loc1.r;
	let dc = loc2.c - loc1.c;
	if (!(dr === 0 || dc === 0 || dr === dc)) {
		return false;
	}

	let testLoc = { r: loc1.r, c: loc1.c }

	for (let i = 0; i < Math.max(dr, dc); i++) {
		let tile = getTile(map, testLoc);
		if (tile.type !== DungeonTileType.FLOOR) {
			return false;
		}
		testLoc.r += Math.sign(dr);
		testLoc.c += Math.sign(dc);
	}
	return true;
}

/**
 * Gives the range [i, j)
 * @param i - The start index
 * @param j - The end index
 * @return The range [i, j)
 */

export function range(i: number, j?: number): number[] {
	if (j === undefined) {
		j = i;
		i = 0;
	}
	let output = Array(Math.abs(j-i));
	for (let idx = 0; idx < Math.abs(j-i); idx++) {
		output[idx] = i + Math.sign(j-i) * idx;
	}
	return output
}
