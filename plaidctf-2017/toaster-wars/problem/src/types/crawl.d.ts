type CrawlState = InProgressCrawlState | ConcludedCrawlState;

interface InProgressCrawlState {
	dungeon: Dungeon;
	floor: Floor;
	entities: CrawlEntity[];
	items: CrawlItem[];
}

interface ConcludedCrawlState {
	dungeon: Dungeon;
	success: boolean;
	floor: number;
}

interface Dungeon {
	name: string;
	floors: number;
	direction: "up" | "down";
	difficulty: number;
	blueprint: DungeonBlueprint;
	graphics: string;
}

interface Floor {
	number: number;
	map: FloorMap;
}

type CrawlItem = Item & Locatable;

interface FloorMap {
	width: number;
	height: number;
	grid: DungeonTile[][];
}

interface DungeonTile {
	type: DungeonTileType;
	roomId?: number;
	stairs?: boolean;
}

declare const enum DungeonTileType {
	UNKNOWN,
	FLOOR,
	WALL
}

interface CrawlLocation {
	r: number;
	c: number;
	direction?: number;
}

interface Locatable {
	location: CrawlLocation;
}

interface UnplacedCrawlEntity extends Entity {
	alignment: number;
	ai: boolean;
	status: StatusCondition[];
}

declare const enum StatusCondition {
	CONFUSED,
	SHORT_CIRCUITED,
	POISONED
}

interface CrawlEntity extends UnplacedCrawlEntity, Locatable {
	map: FloorMap;
}

interface CondensedEntity {
	id: string;
	name: string;
	graphics: string;
}

type LogEvent = WaitLogEvent | MoveLogEvent | AttackLogEvent | StatLogEvent | DefeatLogEvent | StairsLogEvent
	| StartLogEvent | MissLogEvent | MessageLogEvent | ItemPickupLogEvent | ItemDropLogEvent | ItemThrowLogEvent
	| ItemFallLogEvent | StatusAfflictionLogEvent | StatusRecoveryLogEvent;

interface WaitLogEvent {
	type: "wait";
	entity: CondensedEntity;
	location: CrawlLocation;
}

interface MoveLogEvent {
	type: "move";
	entity: CondensedEntity;
	start: CrawlLocation;
	end: CrawlLocation;
	direction: number;
}

interface AttackLogEvent {
	type: "attack";
	entity: CondensedEntity;
	location: CrawlLocation;
	attack: Attack;
	direction: number;
}

interface StatLogEvent {
	type: "stat";
	entity: CondensedEntity;
	location: CrawlLocation;
	stat: string;
	change: number;
}

interface DefeatLogEvent {
	type: "defeat";
	entity: CondensedEntity;
}

interface StairsLogEvent {
	type: "stairs";
	entity: CondensedEntity;
}

interface StartLogEvent {
	type: "start";
	entity: CondensedEntity;
	floorInformation: {
		number: number;
		width: number;
		height: number;
	};
	self: CensoredSelfCrawlEntity;
}

interface MissLogEvent {
	type: "miss";
	entity: CondensedEntity;
	location: CrawlLocation;
}

interface MessageLogEvent {
	type: "message";
	entity: CondensedEntity;
	message: string;
}

interface ItemPickupLogEvent {
	type: "item_pickup";
	entity: CondensedEntity;
	item: Item;
}

interface ItemDropLogEvent {
	type: "item_drop";
	entity: CondensedEntity;
	item: Item;
}

interface ItemThrowLogEvent {
	type: "item_throw";
	entity: CondensedEntity;
	item: Item;
	from: CrawlLocation;
	to: CrawlLocation;
	direction: number;
}

interface ItemFallLogEvent {
	type: "item_fall";
	item: Item;
}

interface StatusAfflictionLogEvent {
	type: "status_affliction";
	entity: CondensedEntity;
	status: StatusCondition;
}

interface StatusRecoveryLogEvent {
	type: "status_recovery";
	entity: CondensedEntity;
	status: StatusCondition;
}

interface SynchronizedMessage<T> {
	id: string;
	last?: string;
	message: T;
}

type DungeonBlueprint = FloorRangeBlueprint[];

interface FloorRangeBlueprint {
	range: [number, number];
	blueprint: FloorBlueprint;
}

type FloorBlueprint = StaticFloorBlueprint | GeneratedFloorBlueprint;

interface StaticFloorBlueprint {
	type: "static";
	map: {
		width: number;
		height: number;
		grid: DungeonTile[][];
	};
	enemies: {
		blueprint: EntityBlueprint;
		location: CrawlLocation;
	}[];
	items: {
		blueprint: ItemBlueprint;
		location: CrawlLocation;
	}[];
	playerLocation: CrawlLocation;
}

interface GeneratedFloorBlueprint {
	type: "generated";
	generatorOptions: GeneratorOptions;
	enemies: EntityBlueprint[];
	items: DungeonItemBlueprint[];
}

interface DungeonItemBlueprint {
	density: Distribution;
	item: ItemBlueprint;
}

interface EntityBlueprint {
	density: Distribution;
	name: string;
	graphics: string;
	stats: EntityStats;
	attacks: AttackBlueprint[];
}

interface AttackBlueprint {
	weight: number;
	attack: Attack;
}

interface GeneratorOptions {
	width: Distribution;
	height: Distribution;
	features: {
		rooms: Feature[];
		corridors: Feature[];
	};
	limit: number;
	cleanliness: number;
}

interface Feature {
	width: number;
	height: number;
	weight: number;
	grid: string[];
}

type Action = WaitAction | MoveAction | AttackAction | ItemAction | StairsAction;

interface WaitAction {
	type: "wait";
}

interface MoveAction {
	type: "move";
	direction: number;
}

interface AttackAction {
	type: "attack";
	direction: number;
	attack: Attack;
}

interface ItemAction {
	type: "item";
	direction: number;
	action: ItemActionType;
	item: string;
}

interface StairsAction {
	type: "stairs";
}

interface CensoredInProgressCrawlState {
	dungeon: CensoredDungeon;
	floor: Floor;
	entities: (CensoredCrawlEntity | CensoredSelfCrawlEntity)[];
	items: CrawlItem[];
}

interface CensoredEntityCrawlState extends CensoredInProgressCrawlState {
	self: CensoredSelfCrawlEntity;
}

interface CensoredDungeon {
	name: string;
	floors: number;
	direction: "up" | "down";
	difficulty: number;
	graphics: string;
}

interface CensoredCrawlEntity extends Locatable {
	name: string;
	graphics: string;
	id: string;
	alignment: number;
	ai: boolean;
	stats: CensoredEntityStats;
	status: StatusCondition[];
}

interface CensoredEntityStats {
	attack: { modifier: number };
	defense: { modifier: number };
}

interface CensoredSelfCrawlEntity extends Locatable {
	name: string;
	graphics: string;
	id: string;
	attacks: Attack[];
	stats: EntityStats;
	alignment: number;
	ai: boolean;
	items: {
		held: ItemSet;
		bag?: ItemSet;
	};
	// map: FloorMap;
	status: StatusCondition[];
}
