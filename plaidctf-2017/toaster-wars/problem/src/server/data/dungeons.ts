"use strict";

import { blenderStats, finalBossStats, spatulaStats }  from "./stats";

import {
	tackle,
	goldenSpatulate,
	blend,
	puree,
	spatulate
} from "./attacks";

import {
	screwdriver,
	battery,
	paprika,
	cayenne,
	turmeric,
	oregano,
	cinnamon,
	peppercorn,
	salt,
	spareParts,
	key,
	lockedBox,
	lightFlag,
	blazingFlag,
	stormyFlag,
} from "./items";

let finalBoss = {
	name: "Golden Spatula",
	graphics: "golden-spatula",
	stats: finalBossStats,
	attacks: [
		{ attack: goldenSpatulate, weight: 1 }
	]
};

let roomFeatures = [
	{
		width: 10,
		height: 10,
		weight: 10,
		grid: [
			"##^#^#####",
			"#     #^##",
			"<        #",
			"<        >",
			"<        #",
			"<        #",
			"<        >",
			"#       ##",
			"##vv#   ##",
			"#######v##"
		],
	},
	{
		width: 10,
		height: 10,
		weight: 10,
		grid: [
			"########^#",
			"###^^#   #",
			"#<       >",
			"##       #",
			"#<       >",
			"#<       >",
			"##       #",
			"<        >",
			"#        #",
			"##vv#vvv##"
		]
	},
	{
		width: 10,
		height: 8,
		weight: 3,
		grid: [
			"####^^####",
			"###    ###",
			"##      ##",
			"<        >",
			"<        >",
			"##      ##",
			"###    ###",
			"####vv####",
		]
	},
	{
		width: 10,
		height: 7,
		weight: 4,
		grid: [
			"####^^^###",
			"#^#    ###",
			"<        >",
			"<  #    ##",
			"<      ###",
			"###   ####",
			"####vv####"
		]
	}
];

let corridorFeatures = [
	{
		width: 6,
		height: 3,
		weight: 10,
		grid: [
			"######",
			"<    >",
			"######"
		]
	},
	{
		width: 3,
		height: 6,
		weight: 10,
		grid: [
			"#^#",
			"# #",
			"# #",
			"# #",
			"# #",
			"#v#"
		]
	},
	{
		width: 5,
		height: 4,
		weight: 5,
		grid: [
			"##^##",
			"<  ##",
			"##  >",
			"###v#"
		]
	},
	{
		width: 3,
		height: 3,
		weight: 3,
		grid: [
			"#^#",
			"< >",
			"#v#"
		]
	},
	{
		width: 4,
		height: 3,
		weight: 1,
		grid: [
			"####",
			"<  >",
			"####"
		]
	},
	{
		width: 3,
		height: 4,
		weight: 1,
		grid: [
			"#^#",
			"# #",
			"# #",
			"#v#"
		]
	}
];

let wl: () => DungeonTile = () => ({ type: DungeonTileType.WALL, stairs: false });
let fl: () => DungeonTile = () => ({ type: DungeonTileType.FLOOR, roomId: 1, stairs: false });
let st: () => DungeonTile = () => ({ type: DungeonTileType.FLOOR, roomId: 1, stairs: true });

