"use strict";

import {
	Container,
	Graphics,
	TextStyle
} from "pixi.js";

import MultiStyleText, { TextStyleSet } from "pixi-multistyle-text";

import Colors         from "./colors";
import * as Tweener   from "./graphics/tweener";

/**
 * Text styles used in the message log.
 */
const MESSAGE_LOG_STYLES: TextStyleSet = {
	default: {
		fontFamily: "Lato",
		fontSize: "16px",
		fontWeight: "300",
		fill: Colors.WHITE,
		align: "right"
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
 * A log of messages.
 */
export default class MessageLog extends Container {
	private messages: Container[];
	private timeouts: NodeJS.Timer[];
	private spacing: number;
	private maximumHeight: number;
	private reverse: boolean;

	/**
	 * Constructs a new empty MessageLog.
	 */
	public constructor(reverse?: boolean) {
		super();
		this.messages = [];
		this.timeouts = [];

		this.spacing = 40;
		this.maximumHeight = 400;
		this.reverse = reverse || false;
	}

	/**
	 * Displays the given message at the end of the message log.
	 * @param message - The message to show.
	 * @param timeout - The length of time the message is shown.
	 */
	public push(message: string, timeout: number = 4000): void {
		let msg = this.createMessage(message);
		this.addChild(msg);
		msg.x = -12;
		msg.y = msg.height + 12;

		this.messages.unshift(msg);

		this.repositionMessages();
		this.timeouts.unshift(setTimeout(() => this.pop(msg), timeout));
	}

	/**
	 * Repositions the messages in the log.
	 */
	private repositionMessages() {
		let height = 0;
		let i = 0;

		for (; i < this.messages.length; i++) {
			let message = this.messages[i];
			height += 12;

			if (height + message.height > this.maximumHeight) {
				break;
			}

			Tweener.tween(message, { x: this.reverse ? 12 : -12, y: -height }, 1.1, "smooth");

			height += message.height;
		}

		for (let j = this.messages.length - 1; j >= i; j--) {
			this.pop(this.messages[j]);
		}
	}

	/**
	 * Removes the given message from the log.
	 * @param messageToRemove - The message to remove.
	 */
	private pop(messageToRemove: Container): void {
		if (this.messages.length === 0) {
			return;
		}

		let index = this.messages.indexOf(messageToRemove);

		if (index === -1) {
			return;
		}

		clearTimeout(this.timeouts[index]);
		this.messages.splice(index, 1);
		this.timeouts.splice(index, 1);

		Tweener.tween(messageToRemove, { x: Math.max((this.reverse ? -1 : 1) * (messageToRemove.width + 100), 400) }, 1.1, "smooth")
			.then(() => {
				this.removeChild(messageToRemove);
				this.repositionMessages();
			});
	}

	/**
	 * Creates the Pixi display object representing the given message.
	 * @param message - The message to display.
	 */
	private createMessage(message: string): Container {
		let ret = new Container();

		let text = new MultiStyleText(message, MESSAGE_LOG_STYLES);
		text.anchor.x = this.reverse ? 0 : 1;
		text.anchor.y = 1;

		let bg = new Graphics();

		bg.beginFill(Colors.BLACK, .9);
		bg.drawRect(-text.width - 8, -text.height - 8, text.width + 16, text.height + 16);
		bg.endFill();

		ret.addChild(bg);
		ret.addChild(text);

		return ret;
	}

	/**
	 * Removes all messages from the log.
	 */
	public clear() {
		this.timeouts.forEach((timeout) => clearTimeout(timeout));
		this.timeouts = [];
		this.messages = [];
		this.removeChildren();
	}
}