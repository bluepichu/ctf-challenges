"use strict";

import * as data   from "../../test-data";
import * as test   from "../../test-utils";

import * as rewire from "rewire";

let crawl = rewire("../../../src/server/logic-layer/crawl");

export function testCrawl() {
	describe("crawl", () => {
		describe("isValidMove()", () => {
			let isValidMove = crawl.__get__("isValidMove") as
				(state: InProgressCrawlState, entity: CrawlEntity, direction: number) => boolean;

			it("should accept valid moves within rooms", () =>
				test.eq(isValidMove(data.inProgressState, data.entity1, 0), true));
			it("should accept valid moves within rooms", () =>
				test.eq(isValidMove(data.inProgressState, data.entity1, 2), true));
			it("should accept valid moves within rooms", () =>
				test.eq(isValidMove(data.inProgressState, data.entity1, 7), true));
			it("should reject invalid moves within rooms", () =>
				test.eq(isValidMove(data.inProgressState, data.entity1, 6), false));
			it("should reject invalid moves between rooms and hallways", () =>
				test.eq(isValidMove(data.inProgressState, data.entity1, 5), false));
			it("should accept valid moves within hallways", () =>
				test.eq(isValidMove(data.inProgressState, data.entity5, 2), true));
			it("should accept valid moves within hallways", () =>
				test.eq(isValidMove(data.inProgressState, data.entity5, 6), true));
			it("should reject invalid moves within hallways", () =>
				test.eq(isValidMove(data.inProgressState, data.entity5, 3), false));
			it("should reject invalid moves within hallways", () =>
				test.eq(isValidMove(data.inProgressState, data.entity5, 1), false));
			it("should reject otherwise-valid moves to occupied locations", () =>
				test.eq(isValidMove(data.inProgressState, data.entity6, 6), false));
			it("should reject moves to locaitons outside the map", () =>
				test.eq(isValidMove(data.inProgressState, data.entity7, 4), false));
		});
	});
}