let trench: Dungeon = {
	name: "Treacherous Trench",
	floors: 5,
	direction: "down",
	difficulty: 5,
	graphics: "dng-surrounded-sea",
	blueprint: [
		{
			range: [1, 1],
			blueprint: {
				type: "static",
				map: {
					width: 11,
					height: 17,
					grid: [
						[ wl(), wl(), wl(), wl(), wl(), wl(), wl(), wl(), wl(), wl(), wl() ],
						[ wl(), wl(), wl(), wl(), wl(), wl(), wl(), wl(), wl(), wl(), wl() ],
						[ wl(), wl(), fl(), fl(), fl(), fl(), fl(), fl(), fl(), wl(), wl() ],
						[ wl(), wl(), fl(), fl(), fl(), fl(), fl(), fl(), fl(), wl(), wl() ],
						[ wl(), wl(), fl(), fl(), fl(), fl(), fl(), fl(), fl(), wl(), wl() ],
						[ wl(), wl(), fl(), fl(), fl(), fl(), fl(), fl(), fl(), wl(), wl() ],
						[ wl(), wl(), fl(), fl(), fl(), fl(), fl(), fl(), fl(), wl(), wl() ],
						[ wl(), wl(), fl(), fl(), fl(), fl(), fl(), fl(), fl(), wl(), wl() ],
						[ wl(), wl(), fl(), fl(), fl(), fl(), fl(), fl(), fl(), wl(), wl() ],
						[ wl(), wl(), fl(), fl(), fl(), fl(), fl(), fl(), fl(), wl(), wl() ],
						[ wl(), wl(), fl(), fl(), fl(), fl(), fl(), fl(), fl(), wl(), wl() ],
						[ wl(), wl(), fl(), fl(), fl(), fl(), fl(), fl(), fl(), wl(), wl() ],
						[ wl(), wl(), fl(), fl(), fl(), fl(), fl(), fl(), fl(), wl(), wl() ],
						[ wl(), wl(), fl(), fl(), fl(), fl(), fl(), fl(), fl(), wl(), wl() ],
						[ wl(), wl(), fl(), fl(), fl(), st(), fl(), fl(), fl(), wl(), wl() ],
						[ wl(), wl(), wl(), wl(), wl(), wl(), wl(), wl(), wl(), wl(), wl() ],
						[ wl(), wl(), wl(), wl(), wl(), wl(), wl(), wl(), wl(), wl(), wl() ]
					]
				},
				enemies: [],
				items: [
					{ blueprint: screwdriver, location: { r: 2, c: 2} },
					{ blueprint: screwdriver, location: { r: 2, c: 3} },
					{ blueprint: screwdriver, location: { r: 2, c: 4} },
					{ blueprint: screwdriver, location: { r: 3, c: 2} },
					{ blueprint: screwdriver, location: { r: 3, c: 3} },
					{ blueprint: screwdriver, location: { r: 3, c: 4} },

					{ blueprint: paprika, location: { r: 4, c: 2} },
					{ blueprint: paprika, location: { r: 4, c: 3} },
					{ blueprint: paprika, location: { r: 4, c: 4} },
					{ blueprint: paprika, location: { r: 5, c: 2} },
					{ blueprint: paprika, location: { r: 5, c: 3} },
					{ blueprint: paprika, location: { r: 5, c: 4} },

					{ blueprint: turmeric, location: { r: 6, c: 2} },
					{ blueprint: turmeric, location: { r: 6, c: 3} },
					{ blueprint: turmeric, location: { r: 6, c: 4} },
					{ blueprint: turmeric, location: { r: 7, c: 2} },
					{ blueprint: turmeric, location: { r: 7, c: 3} },
					{ blueprint: turmeric, location: { r: 7, c: 4} },

					{ blueprint: cinnamon, location: { r: 8, c: 2} },
					{ blueprint: cinnamon, location: { r: 8, c: 3} },
					{ blueprint: cinnamon, location: { r: 8, c: 4} },
					{ blueprint: cinnamon, location: { r: 9, c: 2} },
					{ blueprint: cinnamon, location: { r: 9, c: 3} },
					{ blueprint: cinnamon, location: { r: 9, c: 4} },

					{ blueprint: salt, location: { r: 10, c: 2} },
					{ blueprint: salt, location: { r: 10, c: 3} },
					{ blueprint: salt, location: { r: 10, c: 4} },
					{ blueprint: salt, location: { r: 11, c: 2} },
					{ blueprint: salt, location: { r: 11, c: 3} },
					{ blueprint: salt, location: { r: 11, c: 4} },

					{ blueprint: salt, location: { r: 12, c: 2} },
					{ blueprint: salt, location: { r: 12, c: 3} },
					{ blueprint: salt, location: { r: 12, c: 4} },
					{ blueprint: salt, location: { r: 13, c: 2} },
					{ blueprint: salt, location: { r: 13, c: 3} },
					{ blueprint: salt, location: { r: 13, c: 4} },

					{ blueprint: battery, location: { r: 2, c: 6} },
					{ blueprint: battery, location: { r: 2, c: 7} },
					{ blueprint: battery, location: { r: 2, c: 8} },
					{ blueprint: battery, location: { r: 3, c: 6} },
					{ blueprint: battery, location: { r: 3, c: 7} },
					{ blueprint: battery, location: { r: 3, c: 8} },

					{ blueprint: cayenne, location: { r: 4, c: 6} },
					{ blueprint: cayenne, location: { r: 4, c: 7} },
					{ blueprint: cayenne, location: { r: 4, c: 8} },
					{ blueprint: cayenne, location: { r: 5, c: 6} },
					{ blueprint: cayenne, location: { r: 5, c: 7} },
					{ blueprint: cayenne, location: { r: 5, c: 8} },

					{ blueprint: oregano, location: { r: 6, c: 6} },
					{ blueprint: oregano, location: { r: 6, c: 7} },
					{ blueprint: oregano, location: { r: 6, c: 8} },
					{ blueprint: oregano, location: { r: 7, c: 6} },
					{ blueprint: oregano, location: { r: 7, c: 7} },
					{ blueprint: oregano, location: { r: 7, c: 8} },

					{ blueprint: peppercorn, location: { r: 8, c: 6} },
					{ blueprint: peppercorn, location: { r: 8, c: 7} },
					{ blueprint: peppercorn, location: { r: 8, c: 8} },
					{ blueprint: peppercorn, location: { r: 9, c: 6} },
					{ blueprint: peppercorn, location: { r: 9, c: 7} },
					{ blueprint: peppercorn, location: { r: 9, c: 8} },

					{ blueprint: salt, location: { r: 10, c: 6} },
					{ blueprint: salt, location: { r: 10, c: 7} },
					{ blueprint: salt, location: { r: 10, c: 8} },
					{ blueprint: salt, location: { r: 11, c: 6} },
					{ blueprint: salt, location: { r: 11, c: 7} },
					{ blueprint: salt, location: { r: 11, c: 8} },

					{ blueprint: salt, location: { r: 12, c: 6} },
					{ blueprint: salt, location: { r: 12, c: 7} },
					{ blueprint: salt, location: { r: 12, c: 8} },
					{ blueprint: salt, location: { r: 13, c: 6} },
					{ blueprint: salt, location: { r: 13, c: 7} },
					{ blueprint: salt, location: { r: 13, c: 8} },

					{ blueprint: spareParts, location: { r: 14, c: 2} },
					{ blueprint: spareParts, location: { r: 14, c: 3} },
					{ blueprint: spareParts, location: { r: 14, c: 4} },
					{ blueprint: spareParts, location: { r: 14, c: 6} },
					{ blueprint: spareParts, location: { r: 14, c: 7} },
					{ blueprint: spareParts, location: { r: 14, c: 8} },
				],
				playerLocation: { r: 2, c: 5 }
			}
		},
		{
			range: [2, 4],
			blueprint: {
				type: "generated",
				generatorOptions: {
					width: { type: "binomial", n: 60, p: .8 },
					height: { type: "binomial", n: 60, p: .8 },
					features: {
						rooms: roomFeatures,
						corridors: corridorFeatures
					},
					limit: 1000,
					cleanliness: .95
				},
				enemies: [
					{
						density: { type: "binomial", n: 8, p: .4 },
						name: "Blender",
						graphics: "blender",
						stats: blenderStats,
						attacks: [
							{ attack: tackle, weight: 1 },
							{ attack: blend, weight: 1 },
							{ attack: puree, weight: 1 }
						]
					},
					{
						density: { type: "binomial", n: 8, p: .6 },
						name: "Spatula",
						graphics: "spatula",
						stats: spatulaStats,
						attacks: [
							{ attack: spatulate, weight: 1 }
						]
					}
				],
				items: [
					{ item: screwdriver, density: { type: "binomial", n: 2, p: 0.6 } },
					{ item: battery, density: { type: "binomial", n: 2, p: 0.6 } },
					{ item: paprika, density: { type: "binomial", n: 1, p: 0.5 } },
					{ item: cayenne, density: { type: "binomial", n: 1, p: 0.5 } },
					{ item: turmeric, density: { type: "binomial", n: 1, p: 0.5 } },
					{ item: oregano, density: { type: "binomial", n: 1, p: 0.5 } },
					{ item: cinnamon, density: { type: "binomial", n: 1, p: 0.5 } },
					{ item: peppercorn, density: { type: "binomial", n: 1, p: 0.5 } },
					{ item: spareParts, density: { type: "binomial", n: 1, p: 0.5 } },
					{ item: salt, density: { type: "binomial", n: 2, p: 0.6 } }
				]
			}
		},
		{
			range: [5, 5],
			blueprint: {
				type: "static",
				map: {
					width: 9,
					height: 11,
					grid: [
						[ wl(), wl(), wl(), wl(), wl(), wl(), wl(), wl(), wl() ],
						[ wl(), wl(), wl(), wl(), wl(), wl(), wl(), wl(), wl() ],
						[ wl(), wl(), fl(), fl(), fl(), fl(), fl(), wl(), wl() ],
						[ wl(), wl(), fl(), fl(), st(), fl(), fl(), wl(), wl() ],
						[ wl(), wl(), fl(), fl(), fl(), fl(), fl(), wl(), wl() ],
						[ wl(), wl(), fl(), fl(), fl(), fl(), fl(), wl(), wl() ],
						[ wl(), wl(), fl(), fl(), fl(), fl(), fl(), wl(), wl() ],
						[ wl(), wl(), fl(), fl(), fl(), fl(), fl(), wl(), wl() ],
						[ wl(), wl(), fl(), fl(), fl(), fl(), fl(), wl(), wl() ],
						[ wl(), wl(), wl(), wl(), wl(), wl(), wl(), wl(), wl() ],
						[ wl(), wl(), wl(), wl(), wl(), wl(), wl(), wl(), wl() ]
					]
				},
				enemies: [ { blueprint: finalBoss, location: { r: 3, c: 4 } } ],
				items: [ { blueprint: stormyFlag, location: { r: 3, c: 4 } } ],
				playerLocation: { r: 6, c: 4 }
			} as StaticFloorBlueprint // why do I need this?
		}
	]
};

