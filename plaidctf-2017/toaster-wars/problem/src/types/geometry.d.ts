/**
 * A point in 2D space.
 */
interface Point {
	x: number;
	y: number;
}

/**
 * A polygon in 2D space.
 */
type Polygon = Point[];

interface Rect {
	x: { min: number, max: number };
	y: { min: number, max: number };
}