"use strict";

import { testCrawl }     from "./crawl-test";
import { testGenerator } from "./generator-test";

export function testLogicLayer() {
	describe("game", () => {
		testCrawl();
		testGenerator();
	});
}