let sandbar: Dungeon = {
	name: "Shallow Sandbar",
	floors: 4,
	direction: "down",
	difficulty: 2,
	graphics: "dng-stormy-sea",
	blueprint: [
		{
			range: [1, 3],
			blueprint: {
				type: "generated",
				generatorOptions: {
					width: { type: "binomial", n: 40, p: .8 },
					height: { type: "binomial", n: 40, p: .8 },
					features: {
						rooms: roomFeatures,
						corridors: corridorFeatures
					},
					limit: 1000,
					cleanliness: .95
				},
				enemies: [
					{
						density: { type: "binomial", n: 5, p: .4 },
						name: "Blender",
						graphics: "blender",
						stats: blenderStats,
						attacks: [
							{ attack: tackle, weight: 1 },
							{ attack: blend, weight: 1 },
							{ attack: puree, weight: 1 }
						]
					}
				],
				items: [
					{ item: screwdriver, density: { type: "binomial", n: 2, p: 0.6 } },
					{ item: battery, density: { type: "binomial", n: 2, p: 0.6 } },
					{ item: paprika, density: { type: "binomial", n: 1, p: 0.5 } },
					{ item: cayenne, density: { type: "binomial", n: 1, p: 0.5 } },
					{ item: turmeric, density: { type: "binomial", n: 1, p: 0.5 } },
					{ item: oregano, density: { type: "binomial", n: 1, p: 0.5 } },
					{ item: cinnamon, density: { type: "binomial", n: 1, p: 0.5 } },
					{ item: peppercorn, density: { type: "binomial", n: 1, p: 0.5 } },
					{ item: spareParts, density: { type: "binomial", n: 1, p: 0.5 } },
					{ item: salt, density: { type: "binomial", n: 2, p: 0.6 } }
				]
			}
		},
		{
			range: [4, 4],
			blueprint: {
				type: "generated",
				generatorOptions: {
					width: { type: "binomial", n: 60, p: .8 },
					height: { type: "binomial", n: 60, p: .8 },
					features: {
						rooms: roomFeatures,
						corridors: corridorFeatures
					},
					limit: 1000,
					cleanliness: .95
				},
				enemies: [
					{
						density: { type: "binomial", n: 8, p: .4 },
						name: "Blender",
						graphics: "blender",
						stats: blenderStats,
						attacks: [
							{ attack: tackle, weight: 1 },
							{ attack: blend, weight: 1 },
							{ attack: puree, weight: 1 }
						]
					},
					{
						density: { type: "binomial", n: 8, p: .6 },
						name: "Spatula",
						graphics: "spatula",
						stats: spatulaStats,
						attacks: [
							{ attack: spatulate, weight: 1 }
						]
					}
				],
				items: [
					{ item: screwdriver, density: { type: "binomial", n: 2, p: 0.6 } },
					{ item: battery, density: { type: "binomial", n: 2, p: 0.6 } },
					{ item: paprika, density: { type: "binomial", n: 1, p: 0.5 } },
					{ item: cayenne, density: { type: "binomial", n: 1, p: 0.5 } },
					{ item: turmeric, density: { type: "binomial", n: 1, p: 0.5 } },
					{ item: oregano, density: { type: "binomial", n: 1, p: 0.5 } },
					{ item: cinnamon, density: { type: "binomial", n: 1, p: 0.5 } },
					{ item: peppercorn, density: { type: "binomial", n: 1, p: 0.5 } },
					{ item: spareParts, density: { type: "binomial", n: 1, p: 0.5 } },
					{ item: salt, density: { type: "binomial", n: 2, p: 0.6 } },
					{ item: blazingFlag, density: { type: "uniform", a: 1, b: 1 } }
				]
			}
		}
	]
};

