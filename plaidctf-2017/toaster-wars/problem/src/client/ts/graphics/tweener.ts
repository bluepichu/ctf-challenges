"use strict";

type TweenType = "linear" | "smooth";

let tweens: Tween[] = [];

/**
 * Tweens an object's properties to a new value.
 * @param obj - The object whose property to tween.
 * @param properties - A mapping of properties to target values.
 * @param velocity - The speed at which to tween.
 * @param type - The easing of the tween.  "linear" will do linear easing; "smooth" will do exponential easing.
 * @return A promise that resolves when the tween reaches its final value.
 */
export function tween(obj: any, properties: any, velocity: number, type?: TweenType): Thenable {
	// Fire the completion event for all tweens that will be deleted
	tweens
		.filter((tween) => tween.object === obj && tween.onComplete !== undefined)
		.forEach((tween) => tween.onComplete());

	// Delete tweens that conflict with the new one
	tweens = tweens.filter((tween) => tween.object !== obj);

	// Add the new tweens
	let promises: Thenable[] = [];

	for (let key in properties) {
		promises.push(new Promise((resolve, reject) => {
			tweens.push(new Tween(obj, key, properties[key], velocity, type, resolve));
		}));
	}

	return Promise.all(promises);
}

/**
 * Steps all tweens forward by one frame.
 */
export function step() {
	tweens = tweens.filter((tween) => tween.step());
}

/**
 * Represents a single tween.
 */
class Tween {
	public object: any;
	public key: string;
	public target: number;
	public velocity: number;
	public type: TweenType;
	public onComplete: Function;

	/**
	 * Constructs a new Tween, representing a transition from the object's current values at the given property to the
	 *     given target value, moving at the given velocity, using the given type of tween.
	 * @param obj - The object whose property to tween.
	 * @param key - The property of the object to tween.
	 * @param target - The target value for the property.
	 * @param velocity - The speed at which to tween.
	 * @param type - The type of tween.
	 * @param onComplete - A function to call when the tween is complete.
	 */
	constructor(obj: any, key: string, target: number, velocity: number, type: TweenType = "linear", onComplete?: Function) {
		this.object = obj;
		this.key = key;
		this.target = target;
		this.velocity = velocity;
		this.type = type;
		this.onComplete = onComplete;
	}

	/**
	 * Steps the tween forward by a single frame.
	 * @return Whether or not the tween is still active.  (False if the property has reached the target value.)
	 */
	public step(): boolean {
		if (this.type === "linear") {
			if (Math.abs(this.object[this.key] - this.target) < this.velocity) {
				this.object[this.key] = this.target;

				if (this.onComplete) {
					this.onComplete();
				}

				return false;
			} else {
				if (this.object[this.key] > this.target) {
					this.object[this.key] -= this.velocity;
				} else {
					this.object[this.key] += this.velocity;
				}

				return true;
			}
		}

		if (this.type === "smooth") {
			if (Math.abs(this.object[this.key] - this.target) < .001) {
				this.object[this.key] = this.target;

				if (this.onComplete) {
					this.onComplete();
				}

				return false;
			} else {
				this.object[this.key] = (this.object[this.key] + this.target * (this.velocity - 1)) / this.velocity;

				return true;
			}
		}
	}
}