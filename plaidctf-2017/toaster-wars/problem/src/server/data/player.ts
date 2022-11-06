"use strict";

import * as clone       from "clone";
import * as shortid     from "shortid";
import { toasterStats }   from "./stats";

import {
	tackle,
	spinshock,
	overheat,
	calmMind
} from "./attacks";

export function generatePlayer(name: string = "Toaster"): PlayerOverworldEntity {
	return {
		id: shortid.generate(),
		name: name,
		stats: clone(toasterStats),
		attacks: clone([tackle, spinshock, overheat, calmMind]),
		items: {
			held: { capacity: 1, items: [] },
			bag: { capacity: 12, items: [] }
		},
		graphics: "toaster",
		position: { x: 240, y: 312 },
		direction: 2,
		attributes: [],
		salt: 0
	};
}