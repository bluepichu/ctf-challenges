"use strict";

import {
	CanvasRenderer,
	Container,
	Graphics,
	Text,
	TextStyleOptions,
	WebGLRenderer
} from "pixi.js";

import MultiStyleText, { TextStyleSet } from "pixi-multistyle-text";

import Colors     from "./colors";
import GameSocket from "./game-socket";
import Messages   from "./messages";
import MessageLog from "./message-log";

/**
 * The styling used for the command area when it is inactive.
 */
const COMMAND_AREA_INACTIVE_STYLE: TextStyleOptions = {
	fontFamily: "Lato",
	fontSize: "16px",
	fontWeight: "300",
	fill: Colors.GRAY_5
};

/**
 * The styling used for the command area when it is active.
 */
const COMMAND_AREA_ACTIVE_STYLE: TextStyleOptions = {
	fontFamily: "Lato",
	fontSize: "16px",
	fontWeight: "400",
	fill: Colors.WHITE
};

/**
 * The stylings used for the suggestion headlines.
 */
const COMMAND_AREA_SUGGESTION_STYLES: TextStyleSet = {
	default: {
		fontFamily: "Lato",
		fontSize: "14px",
		fontWeight: "400",
		fill: Colors.WHITE
	},
	item: {
		fill: Colors.BLUE
	},
	minor: {
		fill: Colors.GRAY_5
	}
};

/**
 * The stylings used for the suggestion descriptions.
 */
const COMMAND_AREA_DESCRIPTION_STYLES: TextStyleSet = {
	default: {
		fontFamily: "Lato",
		fontSize: "10px",
		fontWeight: "400",
		fill: Colors.WHITE,
		wordWrap: true,
		wordWrapWidth: 240
	},
	item: {
		fill: Colors.BLUE
	}
};

/**
 * The text displayed in the command area when it is not active.
 */
const COMMAND_AREA_DEFAULT_TEXT = "Press space to input a command...";

interface Handler {
	label: string;
	description: string;
	handler(): any;
}

/**
 * An input area that allows a user to select one of a list of commands, with autocompletion.
 */
export default class CommandArea extends Container {
	public onInvalid: (cmd: string) => any;

	private _active: boolean;
	private background: Graphics;
	private textInput: Text;
	private suggestions: Suggestion[];
	private buffer: string;
	private inputPromptFlashFrameCount: number;
	private handlers: { [key: string]: Handler };
	private highlighted: number;

	/**
	 * Constructs a new CommandArea with no suggestions.
	 */
	public constructor() {
		super();

		this.background = new Graphics();
		this.background.beginFill(0x666666);
		this.background.drawRect(0, 0, 300, 36);
		this.background.endFill();

		this.textInput = new Text(COMMAND_AREA_DEFAULT_TEXT);
		this.textInput.x = 8;
		this.textInput.y = 8;

		this.addChild(this.background);
		this.addChild(this.textInput);

		this.active = false;
		this.handlers = {};
		this.suggestions = [];
		this.highlighted = 0;

		document.addEventListener("keydown", (event) => this.keypress(event));
	}

	/**
	 * Whether or not the command area is active.  When active, a blinking cursor is displayed, different styles are,
	 *     used, and keyboard events are captured and taken as typing into the command area.
	 */
	public get active(): boolean {
		return this._active;
	}

	public set active(active: boolean) {
		this._active = active;

		if (active) {
			this.textInput.style = COMMAND_AREA_ACTIVE_STYLE as PIXI.TextStyle;
			this.buffer = "";
			this.inputPromptFlashFrameCount = 0;
			this.highlighted = 0;
		} else {
			this.textInput.style = COMMAND_AREA_INACTIVE_STYLE as PIXI.TextStyle;
			this.buffer = COMMAND_AREA_DEFAULT_TEXT;
		}
	}

	/**
	 * Handles a keypress event.
	 * @param event - The KeyboardEvent to handle.
	 */
	public keypress(event: KeyboardEvent): void {
		event.preventDefault();
		event.stopImmediatePropagation();

		if (!this.active) {
			if (event.key === " ") {
				this.active = true;
				this.resetSuggestions();
				event.stopImmediatePropagation();
			}
			return;
		}

		switch (event.key) {
			case "ArrowDown":
				this.suggestions[this.highlighted].highlighted = false;
				this.highlighted++;
				this.highlighted = Math.min(this.highlighted, this.suggestions.length - 1);
				this.suggestions[this.highlighted].highlighted = true;
				this.repositionSuggestions();
				return;

			case "ArrowUp":
				this.suggestions[this.highlighted].highlighted = false;
				this.highlighted--;
				this.highlighted = Math.max(this.highlighted, 0);
				this.suggestions[this.highlighted].highlighted = true;
				this.repositionSuggestions();
				return;

			case "Enter":
				this.enter();
				this.active = false;
				break;

			case "Escape":
				this.active = false;
				break;

			case "Backspace":
				if (this.buffer.length > 0) {
					this.buffer = this.buffer.slice(0, -1);
				}
				break;

			default:
				this.highlighted = 0;
				if (event.key.length === 1) {
					this.buffer += event.key;
				}
				break;
		}

		this.resetSuggestions();
		this.inputPromptFlashFrameCount = 0;
	}

