"use strict";

import {inspect}      from "util";
import * as sourcemap from "source-map-support";

sourcemap.install();

/**
 * Throws an error if the two values aren't equal.
 * @param test - The first value.
 * @param answer - The second value.
 */
export function eq(test: number, answer: number): void;
export function eq(test: string, answer: string): void;
export function eq<T>(test: T, answer: T): void;
export function eq<T>(test: T[], answer: T[]): void;

export function eq<T>(test: any, answer: any): void {
	if ((typeof test === "number") || (typeof test === "string") || (typeof test === "boolean")) {
		if (test !== answer) {
			throw new Error(`Expected ${inspect(answer)} but received ${inspect(test)}`);
		}

		return;
	}

	if (Array.isArray(test)) {
		let testArr = test as T[];
		let answerArr = answer as T[];

		if (testArr.length !== answerArr.length) {
			throw new Error(
				`Expected array of length ${answerArr.length} but received array of length ${testArr.length}`);
		}

		for (let i = 0; i < test.length; i++) {
			try {
				eq(testArr[i], answerArr[i]);
			} catch (e) {
				throw new Error(`Expected ${inspect(answerArr[i])} at index ${i} but received ${inspect(testArr[i])}`);
			}
		}

		return;
	}

	for (let key in test) {
		if (!(key in answer)) {
			throw new Error(`Did not expect key "${key}"`);
		}

		try {
			eq(test[key], answer[key]);
		} catch (e) {
			throw new Error(`Expected ${inspect(answer[key])} at key "${key}" but received ${inspect(test[key])}`);
		}
	}

	for (let key in answer) {
		if (!(key in test)) {
			throw new Error(`Expected key ${key}`);
		}
	}
}

/**
 * Exits cleanly if the function throws an error, or throws an error if the function exits without error.
 */
export function error(f: () => any): void {
	let failed = true;

	try {
		f();
	} catch (e) {
		failed = false;
	}

	if (failed) {
		throw new Error("Expected an Error but none was thrown");
	}
}