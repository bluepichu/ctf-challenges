"use strict";

import * as crawl   from "./crawl";
import dungeons     from "../data/dungeons";
import * as printer from "./printer";
import * as utils   from "../../common/utils";

import * as bl      from "beautiful-log";
import * as kue     from "kue";
import * as nconf   from "nconf";
import * as redis   from "redis";
import * as random  from "seedrandom";
import * as shortid from "shortid";

nconf.argv().env();

let log: bl.CallableLogger;
let name: string;

const redisClient = redis.createClient({ host: nconf.get("redis-host") || "127.0.0.1", port: nconf.get("redis-port") || 6379 });

const genrand = () => random.xor128(shortid.generate()); // TODO: allow player to set/retrieve random seed

const games: Map<string, CrawlState> = new Map<string, CrawlState>();
const randoms: Map<string, () => number> = new Map<string, () => number>();
let queue: kue.Queue;

const names = ["Oran", "Pecha", "Rawst", "Cheri", "Chesto", "Sitrus"];

/**
 * Starts this logic node.
 * @param q - The job queue.
 */
export function start(q: kue.Queue): void {
	register().then((self) => {
		name = self;
		log = require("beautiful-log")(`dungeonkit:logic:${name}`, { showDelta: false });
		log(`Logic server "${name}" is up`);
		queue = q;

		queue.process(`in:${name}`, 1, (job: kue.Job, done: () => void) => {
			log("<-------- in");
			let { socketId, message } = job.data;
			try {
				receive(socketId, message, () => {
					// log throughput
					done();
				});
			} catch (e) {
				done();
			}
		});
	});
}

/**
 * Attempts to register this node by selecting a name that isn't in use and adding it to the shared list of logic nodes.
 * @return A promise that will resolve with the name this node is assigned.
 */
function register(): Promise<string> {
	return new Promise((resolve, reject) => {
		redisClient.zrange("dk:logic", 0, -1, (err: Error, keys: string[]) => {
			let candidates = names.filter((name) => keys.indexOf(name) < 0);
			let selectedName: string;

			if (candidates.length > 0) {
				selectedName = candidates[0];
			} else {
				selectedName = shortid.generate();
			}

			redisClient.zadd("dk:logic", 0, selectedName, (err: Error, added: number) => {
				if (added > 0) {
					resolve(selectedName);
				} else {
					register().then(resolve); // Name was taken, try again
				}
			});
		});
	});
}

/**
 * Processes a received message.
 * @param socketId - The socket id of the client that sent this message.
 * @param message - The message sent by the client.
 * @param callback - A function to call when processing is complete.
 */
function receive(socketId: string, message: InMessage, callback: () => void): void {
	switch (message.type) {
		case "crawl-start":
		case "crawl-action":
			if (!randoms.has(socketId)) {
				randoms.set(socketId, genrand());
			}

			Math.random = randoms.get(socketId);
			break;

		case "disconnect":
			randoms.delete(socketId);
			break;
	}

	switch (message.type) {
		case "crawl-start":
			handleCrawlStart(socketId, message.dungeon, message.entity, callback);
			break;

		case "crawl-action":
			handleCrawlAction(socketId, message.action, message.options, callback);
			break;

		case "disconnect":
			handleDisconnect(socketId, callback);
			break;
	}
}

/**
 * Sends a state update message to the given client.
 * @param socketId - The socket id of the client to which to send the message.
 * @param state - The crawl state to send.
 * @param eventLog - The event log to send.
 * @param mapUpdates - The map updates to send.
 * @param callback - The function to call when the message has been queued.
 */
function send(socketId: string, state: CrawlState, eventLog: LogEvent[], mapUpdates: MapUpdate[], callback: () => void): void {
	if (utils.isCrawlOver(state)) {
		let message: WrappedOutMessage = {
			socketId,
			message: {
				type: "crawl-end",
				result: state,
				log: eventLog
			}
		};

		queue.create("out", message).save((err: Error) => {
			if (err) {
				log.error(err);
			} else {
				callback();
			}
		});
	} else {
		games.set(socketId, state);

		// log(newState);
		// printer.printState(newState);

		let self = state.entities.filter((ent) => !ent.ai)[0];

		let censored = crawl.getCensoredState(state, self);

		let update: UpdateMessage = {
			stateUpdate: {
				floor: {
					number: state.floor.number,
					mapUpdates
				},
				entities: censored.entities,
				items: censored.items,
				self: censored.self
			},
			log: eventLog,
			move: true
		};

		let message: WrappedOutMessage = {
			socketId,
			message: {
				type: "crawl-get-action",
				update
			}
		};

		queue.create("out", message).save((err: Error) => {
			if (err) {
				log.error(err);
			} else {
				callback();
			}
		});
	}
}

/**
 * Handles a crawl start message.
 * @param socketId - The socket id of the client for which to start a crawl.
 * @param dungeon - The key of the dungeon in which to do the crawl.
 * @param entity - The entity to put in the crawl.
 * @param callback - A function to call when processing is complete.
 */
function handleCrawlStart(socketId: string, dungeon: string, entity: UnplacedCrawlEntity, callback: () => void): void {
	redisClient.zincrby("dk:logic", [1, name]);
	let eventLog: LogEvent[] = [];
	let mapUpdates: MapUpdate[] = [];
	let state = crawl.startCrawl(dungeons.get(dungeon), [entity], eventLog, mapUpdates);

	if (utils.isCrawlOver(state)) {
		// What?
	} else {
		let newState = crawl.step(state, eventLog, mapUpdates);

		let oldMap: FloorMap = {
			width: state.floor.map.width,
			height: state.floor.map.height,
			grid: Array.from(new Array(state.floor.map.height), () => Array.from(new Array((state as InProgressCrawlState).floor.map.width), () => ({ type: DungeonTileType.UNKNOWN })))
		};

		send(socketId, newState, eventLog, mapUpdates, callback);
	}
}

/**
 * Handles a crawl start message.
 * @param socketId - The socket id of the client for which to start a crawl.
 * @param action - The action to take.
 * @param options - The options for the action.  (Currently unused.)
 * @param callback - A function to call when processing is complete.
 */
function handleCrawlAction(socketId: string, action: Action, options: ActionOptions, callback: () => void): void {
	let state: InProgressCrawlState = games.get(socketId) as InProgressCrawlState;

	if (state === undefined) {
		// welp
		callback();
		return;
	}

	let self = state.entities.filter((ent) => !ent.ai)[0];

	if (action.type === "attack" && "attack" in action) {
		// Replace with the correct attack object
		action.attack = self.attacks.filter((attack) => attack.name === (action as AttackAction).attack.name)[0];
	}

	let eventLog: LogEvent[] = [];
	let mapUpdates: MapUpdate[] = [];

	let newState: { valid: boolean, state: CrawlState } = { valid: false, state };
	newState = crawl.stepWithAction(state, action, eventLog, mapUpdates);

	// log(newState);

	if (newState.valid) {
		send(socketId, newState.state, eventLog, mapUpdates, callback);
	} else {
		queue.create("out", { socketId, message: { type: "crawl-action-invalid" }}).save((err: Error) => {
			if (err) {
				log.error(err);
			} else {
				callback();
			}
		});
	}
}

/**
 * Handles a disconnecting client by deleting their game.
 * @param socketId - The socket id of the client for which to start a crawl.
 * @param callback - A function to call when processing is complete.
 */
function handleDisconnect(socketId: string, callback: () => void): void {
	games.delete(socketId);
	redisClient.zincrby("dk:logic", [-1, name]);
	callback();
}