	/**
	 * Calls the handler associated with the currently-selected suggestion, if one exists, or logs that the given
	 *     command is invalid.
	 */
	private enter(): void {
		let command = this.suggestions.length > 0
			? this.suggestions[this.highlighted].value
			: this.buffer.toLowerCase();

		if (command in this.handlers) {
			this.handlers[command].handler();
		} else if (this.onInvalid) {
			this.onInvalid(`<command>${command}</command> is not a valid command.`);
		}
	}

	/**
	 * Called before rendering.  Shows the blinking cursor and updates the text in the command area.
	 */
	private prerender(): void {
		this.inputPromptFlashFrameCount++;
		this.inputPromptFlashFrameCount %= 60;

		this.textInput.text = this.buffer + (this.active && this.inputPromptFlashFrameCount < 30 ? "|" : "");
	}

	/**
	 * Repositions the suggestions shown below the CommandArea.
	 */
	private repositionSuggestions() {
		let y = 36;

		this.suggestions.forEach((suggestion, index) => {
			suggestion.y = y;
			y += suggestion.height;
		});
	}

	/**
	 * Renders the CommandArea using the given CanvasRenderer.
	 * @param renderer - The CanvasRenderer to use.
	 * @override
	 */
	public renderCanvas(renderer: CanvasRenderer): void {
		this.prerender();
		super.renderCanvas(renderer);
	}

	/**
	 * Renders the CommandArea using the given WebGLRenderer.
	 * @param renderer - The WebGLRenderer to use.
	 * @override
	 */
	public renderWebGL(renderer: WebGLRenderer): void {
		this.prerender();
		super.renderWebGL(renderer);
	}

	/**
	 * Clears all handlers.
	 */
	public clearHandlers(): void {
		this.handlers = {};
	}

	/**
	 * Adds a handler triggered by the given command.
	 * @param command - The command for which to trigger the handler.
	 * @param handler - The handler to trigger when the command is entered.
	 */
	public addHandler(command: string, handler: Handler): void {
		this.handlers[command.toLowerCase()] = handler;
	}

	/**
	 * Resets the displayed suggestions by refiltering and sorting them, then adding those that remain.
	 */
	private resetSuggestions(): void {
		this.suggestions.forEach((suggestion) => this.removeChild(suggestion));
		this.suggestions = [];

		Object.keys(this.handlers)
			.map((suggestion) => ({
				score: scoreSuggestion(this.buffer.toLowerCase(), suggestion.toLowerCase()),
				suggestion,
				label: this.handlers[suggestion].label,
				description: this.handlers[suggestion].description
			}))
			.filter((suggestion) => suggestion.score > 0)
			.sort((a, b) => b.score - a.score)
			.forEach((obj, index) => {
				let suggestion = new Suggestion(obj.label, obj.description, obj.suggestion);
				suggestion.highlighted = index === 0;
				this.addChild(suggestion);
				suggestion.x = 20;
				this.suggestions.push(suggestion);
			});

		this.repositionSuggestions();
	}
}

/**
 * The method used for scoring suggestions.  Suggestions with higher scores are shown first.
 * @param input - The user's input.
 * @param suggestion - The suggestion to score.
 * @return The score for the given suggestion on the given input.
 */
function scoreSuggestion(input: string, suggestion: string): number {
	let index = 0;
	let difference = 0;
	let score = 1 / suggestion.length;
	for (let character of input) {
		while (index < suggestion.length && suggestion.charAt(index) !== character) {
			index++;
			difference++;
		}
		if (index === suggestion.length) {
			return 0;
		}
		score += 100 - difference;
		difference = 0;
	}
	return score;
}

/**
 * A single suggestion display inside of a CommandArea.
 */
class Suggestion extends Container {
	private background: Graphics;
	private text: MultiStyleText;
	private desc: MultiStyleText;
	private _value: string;

	/**
	 * Constructs a new Suggestion.
	 * @param label - The headline to show for this suggestion.
	 * @param description - The discription to show for this suggestion when it is highlighted.
	 * @param value - The internal value given back to the CommandArea if this Suggestion is selected.
	 */
	public constructor(label: string, description: string, value: string) {
		super();

		this.background = new Graphics();
		this.addChild(this.background);

		this.text = new MultiStyleText(label, COMMAND_AREA_SUGGESTION_STYLES);
		this.text.x = 12;
		this.text.y = 6;
		this.addChild(this.text);

		this.desc = new MultiStyleText(description, COMMAND_AREA_DESCRIPTION_STYLES);
		this.desc.x = 18;
		this.desc.y = 28;
		this.addChild(this.desc);

		this.highlighted = false;
		this._value = value;
	}

	/**
	 * Whether or not this suggestion is highlighted.
	 */
	public set highlighted(highlighted: boolean) {
		this.background.clear();
		this.background.beginFill(highlighted ? Colors.GRAY_2 : Colors.GRAY_1);
		this.background.lineStyle(0);
		this.background.drawRect(0, 0, 280, highlighted ? 36 + this.desc.height : 28);
		this.desc.visible = highlighted;
	}

	/**
	 * This suggestion's internal value.
	 */
	public get value() {
		return this._value;
	}
}