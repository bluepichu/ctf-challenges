import { Heading, Point, ShipType } from "@puzzled/types";

import { Faction } from "../entities/Faction.mjs";
import { createShip } from "../setupHelpers.mjs";

export async function createPlayerShips(faction: Faction) {
	const commonPlayerAttributes = {
		faction: faction,
		damage: 0,
		forwardTokens: 3,
		leftTokens: 2,
		rightTokens: 2,
		loadedCannons: 2,
		cannonballs: 2,
		sunk: false
	};

	await createShip({
		...commonPlayerAttributes,
		name: "Active Pike",
		type: ShipType.Sloop,
		location: new Point(6, 2),
		heading: Heading.South
	});

	await createShip({
		...commonPlayerAttributes,
		name: "Lazy Grunion",
		type: ShipType.Sloop,
		location: new Point(14, 2),
		heading: Heading.South
	});

	await createShip({
		...commonPlayerAttributes,
		name: "Clever Bluegill",
		type: ShipType.Brig,
		location: new Point(9, 2),
		heading: Heading.South
	});

	await createShip({
		...commonPlayerAttributes,
		name: "Grateful Salmon",
		type: ShipType.Brig,
		location: new Point(11, 2),
		heading: Heading.South
	});

	await createShip({
		...commonPlayerAttributes,
		name: "Magnificent Marlin",
		type: ShipType.Galleon,
		location: new Point(8, 1),
		heading: Heading.South
	});

	await createShip({
		...commonPlayerAttributes,
		name: "Idealistic Halibut",
		type: ShipType.Galleon,
		location: new Point(12, 1),
		heading: Heading.South
	});
}

export async function createAiShips(faction: Faction) {
	const commonAiAttributes = {
		faction: faction,
		damage: 0,
		forwardTokens: 3,
		leftTokens: 2,
		rightTokens: 2,
		loadedCannons: 1000,
		cannonballs: 1000,
		sunk: false
	};

	await createShip({
		...commonAiAttributes,
		name: "Aggresive Bullhead",
		type: ShipType.Frigate,
		location: new Point(9, 14),
		heading: Heading.North
	});

	await createShip({
		...commonAiAttributes,
		name: "Humble Tench",
		type: ShipType.Frigate,
		location: new Point(13, 16),
		heading: Heading.East
	});

	await createShip({
		...commonAiAttributes,
		name: "Refined Lamprey",
		type: ShipType.Galleon,
		location: new Point(11, 19),
		heading: Heading.South
	});

	await createShip({
		...commonAiAttributes,
		name: "Snooty Bream",
		type: ShipType.Galleon,
		location: new Point(3, 15),
		heading: Heading.North
	});

	await createShip({
		...commonAiAttributes,
		name: "Hungry Pollack",
		type: ShipType.Galleon,
		location: new Point(5, 21),
		heading: Heading.North
	});

	await createShip({
		...commonAiAttributes,
		name: "Unstable Needlefish",
		type: ShipType.Brig,
		location: new Point(10, 8),
		heading: Heading.West
	});

	await createShip({
		...commonAiAttributes,
		name: "Coarse Bass",
		type: ShipType.Brig,
		location: new Point(2, 22),
		heading: Heading.East
	});

	await createShip({
		...commonAiAttributes,
		name: "Childlike Angler",
		type: ShipType.Sloop,
		location: new Point(9, 17),
		heading: Heading.North
	});
}