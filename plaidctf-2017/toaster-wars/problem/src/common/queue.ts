"use strict";

/**
 * A standard queue data structure using two stacks for ammortized constant-time add and poll.
 */
export class Queue<T> {
	private in: T[];
	private out: T[];

	/**
	 * Constructs an empty queue.
	 */
	public constructor() {
		this.in = [];
		this.out = [];
	}

	/**
	 * Constructs a queue from the given iterable.  The resulting queue is not backed by the input iterable, so future
	 *     changes to the iterable do not affect the returned queue.  Total cost is O(n).
	 * @param iterable - The iterable from which to construct the queue.
	 * @return A queue containing the elements of the given iterable, in the order given by the iterable.
	 */
	public static from<T>(iterable: Iterable<T>): Queue<T> {
		let ret = new Queue<T>();
		ret.in = Array.from(iterable);
		return ret;
	}

	/**
	 * Adds the given element to the end of the queue.  Total cost is O(1).
	 * @param item - The item to add to the queue.
	 */
	public add(item: T): void {
		this.in.push(item);
	}

	/**
	 * Removes and returns the first element in the queue if it exists, and otherwise returns undefined.  Total cost is
	 *     O(1).
	 * @return The first item in the queue, or undefined if the queue is empty.
	 */
	public poll(): T {
		if (this.out.length === 0) {
			while (this.in.length > 0) {
				this.out.push(this.in.pop());
			}
		}

		return this.out.pop();
	}

	/**
	 * Returns the number of elements in the queue.  Total cost is O(1).
	 * @return The number of elements in the queue.
	 */
	public get size(): number {
		return this.in.length + this.out.length;
	}
}