let coralReef: Dungeon = {
	name: "Calm Crystal Reef",
	floors: 3,
	direction: "up",
	difficulty: 2,
	graphics: "dng-waterfall-pond",
	blueprint: [
		{
			range: [1, 2],
			blueprint: {
				type: "generated",
				generatorOptions: {
					width: { type: "binomial", n: 60, p: .8 },
					height: { type: "binomial", n: 60, p: .8 },
					features: {
						rooms: roomFeatures,
						corridors: corridorFeatures
					},
					limit: 1000,
					cleanliness: .95
				},
				enemies: [
					{
						density: { type: "binomial", n: 8, p: .4 },
						name: "Blender",
						graphics: "blender",
						stats: blenderStats,
						attacks: [
							{ attack: tackle, weight: 1 },
							{ attack: blend, weight: 1 },
							{ attack: puree, weight: 1 }
						]
					},
					{
						density: { type: "binomial", n: 8, p: .6 },
						name: "Spatula",
						graphics: "spatula",
						stats: spatulaStats,
						attacks: [
							{ attack: spatulate, weight: 1 }
						]
					}
				],
				items: [
					{ item: screwdriver, density: { type: "binomial", n: 2, p: 0.6 } },
					{ item: battery, density: { type: "binomial", n: 2, p: 0.6 } },
					{ item: paprika, density: { type: "binomial", n: 1, p: 0.5 } },
					{ item: cayenne, density: { type: "binomial", n: 1, p: 0.5 } },
					{ item: turmeric, density: { type: "binomial", n: 1, p: 0.5 } },
					{ item: oregano, density: { type: "binomial", n: 1, p: 0.5 } },
					{ item: cinnamon, density: { type: "binomial", n: 1, p: 0.5 } },
					{ item: peppercorn, density: { type: "binomial", n: 1, p: 0.5 } },
					{ item: spareParts, density: { type: "binomial", n: 1, p: 0.5 } },
					{ item: salt, density: { type: "binomial", n: 2, p: 0.6 } }
				]
			}
		},
		{
			range: [3, 3],
			blueprint: {
				type: "generated",
				generatorOptions: {
					width: { type: "binomial", n: 60, p: .8 },
					height: { type: "binomial", n: 60, p: .8 },
					features: {
						rooms: roomFeatures,
						corridors: corridorFeatures
					},
					limit: 1000,
					cleanliness: .95
				},
				enemies: [
					{
						density: { type: "binomial", n: 8, p: .4 },
						name: "Blender",
						graphics: "blender",
						stats: blenderStats,
						attacks: [
							{ attack: tackle, weight: 1 },
							{ attack: blend, weight: 1 },
							{ attack: puree, weight: 1 }
						]
					},
					{
						density: { type: "binomial", n: 8, p: .6 },
						name: "Spatula",
						graphics: "spatula",
						stats: spatulaStats,
						attacks: [
							{ attack: spatulate, weight: 1 }
						]
					}
				],
				items: [
					{ item: screwdriver, density: { type: "binomial", n: 2, p: 0.6 } },
					{ item: battery, density: { type: "binomial", n: 2, p: 0.6 } },
					{ item: paprika, density: { type: "binomial", n: 1, p: 0.5 } },
					{ item: cayenne, density: { type: "binomial", n: 1, p: 0.5 } },
					{ item: turmeric, density: { type: "binomial", n: 1, p: 0.5 } },
					{ item: oregano, density: { type: "binomial", n: 1, p: 0.5 } },
					{ item: cinnamon, density: { type: "binomial", n: 1, p: 0.5 } },
					{ item: peppercorn, density: { type: "binomial", n: 1, p: 0.5 } },
					{ item: spareParts, density: { type: "binomial", n: 1, p: 0.5 } },
					{ item: salt, density: { type: "binomial", n: 2, p: 0.6 } },
					{ item: key, density: { type: "uniform", a: 1, b: 1 } }
				]
			}
		}
	]
};

