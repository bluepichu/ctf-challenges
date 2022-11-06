"use strict";

export let floorBlueprint: FloorBlueprint = {
	type: "generated",
	generatorOptions: {
		width: { type: "binomial", n: 10, p: 1 },
		height: { type: "binomial", n: 10, p: 1 },
		features: {
			rooms: [],
			corridors: []
		},
		limit: 0,
		cleanliness: 1
	},
	enemies: [],
	items: []
};

export let dungeon: Dungeon = {
	name: "<Dungeon Name>",
	floors: 5,
	direction: "down",
	difficulty: 1,
	blueprint: [
		{
			range: [1, 3],
			blueprint: floorBlueprint
		},
		{
			range: [4, 5],
			blueprint: floorBlueprint
		}
	],
	graphics: "<Dungeon Graphics>"
};

let X = -1;

let numberGrid: number[][] = [
	[X, X, X, X, X, X, X, X, X, X, X, X, X, X, X, X, X, X, X, X],
	[X, X, X, X, X, 2, 2, 2, 2, 2, 2, X, X, X, X, X, X, X, X, X],
	[X, X, X, X, X, 2, 2, 2, 2, 2, 2, 2, X, X, X, X, X, X, X, X],
	[X, X, X, X, X, X, 2, 2, 2, 2, 2, 2, X, X, X, X, X, X, X, X],
	[X, X, X, X, X, X, 0, X, 2, 2, 2, 2, 2, 0, 0, 0, 0, 0, X, X],
	[X, X, X, X, X, X, 0, X, X, X, 2, 2, 2, X, X, X, X, 0, X, X],
	[0, 0, 0, X, 0, 0, 0, X, X, X, X, 0, X, X, X, X, X, 0, X, X],
	[X, X, 0, X, 0, X, X, X, X, X, X, 0, X, X, X, X, X, 0, X, X],
	[X, X, 0, X, 0, X, X, X, X, X, X, 0, 0, 0, 0, 0, X, 0, X, X],
	[X, X, 0, 0, 0, X, X, X, X, X, X, X, X, X, X, 0, X, 0, X, X],
	[X, X, 0, X, X, X, X, X, 0, 0, X, X, X, X, 3, 3, 3, 3, X, X],
	[X, X, 0, X, X, X, X, X, X, 0, X, X, X, 3, 3, 3, 3, 3, 3, X],
	[X, X, 0, X, X, X, X, X, X, 0, 0, 0, 0, 3, 3, 3, 3, 3, 3, X],
	[X, X, 0, X, X, X, X, X, X, X, X, X, X, 3, 3, 3, 3, 3, 3, X],
	[X, 1, 1, 1, 1, 1, 1, X, X, X, X, X, X, 3, 3, 3, 3, 3, 3, X],
	[X, 1, 1, 1, 1, 1, 1, X, X, X, X, X, X, X, 3, 3, 3, 3, X, X],
	[X, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, X, X, X, X, X],
	[X, 1, 1, 1, 1, 1, 1, X, X, X, X, X, X, X, X, X, X, X, X, X],
	[X, 1, 1, 1, 1, 1, 1, X, X, X, X, X, X, X, X, X, X, X, X, X],
	[X, X, X, X, X, X, X, X, X, X, X, X, X, X, X, X, X, X, X, X]
];

let floorGrid: DungeonTile[][] = numberGrid.map((row, r) => row.map((cell, c) => {
	if (cell === X) {
		return { type: DungeonTileType.WALL };
	}

	return {
		type: DungeonTileType.FLOOR,
		roomId: cell === 0 ? undefined : cell,
		stairs: r === 17 && c === 2
	};
}));

export let map: FloorMap = {
	width: 20,
	height: 20,
	grid: floorGrid
};

export let item1: Item = {
	id: "<Item 1 id>",
	name: "<Item 1 name>",
	description: "<Item 1 description>",
	handlers: {},
	graphics: "<Item 1 graphics>"
};

export let item2: Item = {
	id: "<Item 2 id>",
	name: "<Item 2 name>",
	description: "<Item 2 description>",
	handlers: {},
	graphics: "<Item 2 graphics>"
};

