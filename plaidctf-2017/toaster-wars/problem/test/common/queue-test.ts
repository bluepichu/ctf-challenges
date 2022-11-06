"use strict";

import * as test  from "../test-utils";

import { Queue } from "../../src/common/queue";

export function testQueue(): void {
	describe("queue", () => {
		describe("constructor()", () => {
			it("should construct an empty queue", () => {
				let queue = new Queue();

				test.eq(queue.size, 0);
				test.eq((queue as any).in, []);
				test.eq((queue as any).out, []);
			});
		});

		describe("from()", () => {
			it("should return an empty queue if given an empty iterable", () =>
				test.eq(Queue.from([]).size, 0));

			it("should return a queue containing the elements of the input iterable", () => {
				let queue = Queue.from([5, 4, 3, 2, 1]);

				for (let i = 5; i > 0; i--) {
					test.eq(queue.size, i);
					test.eq(queue.poll(), i);
				}

				test.eq(queue.size, 0);
				test.eq((queue as any).in, []);
				test.eq((queue as any).out, []);
			});

			it("should make a copy of the input iterable", () => {
				let arr = [1];
				let queue = Queue.from(arr);
				arr[0] = 2;
				test.eq(queue.poll(), 1);
			});
		});

		describe("add()", () => {
			it("should append the arguent to the in stack", () => {
				let queue = Queue.from([1, 2, 3, 4, 5]);
				queue.add(6);

				test.eq((queue as any).in, [1, 2, 3, 4, 5, 6]);
				test.eq((queue as any).out, []);
			});

			it("should append the arguent to the in stack", () => {
				let queue = Queue.from([1, 2, 3, 4, 5]);
				queue.poll();
				queue.add(6);

				test.eq((queue as any).in, [6]);
				test.eq((queue as any).out, [5, 4, 3, 2]);
			});
		});

		describe("poll()", () => {
			it("pop an item from the out stack if it exists", () => {
				let queue = Queue.from([1, 2, 3, 4, 5]);
				test.eq(queue.poll(), 1);
				test.eq(queue.poll(), 2);
				test.eq(queue.poll(), 3);
				test.eq(queue.poll(), 4);
				test.eq(queue.poll(), 5);
			});

			it("should reverse the in stack if the out stack is empty", () => {
				let queue = Queue.from([1, 2, 3, 4, 5]);
				test.eq(queue.poll(), 1);
				test.eq((queue as any).in, []);
				test.eq((queue as any).out, [5, 4, 3, 2]);
			});

			it("should return undefined if the queue is empty", () =>
				test.eq(new Queue().poll(), undefined));
		});

		describe("size", () => {
			it("should return 0 on an empty array", () =>
				test.eq(new Queue().size, 0));

			it("should return 1 on a queue with a single element in the in stack", () =>
				test.eq(Queue.from([1]).size, 1));

			it("should return 1 on a queue with a single element in the out stack", () => {
				let queue = Queue.from([1, 2]);
				queue.poll();
				test.eq(queue.size, 1);
			});

			it("should return the correct answer when both stacks have elements", () => {
				let queue = Queue.from([1, 2, 3, 4, 5]);
				queue.poll();
				queue.add(6);
				queue.add(7);
				queue.poll();
				queue.add(8);
				test.eq(queue.size, 6);
			});
		});
	});
}