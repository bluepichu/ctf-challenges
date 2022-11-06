"use strict";

import { testUtils } from "./utils-test";
import { testQueue } from "./queue-test";

export function testCommon() {
	describe("common", () => {
		testUtils();
		testQueue();
	});
}