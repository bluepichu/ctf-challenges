"use strict";

import {
	Container,
	Graphics
} from "pixi.js";

import MultiStyleText, { TextStyleSet } from "pixi-multistyle-text";

import Colors from "./colors";

/**
 * The stylings used for menu options.
 */
const OPTION_STYLES: TextStyleSet = {
	default: {
		fontFamily: "Lato",
		fontSize: "16px",
		fontWeight: "400",
		fill: Colors.BLACK,
		align: "right",
		wordWrapWidth: 580
	},
	self: {
		fill: Colors.YELLOW
	},
	ally: {
		fill: Colors.ORANGE
	},
	enemy: {
		fill: Colors.RED
	},
	item: {
		fill: Colors.BLUE
	},
	command: {
		fill: Colors.PURPLE
	},
	attack: {
		fill: Colors.BROWN
	}
};

/**
 * An onscreen menu.
 */
export default class Menu extends Container {
	private _selection: number;
	private options: Option[];

	/**
	 * Constructs a new Menu with the given options.
	 * @param options - The options to show in the menu.
	 */
	public constructor(options: string[]) {
		super();

		this._selection = 0;

		let bg = new Graphics();
		this.addChild(bg);

		this.options = options.map((text, i) => {
			let opt = new Option(text);
			opt.y = i * 20;
			this.addChild(opt);
			return opt;
		});

		bg.beginFill(Colors.WHITE);
		bg.lineStyle(4, Colors.BLACK);
		bg.drawRect(-10, -10, this.options.reduce((last, opt) => Math.max(last, opt.width), 200) + 30, options.length * 20 + 20);

		this.options[0].selected = true;
	}

	/**
	 * Moves the selection to the next option.
	 */
	public next(): void {
		this.options[this._selection].selected = false;
		this._selection++;
		this._selection %= this.options.length;
		this.options[this._selection].selected = true;
	}

	/**
	 * Moves the selection to the previous option.
	 */
	public prev(): void {
		this.options[this._selection].selected = false;
		this._selection--;
		this._selection += this.options.length;
		this._selection %= this.options.length;
		this.options[this._selection].selected = true;
	}

	/**
	 * The current selection.
	 */
	public get selection(): number {
		return this._selection;
	}
}

/**
 * A single option in a menu.
 */
class Option extends Container {
	private text: MultiStyleText;
	private pointer: Graphics;
	private bg: Graphics;

	/**
	 * Constructs a new menu option.
	 * @param text - The text of this menu option.
	 */
	public constructor(text: string) {
		super();

		this.pointer = new Graphics();
		this.pointer.x = 4;
		this.pointer.y = 4;
		this.pointer.beginFill(Colors.BLACK);
		this.pointer.drawPolygon([-4, 0, 2, 5, -4, 10]);
		this.addChild(this.pointer);

		this.text = new MultiStyleText(text, OPTION_STYLES);
		this.text.x = 12;
		this.addChild(this.text);

		this.selected = false;
	}

	/**
	 * Whether or not this option is currently selected.
	 */
	public set selected(sel: boolean) {
		this.pointer.visible = sel;
	}
}