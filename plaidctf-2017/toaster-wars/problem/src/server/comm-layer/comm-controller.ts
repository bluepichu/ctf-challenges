"use strict";

import * as nconf from "nconf";
import * as kue   from "kue";
import * as redis from "redis";

import dungeons                     from "../data/dungeons";
import { graphics, entityGraphics } from "../data/graphics";

const log  = require("beautiful-log")("dungeonkit:comm-controller");
const redisClient = redis.createClient({ host: nconf.get("redis-host") || "127.0.0.1", port: nconf.get("redis-port") || 6379 });

/**
 * Represents a single client.
 */
export default class CommController {
	public user: User;

	private entity: PlayerOverworldEntity;
	private socket: SocketIO.Socket;
	private knownGraphics: Set<String>;
	private queue: kue.Queue;
	private logicNode: string;
	private io: SocketIO.Server;
	private dungeonName: string;

	/**
	 * Creates a new CommController using the given socket, queue, and entity.
	 * @param socket - The socket to use for client communication.
	 * @param queue - The job queue.
	 * @param entity - The entity representing the player.
	 */
	public constructor(socket: SocketIO.Socket, queue: kue.Queue, entity: PlayerOverworldEntity, io: SocketIO.Server) {
		this.entity = entity;
		this.socket = socket;
		this.knownGraphics = new Set<String>();
		this.queue = queue;
		this.io = io;

		this.socket.on("disconnect", () => {
			this.send({ type: "disconnect" });
		});
	}

	/**
	 * Initializes an overworld scene.
	 * @param scene - The overworld scene to initialize.
	 */
	public initOverworld(scene: OverworldScene): void {
		for (let obj of scene.background) {
			this.checkGraphics(obj.graphics);
		}

		for (let ent of scene.entities) {
			this.checkEntityGraphics(ent.graphics);
		}

		this.checkEntityGraphics(this.entity.graphics);

		let self: SelfOverworldEntity = {
			id: this.entity.id,
			graphics: this.entity.graphics,
			name: this.entity.name,
			stats: this.entity.stats,
			attacks: this.entity.attacks,
			items: this.entity.items,
			position: this.entity.position,
			direction: this.entity.direction,
			attributes: this.entity.attributes,
			salt: this.entity.salt
		};

		this.socket.emit("overworld-init", {
			self,
			scene
		});

		this.socket.removeAllListeners("overworld-interact-entity");
		this.socket.removeAllListeners("overworld-interact-hotzone");

		this.socket.on("overworld-interact-entity", (id: string) => {
			log(`I ent ${this.socket.id}`);
			let entities = scene.entities.filter((ent) => ent.id === id);

			if (entities.length > 0 && entities[0].interact) {
				this.handleInteraction(entities[0].interact());
			} else {
				log(`I end ${this.socket.id}`);
				this.socket.emit("overworld-interact-end");
			}
		});

		this.socket.on("overworld-interact-hotzone", (id: string) => {
			log(`I hz ${this.socket.id}`);
			let hotzones = scene.hotzones.filter((hz) => hz.id === id);

			if (hotzones.length > 0 && hotzones[0].interact) {
				this.handleInteraction(hotzones[0].interact());
			} else {
				log(`I end ${this.socket.id}`);
				this.socket.emit("overworld-interact-end");
			}
		});
	}

	/**
	 * Handles an interaction with an entity in the overworld.
	 * @param interaction - The iterator describing the interaction.
	 */
	private handleInteraction(interaction: IterableIterator<Interaction>): void {
		let advance = ({ value, done }: IteratorResult<Interaction>) => {
			if (!value) {
				this.socket.emit("overworld-interact-end");
				return;
			}

			switch (value.type) {
				case "speak":
					log(`I cont ${this.socket.id}`);
					this.socket.emit("overworld-interact-continue", value);

					this.socket.once("overworld-respond", (response: ClientInteractionResponse) => {
						log(`I res ${this.socket.id}`);
						if (done) {
							log(`I end ${this.socket.id}`);
							this.socket.emit("overworld-interact-end");
						} else {
							advance(interaction.next(response));
						}
					});
					break;

				case "crawl":
					log(`I end ${this.socket.id}`);
					this.initCrawl(value.dungeon);
					break;

				case "transition":
					this.socket.emit("overworld-interact-end");
					this.entity.position = value.start.position;
					this.initOverworld(value.scene);
					break;
			}
		};

		advance(interaction.next());
	}

	/**
	 * Checks if the client needs the graphics descriptor for the given key, and sends it if necessary.
	 * @param key - The graphics descriptor key.
	 */
	private checkGraphics(key: string): void {
		if (!this.knownGraphics.has(key)) {
			this.socket.emit("graphics", key, graphics.get(key));
			log(`G gen/${key} ${this.socket.id}`);
			this.knownGraphics.add(key);
		}
	}

	/**
	 * Checks if the client needs the entity graphics descriptor for the given key, and sends it if necessary.
	 * @param key - The entity graphics descriptor key.
	 */
	private checkEntityGraphics(key: string): void {
		if (!this.knownGraphics.has(key)) {
			this.socket.emit("entity-graphics", key, entityGraphics.get(key));
			log(`G ent/${key} ${this.socket.id}`);
			this.knownGraphics.add(key);
		}
	}

