"use strict";

export default class GameSocket {
	private listeners: Map<string, ((...args: any[]) => void)[]>;
	private socket: SocketIOClient.Socket;

	public constructor() {
		this.socket = io();
	}

	/**
	 * Make the socket send a temporary signal.
	 * TODO (bluepichu): remove this when everything else is done.
	 * @param hook - The socket.io event hook to send this to.
	 * @param args - Arguments to pass to the event hook.
	 */
	public emitTempSignal(hook: string, ...args: any[]): void {
		this.socket.emit(hook, ...args);
	}

	/**
	 * Sends a crawl action.
	 * @param action - The action to send.
	 * @param options - Action options to send.
	 */
	public sendCrawlAction(action: Action, options?: ActionOptions): void {
		this.socket.emit("crawl-action", action, options);
	}

	/**
	 * Interacts with an overworld entity.
	 * @param entity - The id of the entity to interact with.
	 */
	public sendEntityInteraction(id: string): void {
		this.socket.emit("overworld-interact-entity", id);
	}

	/**
	 * Logs in a user.
	 * @param user - The username to send.
	 * @param pass - the password to send.
	 */
	public login(user: string, pass: string): void {
		this.socket.emit("login", user, pass);
	}

	/**
	 * Interacts with an overworld hotzone.
	 * @param entity - The id of the hotzone to interact with.
	 */
	public sendHotzoneInteraction(id: string): void {
		console.count("hotzone-sent");
		this.socket.emit("overworld-interact-hotzone", id);
	}

	/**
	 * Sends a response to an already-initiated interaction.
	 * @param respose - The response.
	 */
	public sendInteractionResponse(response: ClientInteractionResponse): void {
		this.socket.emit("overworld-respond", response);
	}

	// The following functions are used instead of the generic on() method to allow for better typechecking.

	/**
	 * Adds a hook for the "crawl-init" event.
	 * @param fn - The function to call.
	 */
	public onCrawlInit(fn: (dungeon: CensoredDungeon) => void): void {
		this.socket.on("crawl-init", fn);
	}

	/**
	 * Adds a hook for the "crawl-invalid" event.
	 * @param fn - The function to call.
	 */
	public onCrawlInvalid(fn: () => void): void {
		this.socket.on("crawl-invalid", fn);
	}

	/**
	 * Adds a hook for the "crawl-invalid" event.
	 * @param fn - The function to call.
	 */
	public onCrawlEnd(fn: (log: LogEvent[], result: ConcludedCrawlState) => void): void {
		this.socket.on("crawl-end", fn);
	}

	/**
	 * Adds a hook for the "grahpics" event.
	 * @param fn - The function to call.
	 */
	public onGraphics(fn: (key: string, graphics: GraphicsObjectDescriptor) => void): void {
		this.socket.on("graphics", fn);
	}

	/**
	 * Adds a hook for the "entity-graphics" event.
	 * @param fn - The function to call.
	 */
	public onEntityGraphics(fn: (key: string, graphics: EntityGraphicsDescriptor) => void): void {
		this.socket.on("entity-graphics", fn);
	}

	/**
	 * Adds a hook for the "crawl-update" event.
	 * @param fn - The function to call.
	 */
	public onUpdate(fn: (message: UpdateMessage) => void): void {
		this.socket.on("crawl-update", fn);
	}

	/**
	 * Adds a hook for the "overworld-init" event.
	 * @param fn - The function to call.
	 */
	public onOverworldInit(fn: (scene: ClientOverworldScene) => void): void {
		this.socket.on("overworld-init", fn);
	}

	/**
	 * Adds a hook for the "overworld-interact-continue" event.
	 * @param fn - The function to call.
	 */
	public onInteractContinue(fn: (interaction: Interaction) => void): void {
		this.socket.on("overworld-interact-continue", fn);
	}

	/**
	 * Adds a hook for the "overworld-interact-end" event.
	 * @param fn - The function to call.
	 */
	public onInteractEnd(fn: () => void): void {
		this.socket.on("overworld-interact-end", fn);
	}

	/**
	 * Clears the "overworld-interact-continue" and "overworld-interact-end" handlers.
	 */
	public clearInteractHandlers(): void {
		this.socket.off("overworld-interact-continue");
		this.socket.off("overworld-interact-end");
	}
}