let cavern: Dungeon = {
	name: "Undersea Cavern",
	floors: 3,
	direction: "down",
	difficulty: 2,
	graphics: "dng-wish-cave",
	blueprint: [
		{
			range: [1, 2],
			blueprint: {
				type: "generated",
				generatorOptions: {
					width: { type: "binomial", n: 60, p: .8 },
					height: { type: "binomial", n: 60, p: .8 },
					features: {
						rooms: roomFeatures,
						corridors: corridorFeatures
					},
					limit: 1000,
					cleanliness: .95
				},
				enemies: [
					{
						density: { type: "binomial", n: 8, p: .4 },
						name: "Blender",
						graphics: "blender",
						stats: blenderStats,
						attacks: [
							{ attack: tackle, weight: 1 },
							{ attack: blend, weight: 1 },
							{ attack: puree, weight: 1 }
						]
					},
					{
						density: { type: "binomial", n: 8, p: .6 },
						name: "Spatula",
						graphics: "spatula",
						stats: spatulaStats,
						attacks: [
							{ attack: spatulate, weight: 1 }
						]
					}
				],
				items: [
					{ item: screwdriver, density: { type: "binomial", n: 2, p: 0.6 } },
					{ item: battery, density: { type: "binomial", n: 2, p: 0.6 } },
					{ item: paprika, density: { type: "binomial", n: 1, p: 0.5 } },
					{ item: cayenne, density: { type: "binomial", n: 1, p: 0.5 } },
					{ item: turmeric, density: { type: "binomial", n: 1, p: 0.5 } },
					{ item: oregano, density: { type: "binomial", n: 1, p: 0.5 } },
					{ item: cinnamon, density: { type: "binomial", n: 1, p: 0.5 } },
					{ item: peppercorn, density: { type: "binomial", n: 1, p: 0.5 } },
					{ item: spareParts, density: { type: "binomial", n: 1, p: 0.5 } },
					{ item: salt, density: { type: "binomial", n: 2, p: 0.6 } }
				]
			}
		},
		{
			range: [3, 3],
			blueprint: {
				type: "generated",
				generatorOptions: {
					width: { type: "binomial", n: 60, p: .8 },
					height: { type: "binomial", n: 60, p: .8 },
					features: {
						rooms: roomFeatures,
						corridors: corridorFeatures
					},
					limit: 1000,
					cleanliness: .95
				},
				enemies: [
					{
						density: { type: "binomial", n: 8, p: .4 },
						name: "Blender",
						graphics: "blender",
						stats: blenderStats,
						attacks: [
							{ attack: tackle, weight: 1 },
							{ attack: blend, weight: 1 },
							{ attack: puree, weight: 1 }
						]
					},
					{
						density: { type: "binomial", n: 8, p: .6 },
						name: "Spatula",
						graphics: "spatula",
						stats: spatulaStats,
						attacks: [
							{ attack: spatulate, weight: 1 }
						]
					}
				],
				items: [
					{ item: screwdriver, density: { type: "binomial", n: 2, p: 0.6 } },
					{ item: battery, density: { type: "binomial", n: 2, p: 0.6 } },
					{ item: paprika, density: { type: "binomial", n: 1, p: 0.5 } },
					{ item: cayenne, density: { type: "binomial", n: 1, p: 0.5 } },
					{ item: turmeric, density: { type: "binomial", n: 1, p: 0.5 } },
					{ item: oregano, density: { type: "binomial", n: 1, p: 0.5 } },
					{ item: cinnamon, density: { type: "binomial", n: 1, p: 0.5 } },
					{ item: peppercorn, density: { type: "binomial", n: 1, p: 0.5 } },
					{ item: spareParts, density: { type: "binomial", n: 1, p: 0.5 } },
					{ item: salt, density: { type: "binomial", n: 2, p: 0.6 } },
					{ item: lockedBox, density: { type: "uniform", a: 1, b: 1 } }
				]
			}
		}
	]
};

let dungeons: Map<string, Dungeon> = new Map<string, Dungeon>();
dungeons.set("trench", trench);
dungeons.set("sandbar", sandbar);
dungeons.set("coral-reef", coralReef);
dungeons.set("cavern", cavern);

export default dungeons;