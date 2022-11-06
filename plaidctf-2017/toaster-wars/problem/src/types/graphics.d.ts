/// <reference types="pixi.js" />

/**
 * Describes a graphics object.
 */
interface GraphicsObjectDescriptor {
	base: string;
	animations: { [key: string]: AnimationDescriptor };
}

/**
 * Describes the graphics for a dungeon tile given the wall pattern around it.
 */
interface DungeonTileSelector {
	pattern: number;
	object: GraphicsObjectDescriptor;
}

/**
 * Describes an entity's graphics.
 */
interface EntityGraphicsDescriptor {
	useReflection?: boolean;
	descriptors: { [key: number]: GraphicsObjectDescriptor };
}

interface ExpandedGraphicsObjectDescriptor {
	[key: string]: ExpandedAnimationDescriptor;
}

/**
 * Describes an entity's graphics.
 */
type ExpandedEntityGraphicsDescriptor = ExpandedGraphicsObjectDescriptor[];

/**
 * Describes an animation.
 */
type AnimationDescriptor = FrameDescriptor[];

type ExpandedAnimationDescriptor = ExpandedFrameDescriptor[];

/**
 * Describes a single frame of an animation.
 */
interface FrameDescriptor {
	sprites: SpriteDescriptor[];
	duration: number;
}

interface ExpandedFrameDescriptor {
	texture: PIXI.Texture;
	anchor: Point;
	duration: number;
}

/**
 * Describes a single frame.
 */
interface SpriteDescriptor {
	texture: string;
	anchor: Point;
	offset?: number;
}