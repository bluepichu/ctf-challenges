import { generate as shortid } from "shortid";

import { blenderStats }        from "./stats";

let guestGuide: OverworldEntity = {
	id: shortid(),
	name: "Blender",
	graphics: "blender",
	position: { x: 160, y: 180 },
	direction: 6,
	stats: blenderStats,
	attacks: [],
	attributes: [],
	salt: 0,
	items: {
		held: { capacity: 0, items: [] }
	},
	*interact() {
		yield {
			type: "speak",
			speaker: "Blender",
			portrait: "portrait-blender-neutral",
			text: "Welcome to TW: 2KLutS!"
		};

		yield {
			type: "speak",
			speaker: "Blender",
			portrait: "portrait-blender-neutral",
			text: "You can visit the dungeons by going up, left, or right, or by talking to me!"
		};

		while (true) {
			let selection = yield {
				type: "speak",
				speaker: "Blender",
				portrait: "portrait-blender-neutral",
				text: "Anyway... would you like to visit a dungeon?",
				responses: ["How about Treacherous Trench?", "I'm thinking Undersea Cavern.", "Could you take me to Calm Crystal Reef?", "Shallow Sand Bar sounds good!", "No thanks."]
			};

			switch (selection) {
				case 0:
					yield {
						type: "speak",
						speaker: "Blender",
						portrait: "portrait-blender-neutral",
						text: "Great!  I'll warp you there."
					};

					return {
						type: "crawl",
						dungeon: "trench"
					};

				case 1:
					yield {
						type: "speak",
						speaker: "Blender",
						portrait: "portrait-blender-neutral",
						text: "Sounds good.  Have fun in there!"
					};

					return {
						type: "crawl",
						dungeon: "cavern"
					};

				case 2:
					yield {
						type: "speak",
						speaker: "Blender",
						portrait: "portrait-blender-neutral",
						text: "No problem.  Enjoy your exploration!"
					};

					return {
						type: "crawl",
						dungeon: "coral-reef"
					};

				case 3:
					yield {
						type: "speak",
						speaker: "Blender",
						portrait: "portrait-blender-neutral",
						text: "Sorry!  Shallow Sand Bar is only available to players of our closed alpha."
					};
					break;

				default:
					return {
						type: "speak",
						speaker: "Blender",
						portrait: "portrait-blender-neutral",
						text: "Ok, but don't hesitate to come back if you change your mind!"
					};
			}
		}
	}
};

let alphaGuide: OverworldEntity = {
	id: shortid(),
	name: "Blender",
	graphics: "blender",
	position: { x: 160, y: 180 },
	direction: 6,
	stats: blenderStats,
	attacks: [],
	attributes: [],
	salt: 0,
	items: {
		held: { capacity: 0, items: [] }
	},
	*interact() {
		yield {
			type: "speak",
			speaker: "Blender",
			portrait: "portrait-blender-neutral",
			text: "Welcome to TW: 2KLutS!"
		};

		yield {
			type: "speak",
			speaker: "Blender",
			portrait: "portrait-blender-neutral",
			text: "You can visit the dungeons by going up, left, or right, or by talking to me!"
		};

		while (true) {
			let selection = yield {
				type: "speak",
				speaker: "Blender",
				portrait: "portrait-blender-neutral",
				text: "Anyway... would you like to visit a dungeon?",
				responses: ["How about Treacherous Trench?", "I'm thinking Undersea Cavern.", "Could you take me to Calm Crystal Reef?", "Shallow Sand Bar sounds good!", "No thanks."]
			};

			switch (selection) {
				case 0:
					yield {
						type: "speak",
						speaker: "Blender",
						portrait: "portrait-blender-neutral",
						text: "Great!  I'll warp you there."
					};

					return {
						type: "crawl",
						dungeon: "trench"
					};

				case 1:
					yield {
						type: "speak",
						speaker: "Blender",
						portrait: "portrait-blender-neutral",
						text: "Sounds good.  Have fun in there!"
					};

					return {
						type: "crawl",
						dungeon: "cavern"
					};

				case 2:
					yield {
						type: "speak",
						speaker: "Blender",
						portrait: "portrait-blender-neutral",
						text: "No problem.  Enjoy your exploration!"
					};

					return {
						type: "crawl",
						dungeon: "coral-reef"
					};

				case 3:
					yield {
						type: "speak",
						speaker: "Blender",
						portrait: "portrait-blender-neutral",
						text: "Sure thing.  Thanks for helping us test the game!"
					};

					return {
						type: "crawl",
						dungeon: "sandbar"
					};

				default:
					return {
						type: "speak",
						speaker: "Blender",
						portrait: "portrait-blender-neutral",
						text: "Ok, but don't hesitate to come back if you change your mind!"
					};
			}
		}
	}
};

export let scene: OverworldScene = {
	background: [
		{ graphics: "ocean", position: { x: 0, y: 0 }}
	],
	bounds: { x: { min: 20, max: 460 }, y: { min: 20, max: 316 } },
	obstacles: [
		[ { x: 210, y: 246 }, { x: 168, y: 200 }, { x: 168, y: 143 }, { x: 212, y: 100 }, { x: 268, y: 100 }, { x: 312, y: 143 }, { x: 312, y: 200 }, { x: 270, y: 246 } ],
		[ { x: 0, y: 220 }, { x: 94, y: 250 }, { x: 188, y: 336 }, { x: 0, y: 336 } ],
		[ { x: 480, y: 220 }, { x: 386, y: 250 }, { x: 292, y: 336 }, { x: 480, y: 336 } ],
		[ { x: 0, y: 182 },  { x: 150, y: 133 }, { x: 225, y: 70 }, { x: 225, y: 0 }, { x: 0, y: 0 } ],
		[ { x: 480, y: 182 },  { x: 330, y: 133 }, { x: 255, y: 70 }, { x: 255, y: 0 }, { x: 480, y: 0 } ]
	],
	hotzones: [
		{
			id: "to-coral-reef",
			area: [ { x: 0, y: 182 }, { x: 40, y: 182 }, { x: 40, y: 220 }, { x: 0, y: 220 } ],
			*interact() {
				let selection = yield {
					type: "speak",
					text: "Would you like to enter Calm Crystal Reef?",
					responses: [ "Yes", "No" ]
				};

				if (selection === 0) {
					return {
						type: "crawl",
						dungeon: "coral-reef"
					};
				}
			}
		},
		{
			id: "to-cavern",
			area: [ { x: 480, y: 182 }, { x: 440, y: 182 }, { x: 440, y: 220 }, { x: 480, y: 220 } ],
			*interact() {
				let selection = yield {
					type: "speak",
					text: "Would you like to enter Undersea Cavern?",
					responses: [ "Yes", "No" ]
				};

				if (selection === 0) {
					return {
						type: "crawl",
						dungeon: "cavern"
					};
				}
			}
		},
		{
			id: "to-trench",
			area: [ { x: 225, y: 0 }, { x: 255, y: 0 }, { x: 255, y: 40 }, { x: 225, y: 40 } ],
			*interact() {
				let selection = yield {
					type: "speak",
					text: "Would you like to enter Treacherous Trench?",
					responses: [ "Yes", "No" ]
				};

				if (selection === 0) {
					return {
						type: "crawl",
						dungeon: "trench"
					};
				}
			}
		}
	],
	entities: [guestGuide]
};

export let alphaScene: OverworldScene = Object.assign({}, scene);
alphaScene.entities = [alphaGuide];