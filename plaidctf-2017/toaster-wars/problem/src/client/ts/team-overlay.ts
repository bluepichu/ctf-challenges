"use strict";

import {
	CanvasRenderer,
	Container,
	Graphics,
	Text,
	TextStyle,
	WebGLRenderer,
	utils as PixiUtils
} from "pixi.js";

import MultiStyleText, { TextStyleSet } from "pixi-multistyle-text";

import Colors                                from "./colors";
import EntitySprite                          from "./graphics/entity-sprite";
import * as GraphicsDescriptorCache          from "./graphics/graphics-descriptor-cache";
import GraphicsObject                        from "./graphics/graphics-object";
import * as Tweener                          from "./graphics/tweener";

/**
 * The text styles used in the team overlay.
 */
const STYLES: TextStyleSet = {
	default: {
		fontFamily: "Lato",
		fontSize: "14px",
		fontWeight: "300",
		fill: Colors.WHITE
	},
	title: {
		fontFamily: "Lato",
		fontSize: "20px",
		fontWeight: "300",
		fill: Colors.YELLOW
	},
	strategy: {
		fontFamily: "Lato",
		fontSize: "10px",
		fontWeight: "700",
		fill: Colors.GRAY_6
	},
	icon: {
		fontFamily: "DK Icons",
		fontSize: "12px",
		fontWeight: "300",
		valign: "middle"
	},
	hp: {
		fontSize: "10px",
		fontWeight: "700",
		fill: Colors.BLUE
	},
	hunger: {
		fontSize: "10px",
		fontWeight: "700",
		fill: Colors.YELLOW
	}
};

/**
 * Displays the members of the player's team.
 */
export default class TeamOverlay extends Container {
	public children: TeamListing[];
	private map: Map<string, TeamListing>;
	private renderer: WebGLRenderer | CanvasRenderer;

	/**
	 * Creates an empty TeamOverlay.
	 */
	public constructor(renderer: WebGLRenderer | CanvasRenderer) {
		super();

		this.map = new Map();
		this.renderer = renderer;
	}

	/**
	 * Updates the team overlay to match the given state.
	 * @param state - The state to match.
	 */
	public update(state: CensoredClientCrawlState) {
		let current = new Set(this.map.keys());
		let visible = new Set(
			state
				.entities
				.filter((entity) => entity.alignment === state.self.alignment)
				.map((entity) => entity.id));
		let toAdd = new Set([...visible].filter((id) => !current.has(id)));
		let toRemove = new Set([...current].filter((id) => !visible.has(id)));

		toRemove.forEach((id) => {
			let listing = this.map.get(id);
			Tweener.tween(listing, { x: -300 }, 0.8, "smooth")
				.then(() => {
					this.removeChild(listing);
					this.map.delete(id);
				});
			this.map.delete(id);
		});

		this.map.forEach((listing, id) => {
			let entity = state.entities.filter((entity) => entity.id === id)[0];
			listing.update(entity as CensoredSelfCrawlEntity);
		});

		toAdd.forEach((id) => {
			let entity = state.entities.filter((entity) => entity.id === id)[0];
			let listing = new TeamListing(entity as CensoredSelfCrawlEntity, this.renderer);
			this.addChild(listing);
			listing.x = 170;
			this.map.set(id, listing);
		});

		let index = 0;

		this.map.forEach((listing) => {
			listing.y = -70 * (this.map.size - index);
			index++;
		});
	}
}

/**
 * A single team member listing.
 */
class TeamListing extends Container {
	private bg: Graphics;
	private entitySprite: EntitySprite;
	private nameText: Text;
	private strategyText: Text;
	private hpArc: Graphics;
	private hpText: Text;
	private hungerArc: Graphics;
	private hungerText: Text;
	private items: ItemListing[];

	/**
	 * Constructs a listing for the given entity.
	 * @param entity - The entity whose information to display.
	 */
	public constructor(entity: CensoredSelfCrawlEntity, renderer: WebGLRenderer | CanvasRenderer) {
		super();

		this.bg = new Graphics();
		this.addChild(this.bg);
		this.bg.beginFill(Colors.BLACK, .9);
		this.bg.drawRect(-240, -30, 240, 60);
		this.bg.arc(0, 0, 30, Math.PI / 2, 3 * Math.PI / 2, true);
		this.bg.endFill();

		this.entitySprite = new EntitySprite(GraphicsDescriptorCache.getEntityGraphics(entity.graphics));
		this.entitySprite.direction = 7;
		this.entitySprite.x = -4;
		this.entitySprite.y = 4;
		this.entitySprite.scale.x = 1.5;
		this.entitySprite.scale.y = 1.5;
		this.addChild(this.entitySprite);
		renderer.on("prerender", () => this.entitySprite.prerender());

		this.nameText = new Text("", STYLES["title"]);
		this.nameText.anchor.x = 1;
		this.nameText.anchor.y = 1;
		this.nameText.x = -30;
		this.nameText.y = 4;
		this.addChild(this.nameText);

		this.strategyText = new Text("", STYLES["strategy"]);
		this.strategyText.anchor.x = 1;
		this.strategyText.anchor.y = 0;
		this.strategyText.x = -30;
		this.strategyText.y = 6;
		this.addChild(this.strategyText);

		this.hpArc = new Graphics();
		this.addChild(this.hpArc);

		this.hpText = new MultiStyleText("", STYLES);
		this.hpText.anchor.x = 1;
		this.hpText.anchor.y = 0;
		this.hpText.x = -134;
		this.hpText.y = -30;
		this.addChild(this.hpText);

		this.hungerArc = new Graphics();
		this.hungerArc.lineStyle(2, Colors.YELLOW);
		this.hungerArc.arc(0, 0, 25, 0, Math.PI / 2, false);
		this.hungerArc.moveTo(0, 25).lineTo(-130, 25);
		this.addChild(this.hungerArc);

		this.hungerText = new MultiStyleText("", STYLES);
		this.hungerText.anchor.x = 1;
		this.hungerText.anchor.y = 1;
		this.hungerText.x = -134;
		this.hungerText.y = 32;
		this.addChild(this.hungerText);

		this.items = [];

		for (let i = 0; i < entity.items.held.capacity; i++) {
			let listing = new ItemListing();
			let angle = (i + 1) / (entity.items.held.capacity + 1) * 2 * Math.PI / 3 - Math.PI / 3;
			Object.assign(listing, { x: 45 * Math.cos(angle), y: 45 * Math.sin(angle) });

			this.addChild(listing);
			this.items.push(listing);
		}

		this.update(entity);
	}