	/**
	 * Initializes a crawl.
	 * @param dungeonName - The key of the dungeon in which to start the crawl.
	 */
	private initCrawl(dungeonName: string): void {
		this.getLogicNodeAssignment()
			.then(() => {
				let dungeon = dungeons.get(dungeonName);
				this.checkGraphics(dungeon.graphics);
				this.socket.removeAllListeners("overworld-interact-entity");
				this.socket.removeAllListeners("overworld-interact-hotzone");
				this.socket.emit("crawl-init", dungeon);
				this.send({
					type: "crawl-start",
					dungeon: dungeonName,
					entity: {
						id: this.entity.id,
						name: this.entity.name,
						graphics: this.entity.graphics,
						stats: this.entity.stats,
						attacks: this.entity.attacks,
						items: this.entity.items,
						alignment: 1,
						ai: false,
						status: [],
						attributes: this.entity.attributes,
						salt: this.entity.salt
					}
				});

				this.io.emit("feed", { type: "start", user: this.user || `Guest_${this.socket.id.substring(0, 8)}`, dungeon: dungeon.name });
				this.dungeonName = dungeon.name;
			});
	}

	/**
	 * Selects a logic node to use for a crawl by selecting the one with the least load.
	 * @return A promise that resolves once a logic node has been selected, or rjeects if there are no logic nodes.
	 */
	private getLogicNodeAssignment(): Promise<{}> {
		return new Promise((resolve, reject) => {
			redisClient.zrange("dk:logic", 0, 0, (err: Error, data: string[]) => {
				log(data);
				if (data.length === 0) {
					// No logic nodes...?
					reject("No logic nodes");
				} else {
					this.logicNode = data[0];
					redisClient.zincrby("dk:logic", [this.logicNode, 1], (err: Error, data: string[]) => {
						resolve();
					});
				}
			});
		});
	}

	/**
	 * Handles a "get action" message from a logic node.
	 * @param update - The state update to send to the client.
	 */
	private handleGetAction(update: UpdateMessage): void {
		log(`W ${this.socket.id}`);

		update.stateUpdate.items.forEach((item) => this.checkGraphics(item.graphics));
		update.stateUpdate.self.items.bag.items.forEach((item) => this.checkGraphics(item.graphics));
		update.stateUpdate.self.items.held.items.forEach((item) => this.checkGraphics(item.graphics));
		update.stateUpdate.entities.forEach((ent) => this.checkEntityGraphics(ent.graphics));

		this.entity.stats = update.stateUpdate.self.stats;
		this.entity.items = update.stateUpdate.self.items;

		if (update.log.find((upd) => upd.type === "stairs")) {
			this.io.emit("feed", { type: "floor", user: this.user || `Guest_${this.socket.id.substring(0, 8)}`, floor: update.stateUpdate.floor.number, dungeon: this.dungeonName });
		}

		this.socket.emit("crawl-update", update);

		this.waitOnAction();
	}

	/**
	 * Handles an "invalid" message from a logic node.
	 */
	private handleInvalid(): void {
		this.socket.emit("crawl-invalid");

		this.waitOnAction();
	}

	/**
	 * Handles a "crawl end" message from a logic node.
	 */
	private handleCrawlEnd(log: LogEvent[], result: ConcludedCrawlState): void {
		this.socket.emit("crawl-end", log, result);

		if (result.success) {
			this.io.emit("feed", { type: "clear", user: this.user || `Guest_${this.socket.id.substring(0, 8)}`, dungeon: this.dungeonName });
		} else {
			this.io.emit("feed", { type: "defeat", user: this.user || `Guest_${this.socket.id.substring(0, 8)}`, dungeon: this.dungeonName, floor: result.floor });
		}

		this.dungeonName = undefined;
	}

	/**
	 * Waits on an action from the client, and then forwards it to the logic node once it is received.
	 */
	private waitOnAction(): void {
		this.socket.once("crawl-action", (action: Action, options: ActionOptions) => {
			log(`M ${this.socket.id}`);

			this.send({
				type: "crawl-action",
				action,
				options
			});
		});
	}

	/**
	 * Adds a message to the queue for the selected logic node.
	 * @param message - The message to put in the queue.
	 */
	private send(message: InMessage): void {
		let msg: WrappedInMessage = {
			socketId: this.socket.id,
			message
		};

		log("--------> in");

		this.queue.create(`in:${this.logicNode}`, msg).save((err: Error) => {
			if (err) {
				log.error(err);
			}
		});
	}

	/**
	 * Processes an incoming message from a logic node.
	 * @param message - The message to process.
	 */
	public receive(message: OutMessage): void {
		switch (message.type) {
			case "crawl-get-action":
				this.handleGetAction(message.update);
				break;

			case "crawl-action-invalid":
				this.handleInvalid();
				break;

			case "crawl-end":
				this.handleCrawlEnd(message.log, message.result);
				break;
		}
	}
}