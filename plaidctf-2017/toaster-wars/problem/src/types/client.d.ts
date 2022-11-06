interface UpdateMessage {
	stateUpdate: StateUpdate;
	log: LogEvent[];
	move: boolean;
}

interface StateUpdate {
	floor: FloorUpdate;
	entities: (CensoredCrawlEntity | CensoredSelfCrawlEntity)[];
	items: CrawlItem[];
	self: CensoredSelfEntity;
}

interface CensoredSelfEntity {
	name: string;
	location: CrawlLocation;
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
}

interface FloorUpdate {
	number: number;
	mapUpdates: MapUpdate[];
}

interface MapUpdate {
	location: CrawlLocation;
	tile: DungeonTile;
}

interface ActionOptions {
	dash?: boolean;
}

interface CensoredClientCrawlState {
	dungeon: CensoredDungeon;
	floor: Floor;
	entities: CensoredCrawlEntity[];
	items: CrawlItem[];
	self: CensoredSelfEntity;
}

interface Viewport {
	r: [number, number];
	c: [number, number];
}

interface ClientOverworldScene {
	scene: OverworldScene;
	self: SelfOverworldEntity;
}

interface ClientOverworldEntity {
	position: Point;
}

interface SelfOverworldEntity extends Entity {
	position: Point;
	direction: number;
}

type ClientInteractionResponse = number;
