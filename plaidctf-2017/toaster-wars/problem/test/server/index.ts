"use strict";

import { testLogicLayer } from "./logic-layer";

export function testServer() {
	describe("server", () => {
		testLogicLayer();
	});
}