interface ItemBlueprint {
	name: string;
	description: string;
	equip?(entity: UnplacedCrawlEntity): UnplacedCrawlEntity; // via a proxy
	handlers: {
		use?(entity: CrawlEntity, state: InProgressCrawlState, item: Item, held: boolean, eventLog: LogEvent[]): void;
		throwTarget?(entity: CrawlEntity, state: InProgressCrawlState, item: Item, direction: number): CrawlLocation;
		entityDefeat?(entity: CrawlEntity, state: InProgressCrawlState, item: Item, held: boolean, eventLog: LogEvent[]): void;
		collide?(entity: CrawlEntity, state: InProgressCrawlState, item: Item, eventLog: LogEvent[]): void;
		pickup?(entity: CrawlEntity, state: InProgressCrawlState, item: Item, eventLog: LogEvent[]): boolean;
	};
	actions?: {
		[action: string]: string[]; // In reality, index is ItemActionType
	};
	amount?: number;
	graphics: string;
}

interface Item extends ItemBlueprint {
	id: string;
}

interface ItemSet {
	capacity: number;
	items: Item[];
}

declare const enum ItemHook {
	ITEM_USE,
	ITEM_THROW,
	ENTITY_DEFEAT
}

type ItemActionType = "use" | "throw" | "drop" | "equip" | "unequip";