export let item3: CrawlItem = {
	id: "<Item 3 id>",
	name: "<Item 3 name>",
	description: "<Item 3 description>",
	handlers: {},
	graphics: "<Item 3 graphics>",
	location: { r: 2, c: 6 }
};

export let item4: CrawlItem = {
	id: "<Item 4 id>",
	name: "<Item 4 name>",
	description: "<Item 4 description>",
	handlers: {},
	graphics: "<Item 4 graphics>",
	location: { r: 12, c: 16 }
};

export let bag: ItemSet = {
	capacity: 8,
	items: [item2]
};

let mockStats: EntityStats = {
	level: 1,
	hp: { max: 1, current: 1 },
	attack: { base: 1, modifier: 0 },
	defense: { base: 1, modifier: 0 },
	energy: { max: 1, current: 1 }
};

export let entity1: CrawlEntity = {
	name: "<Entity 1 name>",
	id: "<Entity 1 id>",
	stats: mockStats,
	attacks: [],
	graphics: "<Entity 1 graphics>",
	map: map,
	items: {
		held: { capacity: 1, items: [item1] },
		bag: bag
	},
	location: { r: 3, c: 7 },
	alignment: 1,
	ai: false,
	status: [],
	salt: 0,
	attributes: []
};

export let entity2: CrawlEntity = {
	name: "<Entity 2 name>",
	id: "<Entity 2 id>",
	stats: mockStats,
	attacks: [],
	graphics: "<Entity 2 graphics>",
	map: map,
	items: {
		held: { capacity: 1, items: [] },
		bag: bag
	},
	location: { r: 15, c: 3 },
	alignment: 1,
	ai: false,
	status: [],
	salt: 0,
	attributes: []
};

export let entity3: CrawlEntity = {
	name: "<Entity 3 name>",
	id: "<Entity 3 id>",
	stats: mockStats,
	attacks: [],
	graphics: "<Entity 3 graphics>",
	map: map,
	items: {
		held: { capacity: 1, items: [] }
	},
	location: { r: 13, c: 15 },
	alignment: 0,
	ai: true,
	status: [],
	salt: 0,
	attributes: []
};

export let entity4: CrawlEntity = {
	name: "<Entity 4 name>",
	id: "<Entity 4 id>",
	stats: mockStats,
	attacks: [],
	graphics: "<Entity 4 graphics>",
	map: map,
	items: {
		held: { capacity: 1, items: [] }
	},
	location: { r: 14, c: 18 },
	alignment: 0,
	ai: true,
	status: [],
	salt: 0,
	attributes: []
};

export let entity5: CrawlEntity = {
	name: "<Entity 5 name>",
	id: "<Entity 5 id>",
	stats: mockStats,
	attacks: [],
	graphics: "<Entity 5 graphics>",
	map: map,
	items: {
		held: { capacity: 1, items: [] }
	},
	location: { r: 10, c: 2 },
	alignment: 0,
	ai: true,
	status: [],
	salt: 0,
	attributes: []
};

export let entity6: CrawlEntity = {
	name: "<Entity 6 name>",
	id: "<Entity 6 id>",
	stats: mockStats,
	attacks: [],
	graphics: "<Entity 6 graphics>",
	map: map,
	items: {
		held: { capacity: 1, items: [] }
	},
	location: { r: 14, c: 3 },
	alignment: 0,
	ai: false,
	status: [],
	salt: 0,
	attributes: []
};

export let entity7: CrawlEntity = {
	name: "<Entity 7 name>",
	id: "<Entity 7 id>",
	stats: mockStats,
	attacks: [],
	graphics: "<Entity 7 graphics>",
	map: map,
	items: {
		held: { capacity: 1, items: [] }
	},
	location: { r: 6, c: 0 },
	alignment: 0,
	ai: false,
	status: [],
	salt: 0,
	attributes: []
};

export let inProgressState: InProgressCrawlState = {
	dungeon: dungeon,
	floor: {
		number: 2,
		map: map
	},
	entities: [entity1, entity2, entity3, entity4, entity5, entity6, entity7],
	items: [item3, item4]
};

export let concludedSuccessState: ConcludedCrawlState = {
	dungeon: dungeon,
	success: true,
	floor: 5
};

export let concludedFailureState: ConcludedCrawlState = {
	dungeon: dungeon,
	success: false,
	floor: 4
};