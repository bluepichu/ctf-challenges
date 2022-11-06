"use strict";

import {
	Container,
	CanvasRenderer,
	WebGLRenderer
} from "pixi.js";

/**
 * An extension of Pixi's Container that allows for a prerender function that adds processing on a per-frame basis.
 */
export default class PrerenderContainer extends Container {
	/**
	  * Constructs a new prerender container.
	  */
	public constructor(renderer: CanvasRenderer | WebGLRenderer) {
		super();
		renderer.on("prerender", () => this.prerender());
	}

	/**
	 * Called before the layer is rendered.  Intended to be overridden by implementing classes.
	 */
	public prerender(): void {}
}