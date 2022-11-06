"use strict";

import { loaders } from "pixi.js";

const letters = "abcdefghijklmnopqrstuvwxyz";

interface SpriteSheetJson {
	frames: {
		[key: string]: {
			frame: {
				x: number;
				y: number;
				w: number;
				h: number;
			};
			sourceSize: {
				x: number;
				y: number;
				w: number;
				h: number;
			};
		}
	};
	meta: {
		image: string;
	};
}

/**
 * A Pixi Loader middleware transform a tilesheet into a standard spritesheet.
 */
export default function tileSheetParser(resource: loaders.Resource, next: () => void) {
	if (!resource.data || resource.type !== loaders.Resource.TYPE.JSON || !resource.data.tiles) {
		next();
		return;
	}

	let out: SpriteSheetJson = {
		frames: {},
		meta: {
			image: resource.data.image
		}
	};

	let w = resource.data.grid.width;
	let h = resource.data.grid.height;

	for (let i = 0; i < resource.data.tiles.length; i++) {
		for (let j = 0; j < resource.data.tiles[i].length; j++) {
			if (resource.data.tiles[i][j]) {
				let parts = resource.data.tiles[i][j].split("-");
				let name: string;

				switch (parts.length) {
					case 1:
						name = parts[0];

						if (resource.data.prefix) {
							name = resource.data.prefix + "-" + name;
						}
						break;

					case 2:
						switch (parts[0]) {
							case "g": name = "ground-"; break;
							case "w": name = "wall-"; break;
						}

						let des = parseInt(parts[1], 2).toString(16);
						if (des.length < 2) {
							des = "0" + des;
						}

						name += des;

						if (resource.data.prefix) {
							name = resource.data.prefix + "-" + name;
						}

						let k = 0;
						while (`${name}-${letters.charAt(k)}` in out.frames) {
							k++;
						}

						name += "-" + letters.charAt(k);
						break;
				}

				out.frames[name] = {
					frame: {
						x: j * w,
						y: i * h,
						w,
						h
					},
					sourceSize: {
						x: j * 2,
						y : i * h,
						w,
						h
					}
				};
			}
		}
	}

	resource.data = out;

	next();
}