"use strict";

export let tackle: Attack = {
	name: "Tackle",
	animation: "tackle",
	description: "Charges the foe with a full-body tackle.",
	target: {
		type: "front",
		includeAllies: false
	},
	uses: {
		max: 200,
		current: 200
	},
	accuracy: 95,
	power: 7,
	onHit: []
};

export let spatulate: Attack = {
	name: "Spatulate",
	animation: "spatulate",
	description: "Spatulates the enemy.",
	target: {
		type: "front",
		includeAllies: false
	},
	uses: {
		max: 30,
		current: 30
	},
	accuracy: 90,
	power: 6,
	onHit: []
};

export let goldenSpatulate: Attack = {
	name: "Golden Spatulate",
	animation: "spatulate",
	description: "Spatulates the enemy... now with gold!",
	target: {
		type: "room",
		includeAllies: false,
		includeSelf: false
	},
	uses: {
		max: 1000,
		current: 1000
	},
	accuracy: 90,
	power: 1000,
	onHit: []
};

export let spinshock: Attack = {
	name: "Spinshock",
	animation: "spinshock",
	description: "Sends electricity in all directions around the user.",
	target: {
		type: "around",
		includeAllies: false
	},
	uses: {
		max: 20,
		current: 20
	},
	accuracy: 90,
	power: 12,
	onHit: []
};

export let overheat: Attack = {
	name: "Overheat",
	animation: "overheat",
	description: "Heats the entire room that the user is in to dangerous levels.",
	target: {
		type: "room",
		includeSelf: false,
		includeAllies: false
	},
	uses: {
		max: 10,
		current: 10
	},
	accuracy: 80,
	power: 10,
	onHit: []
};

export let calmMind: Attack = {
	name: "Calm Mind",
	animation: "calm-mind",
	description: "Calms the user, raising their attack and defense.",
	target: {
		type: "self"
	},
	uses: {
		max: 20,
		current: 20
	},
	accuracy: "always",
	onHit: [
		{
			type: "stat",
			stat: "attack",
			amount: 1
		},
		{
			type: "stat",
			stat: "defense",
			amount: 1
		}
	]
};

export let growl: Attack = {
	name: "Growl",
	animation: "growl",
	description: "Growls cutely to reduce the foe's ATTACK.",
	target: {
		type: "room",
		includeAllies: false,
		includeSelf: false
	},
	uses: {
		max: 30,
		current: 30
	},
	accuracy: "always",
	onHit: [
		{
			type: "stat",
			stat: "attack",
			amount: -1
		}
	]
};

export let waterGun: Attack = {
	name: "Water Gun",
	animation: "water-gun",
	description: "Squirts water to attack the foe.",
	target: {
		type: "front",
		includeAllies: false
	},
	uses: {
		max: 30,
		current: 30
	},
	accuracy: 88,
	power: 5,
	onHit: []
};

export let tailWhip: Attack = {
	name: "Tail Whip",
	animation: "tail-whip",
	description: "Lowers the target's Defense by one level.",
	target: {
		type: "front",
		includeAllies: false
	},
	uses: {
		max: 20,
		current: 20
	},
	accuracy: 100,
	onHit: [
		{
			type: "stat",
			stat: "defense",
			amount: -1
		}
	]
};

export let swift: Attack = {
	name: "Swift",
	animation: "swift",
	description: "Inflicts damage on the target. It never misses.",
	target: {
		type: "front",
		includeAllies: false,
		cutsCorners: true
	},
	uses: {
		max: 8,
		current: 8
	},
	accuracy: "always",
	power: 10,
	onHit: []
};

export let blend: Attack = {
	name: "Blend",
	animation: "blend",
	description: "Inflicts damage on the target.",
	target: {
		type: "front",
		includeAllies: false,
		cutsCorners: true
	},
	uses: {
		max: 8,
		current: 8
	},
	accuracy: 95,
	power: 8,
	onHit: []
};

export let puree: Attack = {
	name: "Puree",
	animation: "puree",
	description: "Recovers HP and boosts defense.",
	target: {
		type: "self",
		includeAllies: false
	},
	uses: {
		max: 4,
		current: 4
	},
	accuracy: "always",
	onHit: [
		{
			type: "stat",
			stat: "defense",
			amount: 1
		},
		{
			type: "heal",
			amount: 10
		}
	]
};