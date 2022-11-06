"use strict";

import Colors       from "./colors";
import {
	Container,
	Graphics,
	Text
}                   from "pixi.js";
import * as Tweener from "./graphics/tweener";

/**
 * An overlay that shows a list of available attacks and various stats about them.
 */
export default class AttackOverlay extends Container {
	public children: AttackListing[];
	private _active: boolean;

	/**
	 * Constructs a new AttackOverlay.
	 */
	public constructor() {
		super();
	}

	/**
	 * Whether or not this overlay is active.  When active, the overlay is onscreen; when inactive, it is hidden
	 *     offscreen.
	 */
	public set active(active: boolean) {
		if (this._active !== active) {
			if (active) {
				this.showMoves();
			} else {
				this.hideMoves();
			}
		}

		this._active = active;
	}

	public get active(): boolean {
		return this._active;
	}

	/**
	 * Updates the information in this overlay.
	 * @param attacks - The attacks to show in the overlay.
	 */
	public update(attacks: Attack[]): void {
		this.removeChildren();

		attacks.forEach((attack: Attack, i: number) => {
			if (this.children.length <= i) {
				let child = new AttackListing(i + 1, attack);

				child.x = -600;
				child.y = i * 60 + 10;

				this.addChild(child);
			}

			this.children[i].update(attack);
		});
	}

	/**
	 * Animates-in this overlay.
	 */
	private showMoves(): void {
		this.children.forEach((child, i) =>
			setTimeout(() => Tweener.tween(child, { x: 0 }, 1.1, "smooth"), i * 100));
	}

	/**
	 * Animates-out this overlay.
	 */
	private hideMoves(): void {
		this.children.forEach((child, i) =>
			setTimeout(() => Tweener.tween(child, { x: -600 }, 1.1, "smooth"), i * 100));
	}
}

/**
 * The listing for a single attack inside an AttackOverlay.
 */
class AttackListing extends Container {
	private bg: Graphics;
	private indexText: Text;
	private nameText: Text;
	private powerText: Text;
	private accuracyText: Text;
	private usesText: Text;

	/**
	 * Constructs a new AttackListing with the given index and attack info.
	 * @param indexText - What index to show for this attack.
	 * @param attack - The attack whose information should be in this listing.
	 */
	constructor(indexText: number, attack: Attack) {
		super();

		this.bg = new Graphics();
		this.bg.beginFill(Colors.BLUE);
		this.bg.drawPolygon([0, 0, 300, 0, 270, 50, 0, 50]);
		this.bg.endFill();
		this.addChild(this.bg);

		this.indexText = new Text(indexText.toString(), {
			fontFamily: "Lato",
			fontSize: "32px",
			fontWeight: "400",
			fill: Colors.WHITE
		});
		this.indexText.anchor.x = .5;
		this.indexText.anchor.y = .5;
		this.indexText.x = 32;
		this.indexText.y = 25;
		this.addChild(this.indexText);

		this.nameText = new Text("", {
			fontFamily: "Lato",
			fontSize: "24px",
			fontWeight: "300",
			fill: Colors.WHITE
		});
		this.nameText.anchor.y = .5;
		this.nameText.x = 60;
		this.nameText.y = 25;
		this.nameText.alpha = .8;
		this.addChild(this.nameText);

		this.powerText = new Text("", {
			fontFamily: "Lato",
			fontSize: "16px",
			fontWeight: "300",
			fill: Colors.WHITE
		});
		this.powerText.anchor.x = 1;
		this.powerText.x = 250;
		this.powerText.y = 8;
		this.powerText.alpha = .8;
		this.addChild(this.powerText);

		this.accuracyText = new Text("", {
			fontFamily: "Lato",
			fontSize: "16px",
			fontWeight: "300",
			fill: Colors.WHITE
		});
		this.accuracyText.anchor.x = 1;
		this.accuracyText.x = 250;
		this.accuracyText.y = 28;
		this.accuracyText.alpha = .8;
		this.addChild(this.accuracyText);

		this.usesText = new Text("", {
			fontFamily: "Lato",
			fontSize: "16px",
			fontWeight: "300",
			fill: Colors.WHITE
		});
		this.usesText.anchor.x = .5;
		this.usesText.anchor.y = .5;
		this.usesText.x = 275;
		this.usesText.y = 25;
		this.usesText.rotation = -1.03;
		this.usesText.alpha = .6;
		this.addChild(this.usesText);

		this.update(attack);
	}

	/**
	 * Replaces the info in this listing with that of the given attack.
	 * @param attack - The attack.
	 */
	public update(attack: Attack) {
		this.nameText.text = attack.name;
		this.powerText.text = attack.power !== undefined ? attack.power + " POW" : "";
		this.accuracyText.text = attack.accuracy === "always" ? "Always hits" : attack.accuracy + " ACC";
		this.usesText.text = attack.uses.current + "/" + attack.uses.max;
	}
}