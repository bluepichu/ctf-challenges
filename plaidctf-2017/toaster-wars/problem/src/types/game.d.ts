/**
 * The main state object for the entire game.
 */
interface State {
	story: StoryState;
	crawl?: CrawlState;
}

/**
 * An entity, either in the overworld or in a crawl.
 */
interface Entity {
	id: string;
	name: string;
	graphics: string;
	stats: EntityStats;
	attacks: Attack[];
	items: {
		held: ItemSet;
		bag?: ItemSet;
	};
	attributes: Attribute[];
	salt: number;
}

declare const enum Attribute {
	IMMUNE_TO_SHORT_CIRCUIT
}

/**
 * Describes an entity's stats.
 */
interface EntityStats {
	level: number;
	hp: MaxCurrentStat;
	attack: BaseModifierStat;
	defense: BaseModifierStat;
	energy: MaxCurrentStat;
}

/**
 * A stat consisting of a maximum value and a current value.
 */
interface MaxCurrentStat {
	max: number;
	current: number;
}

/**
 * A stat consisting of a base value and a modifier value.
 */
interface BaseModifierStat {
	base: number;
	modifier: number;
}