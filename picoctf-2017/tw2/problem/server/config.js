function createFlag(location) {
	return {
		name: "Flag",
		description: "Gives you the flag.",
		location: location,
		use: 0,
		id: 100,
		sprite: "flag",
		effects: [
			{
				type: "revealFlag"
			}
		]
	};
}

module.exports = {
	floors: [
		{
			range: [1, 3],
			timeLimit: 500,
			bgm: "creaky-kitchen",
			generate: true,
			description: {
				map: {
					width: 45,
					height: 33
				},
				spacing: 3,
				rooms: {
					attempts: 40,
					width: {
						min: 6,
						max: 18
					},
					height: {
						min: 6,
						max: 18
					},
					gutter: 3
				},
				corridors: {
					remove: .95,
					straightness: .9
				},
				connectors: {
					randomness: .05
				},
				enemies: {
					density: 20,
					spawnProbability: .001,
					distribution: {
						blender: .6,
						spatula: .4
					}
				},
				items: {
					density: 30,
					distribution: {
						screwdriver: .4,
						battery: .3,
						paprika: .05,
						cayenne: .05,
						turmeric: .05,
						oregano: .05,
						cinnamon: .05,
						peppercorn: .05
					}
				}
			}
		},
		{
			range: [4, 4],
			timeLimit: 500,
			generate: false,
			bgm: "at-the-end-of-the-road",
			description: {
				map: {
					width: 11,
					height: 11,
					grid: [
						[ -4,  -3,  -3,  -3,  -3,  -3,  -3,  -3,  -3,  -3,  -2],
						[ -5,   1,   1,   1,   1,   1,   1,   1,   1,   1,  -1],
						[ -5,   1, -19, -19, -19, -19, -19, -19, -19,   1,  -1],
						[ -5,   1, -19,   0, -19,   0,   0,   0, -19,   1,  -1],
						[ -5,   1, -19,   0,   0,   0, -19,   0, -19,   1,  -1],
						[ -5,   1, -19,   0, -19, -19, -19, -19, -19,   1,  -1],
						[ -5,   1, -19,   0,   0,   0,   0,   0,  99,   1,  -1],
						[ -5,   1, -19, -19, -19, -19, -19, -19, -19,   1,  -1],
						[ -5,   1,   1,   1,   1,   1,   1,   1,   1,   1,  -1],
						[ -5,   1,   1,   1,   1,   1,   1,   1,   1,   1,  -1],
						[ -6,  -7,  -7,  -7,  -7,  -7,  -7,  -7,  -7,  -7,  -8]
					],
					stairs: {
						r: 9,
						c: 1
					},
					known: {
						grid: [
							[ -4,  -3,  -3,  -3,  -3,  -3,  -3,  -3,  -3,  -3,  -2],
							[ -5,   1,   1,   1,   1,   1,   1,   1,   1,   1,  -1],
							[ -5,   1, -19, -19, -19, -19, -19, -19, -19,   1,  -1],
							[ -5,   1, -19,   0, -19,   0,   0,   0, -19,   1,  -1],
							[ -5,   1, -19,   0,   0,   0, -19,   0, -19,   1,  -1],
							[ -5,   1, -19,   0, -19, -19, -19, -19, -19,   1,  -1],
							[ -5,   1, -19,   0,   0,   0,   0,   0,  99,   1,  -1],
							[ -5,   1, -19, -19, -19, -19, -19, -19, -19,   1,  -1],
							[ -5,   1,   1,   1,   1,   1,   1,   1,   1,   1,  -1],
							[ -5,   1,   1,   1,   1,   1,   1,   1,   1,   1,  -1],
							[ -6,  -7,  -7,  -7,  -7,  -7,  -7,  -7,  -7,  -7,  -8]
						],
						stairs: {
							r: 9,
							c: 1
						}
					}
				},
				enemies: [
					{
						id: 1,
						name: "Spatula",
						sprites: "spatula",
						stats: {
							attack: 35,
							defense: 15,
							hp: 60,
							maxHp: 60,
							energy: 30,
							maxEnergy: 30,
							maxItems: 1,
							modifiers: {}
						},
						attacks: [
							{
								name: "Spatulate",
								description: "",
								power: 25,
								accuracy: 90,
								cost: 0,
								effects: [],
								sfx: "physicalAttack",
								range: {
									type: "straight",
									cutsCorners: false,
									distance: 1
								}
							}
						],
						rubber: true,
						items: [],
						location: { r: 1, c: 1 }
					}
				],
				items: [createFlag({ r: 4, c: 7 })],
				player: {
					location: {
						r: 8,
						c: 1
					}
				}
			}
		}
	],
	attacks: {
		tackle: {
			name: "Tackle",
			description: "",
			power: 30,
			accuracy: 90,
			cost: 0,
			effects: [],
			sfx: "physicalAttack",
			range: {
				type: "straight",
				cutsCorners: false,
				distance: 1
			}
		},
		spatulate: {
			name: "Spatulate",
			description: "",
			power: 25,
			accuracy: 90,
			cost: 0,
			effects: [],
			sfx: "physicalAttack",
			range: {
				type: "straight",
				cutsCorners: false,
				distance: 1
			}
		},
		puree: {
			name: "Puree",
			description: "Heals 10HP, recovers 8 energy, and boosts defense.",
			power: 0,
			accuracy: 100,
			cost: 2,
			effects: [
				{
					type: "stat/hp",
					change: 10
				},
				{
					type: "stat/energy",
					change: 8
				},
				{
					type: "stat/modifier",
					stat: "defense",
					change: 1
				}
			],
			sfx: "specialAttack",
			range: {
				type: "self"
			}
		},
		blend: {
			name: "Blend",
			description: "",
			power: 60,
			accuracy: 85,
			cost: 4,
			effects: [],
			sfx: "physicalAttack",
			range: {
				type: "straight",
				cutsCorners: false,
				distance: 1
			}
		},
		spinshock: {
			name: "Spinshock",
			description: "",
			power: 60,
			accuracy: 80,
			cost: 4,
			effects: [],
			sfx: "spinshock",
			range: {
				type: "around"
			}
		},
		hydroPump: {
			name: "Hydro Pump",
			description: "",
			power: 70,
			accuracy: 80,
			cost: 3,
			effects: [],
			sfx: "specialAttack",
			range: {
				type: "straight",
				cutsCorners: true,
				distance: -1
			}
		},
		flamethrower: {
			name: "Flamethrower",
			description: "",
			power: 70,
			accuracy: 80,
			cost: 3,
			effects: [],
			sfx: "specialAttack",
			range: {
				type: "straight",
				cutsCorners: true,
				distance: -1
			}
		},
		earthquake: {
			name: "Earthquake",
			description: "",
			power: 50,
			accuracy: 60,
			cost: 8,
			effects: [],
			sfx: "specialAttack",
			range: {
				type: "room"
			}
		},
		overheat: {
			name: "Overheat",
			description: "",
			power: 50,
			accuracy: 60,
			cost: 8,
			effects: ["heat"],
			sfx: "overheat",
			range: {
				type: "room"
			}
		},
		calmMind: {
			name: "Calm Mind",
			description: "Boosts attack and defense.",
			power: 0,
			accuracy: 100,
			cost: 2,
			sfx: "specialAttack",
			effects: [
				{
					type: "stat/modifier",
					stat: "attack",
					change: 1
				},
				{
					type: "stat/modifier",
					stat: "defense",
					change: 1
				}
			],
			range: {
				type: "self"
			}
		}
	},
	enemies: {
		blender: {
			name: "Blender",
			sprites: "blender",
			stats: {
				attack: 30,
				defense: 25,
				hp: 30,
				energy: 24,
				modifiers: {}
			},
			attacks: {
				blend: 1,
				tackle: 1,
				puree: 1
			}
		},
		spatula: {
			name: "Spatula",
			sprites: "spatula",
			stats: {
				attack: 35,
				defense: 15,
				hp: 45,
				energy: 30,
				modifiers: {}
			},
			attacks: {
				spatulate: 1
			},
			rubber: true
		}
	},
	items: {
		screwdriver: {
			name: "Screwdriver",
			description: "Recovers 40 HP.",
			sprite: "screwdriver",
			effects: [
				{
					type: "stat/hp",
					change: 40
				}
			]
		},
		battery: {
			name: "Battery",
			description: "Recovers 12 energy.",
			sprite: "battery",
			effects: [
				{
					type: "stat/energy",
					change: 12
				}
			]
		},
		paprika: {
			name: "Paprika",
			description: "Does nothing.",
			sprite: "paprika",
			effects: [
			]
		},
		cayenne: {
			name: "Cayenne",
			description: "Does nothing.",
			sprite: "cayenne",
			effects: [
			]
		},
		turmeric: {
			name: "Turmeric",
			description: "Warps the user to a random location.",
			sprite: "turmeric",
			effects: [
				{
					type: "move",
					location: "random"
				}
			]
		},
		oregano: {
			name: "Oregano",
			description: "Does nothing.",
			sprite: "oregano",
			effects: [
			]
		},
		cinnamon: {
			name: "Cinnamon",
			description: "Reveals the location of the stairs.",
			sprite: "cinnamon",
			effects: [
				{
					type: "revealStairs"
				}
			]
		},
		peppercorn: {
			name: "Peppercorn",
			description: "Does nothing.",
			sprite: "peppercorn",
			effects: [
			]
		},
	},
	viewport: {
		width: 15,
		height: 11
	},
	player: {
		name: "Toaster",
		sprites: "toaster",
		stats: {
			attack: 40,
			defense: 30,
			energy: 50,
			hp: 100,
			maxItems: 8
		},
		attacks: ["tackle", "spinshock", "overheat", "calmMind"]
	}
}
