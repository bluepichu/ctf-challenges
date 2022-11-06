"use strict";

/**
 * Checks if the given point is inside the given polygon using the winding number algorithm.
 * @param point - The point.
 * @param polygon - The polygon.  Must be simple.
 * @return Whether or not the point is inside the polygon.
 */
export function pointInPolygon(point: Point, polygon: Polygon): boolean {
	let winding = 0;
	let poly = polygon.map((pt) => subtract(pt, point));
	let quad = quadrant(poly[0]);

	for (let i = 1; i <= poly.length; i++) {
		let next = poly[i % poly.length];
		let nextQuad = quadrant(next);

		if ((quad + 2) % 4 === nextQuad) {
			// The edge went form a quadrant to the opposite quadrant
			// Did it pass above or below the point?
			let last = poly[i - 1];
			if (next.y / next.x >= last.y / last.x) {
				winding -= 2;
			} else {
				winding += 2;
			}
		} else if ((quad + 1) % 4 === nextQuad) {
			// The edge moved to the next quadrant clockwise
			winding++;
		} else if ((quad + 3) % 4 === nextQuad) {
			// The edge moved to the previous quadrant clockwise
			winding--;
		}

		quad = nextQuad;
	}

	if (winding % 4 !== 0) {
		throw new Error("Winding failed: winding count was not a multiple of four.");
	}

	return winding !== 0;
}

/**
 * Checks if the given point is inside the given rectangle.
 * @param point - The point.
 * @param rect - The rectangle.
 * @return Whether or not the point is inside the recetangle.
 */
export function pointInRect(point: Point, rect: Rect): boolean {
	return rect.x.min <= point.x && point.x <= rect.x.max && rect.y.min <= point.y && point.y <= rect.y.max;
}

/**
 * Returns which (0-indexed) quadrant a point is in.
 * @param point - The point.
 * @return Which quadrant the point is in.
 */
function quadrant(point: Point): number {
	if (point.x >= 0 && point.y >= 0) {
		return 0;
	} else if (point.x < 0 && point.y >= 0) {
		return 1;
	} else if (point.x < 0 && point.y < 0) {
		return 2;
	} else {
		return 3;
	}
}

/**
 * Subtracts one point from another.
 * @param a - The base point.
 * @param b - The point to subtract from a.
 * @return The point b - a.
 */
export function subtract(a: Point, b: Point): Point {
	return { x: a.x - b.x, y: a.y - b.y };
}

/**
 * Returns the magnitude of a point.
 * @param p - The point.
 * @return The magnitude of p.
 */
function magnitude(p: Point): number {
	return Math.sqrt(p.x * p.x + p.y * p.y);
}

/**
 * Returns the distance between two points.
 * @param a - The first point.
 * @param b - The second point.
 * @return The distance between a and b.
 */
export function dist(a: Point, b: Point): number {
	return magnitude(subtract(a, b));
}