	/**
	 * Updates the listing for the given entity.
	 * @param entity - The entity whose information to display.
	 */
	public update(entity: CensoredSelfCrawlEntity): void {
		this.nameText.text = entity.name;
		this.strategyText.text = "LEADER";

		this.hpText.text = `<hp>${entity.stats.hp.current}</hp>`;

		let arcLength = Math.PI / 2 * 25;
		let lineLength = 130;
		let totalLength = arcLength + lineLength;

		let hpPct = entity.stats.hp.current / entity.stats.hp.max;
		let hpLength = totalLength * hpPct;

		STYLES["hp"].fill = PixiUtils.hex2string(this.getHpColor(hpPct));

		this.hpArc.clear();
		this.hpArc.lineStyle(2, this.getHpColor(hpPct));
		this.hpArc.moveTo(-lineLength, -25).lineTo(-lineLength + Math.min(lineLength, hpLength), -25);

		if (hpLength > lineLength) {
			let hpArcLength = hpLength - lineLength;
			let hpAngle = hpArcLength / arcLength * Math.PI / 2;
			this.hpArc.arc(0, 0, 25, -Math.PI / 2, -Math.PI / 2 + hpAngle);
		}

		this.hungerText.text = `<hunger>${Math.ceil(entity.stats.energy.current / 6)}</hunger>`;

		let hungerPct = Math.ceil(entity.stats.energy.current / 6) / Math.ceil(entity.stats.energy.max / 6);
		let hungerLength = totalLength * hungerPct;

		STYLES["hunger"].fill = PixiUtils.hex2string(this.getHungerColor(hungerPct));

		this.hungerArc.clear();
		this.hungerArc.lineStyle(2, this.getHungerColor(hungerPct));
		this.hungerArc.moveTo(-lineLength, 25).lineTo(-lineLength + Math.min(lineLength, hungerLength), 25);

		if (hungerLength > lineLength) {
			let hungerArcLength = hungerLength - lineLength;
			let hungerAngle = hungerArcLength / arcLength * Math.PI / 2;
			this.hungerArc.arc(0, 0, 25, Math.PI / 2, Math.PI / 2 - hungerAngle, true);
		}

		this.items.forEach((listing, i) => {
			if (i < entity.items.held.items.length) {
				listing.item = entity.items.held.items[i];
			} else {
				listing.item = undefined;
			}
		});
	}

	/**
	 * Returns the color in which to show the entity's HP meter.
	 * @param pct - The percentage of HP.
	 */
	private getHpColor(pct: number): number {
		if (pct < 0.1) {
			return Colors.RED;
		} else if (pct < 0.25) {
			return Colors.ORANGE;
		} else if (pct < 0.5) {
			return Colors.YELLOW;
		} else if (pct < 1) {
			return Colors.GREEN;
		} else {
			return Colors.BLUE;
		}
	}

	/**
	 * Returns the color in which to show the entity's hunger meter.
	 * @param pct - The percentage of hunger.
	 */
	private getHungerColor(pct: number): number {
		if (pct < 0.1) {
			return Colors.RED;
		} else if (pct < 0.2) {
			return Colors.ORANGE;
		} else {
			return Colors.YELLOW;
		}
	}
}

/**
 * Displays a single equipped item.
 */
class ItemListing extends Container {
	private bg: Graphics;
	private _item: Item;
	private sprite: GraphicsObject;

	/**
	 * Constructs a new slot for an equipped item.
	 */
	public constructor() {
		super();

		this.bg = new Graphics();
		this.bg.beginFill(Colors.BLACK, .9);
		this.bg.drawCircle(0, 0, 12);
		this.addChild(this.bg);
	}

	/**
	 * The item displayed in this ItemListing.
	 */
	public set item(item: Item) {
		if (item === undefined) {
			if (this._item !== undefined) {
				this.removeChild(this.sprite);
			}
			this.sprite = undefined;
		} else if (this._item === undefined || this._item.name !== item.name) {
			if (this._item !== undefined) {
				this.removeChild(this.sprite);
			}
			this.sprite = new GraphicsObject(GraphicsDescriptorCache.getGraphics(item.graphics));
			this.sprite.y = -2;
			this.addChild(this.sprite);
			this.sprite.prerender();
		}

		this._item = item;
	}

	public get item() {
		return this._item;
	}
}