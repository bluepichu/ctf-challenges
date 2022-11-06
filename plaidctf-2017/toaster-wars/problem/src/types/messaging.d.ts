interface WrappedInMessage {
	socketId: string;
	message: InMessage;
}

type InMessage = StartCrawlInMessage | CrawlActionInMessage | DisconnectInMessage;

interface StartCrawlInMessage {
	type: "crawl-start";
	dungeon: string;
	entity: UnplacedCrawlEntity;
}

interface CrawlActionInMessage {
	type: "crawl-action";
	action: Action;
	options: ActionOptions;
}

interface DisconnectInMessage {
	type: "disconnect";
}



interface WrappedOutMessage {
	socketId: string;
	message: OutMessage;
}

type OutMessage = GetActionOutMessage | InvalidActionOutMessage | CrawlEndOutMessage;

interface GetActionOutMessage {
	type: "crawl-get-action";
	update: UpdateMessage;
}

interface InvalidActionOutMessage {
	type: "crawl-action-invalid";
}

interface CrawlEndOutMessage {
	type: "crawl-end";
	result: ConcludedCrawlState;
	log: LogEvent[];
}