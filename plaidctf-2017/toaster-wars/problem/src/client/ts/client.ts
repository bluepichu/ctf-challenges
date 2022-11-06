"use strict";

import {
	autoDetectRenderer,
	CanvasRenderer,
	Container,
	Graphics,
	loader,
	SCALE_MODES,
	Text,
	ticker,
	utils as PixiUtils,
	WebGLRenderer
} from "pixi.js";

import AttackOverlay                from "./attack-overlay";
import Colors                       from "./colors";
import CommandArea                  from "./command-area";
import Constants                    from "./constants";
import DungeonRenderer              from "./dungeon/dungeon-renderer";
import Messages                     from "./messages";
import EntitySprite                 from "./graphics/entity-sprite";
import GameSocket                   from "./game-socket";
import * as Geometry                from "./geometry";
import * as GraphicsDescriptorCache from "./graphics/graphics-descriptor-cache";
import GraphicsObject               from "./graphics/graphics-object";
import KeyboardInputHandler         from "./input/keyboard-input-handler";
import Keys                         from "./input/keys";
import Menu                         from "./menu";
import MessageLog                   from "./message-log";
import OverworldRenderer            from "./overworld/overworld-renderer";
import SpeakingArea                 from "./speaking-area";
import TeamOverlay                  from "./team-overlay";
import tilesheetParser              from "./graphics/tilesheet-parser";
import * as Tweener                 from "./graphics/tweener";
import * as utils                   from "../../common/utils";
import * as WebFont                 from "webfontloader";

const enum GamePhase {
	OVERWORLD,
	CRAWL
};

let renderer: WebGLRenderer | CanvasRenderer = undefined;
let gameContainer: Container = undefined;
let socket: GameSocket = undefined;
let commandArea: CommandArea = undefined;
let dungeonRenderer: DungeonRenderer = undefined;
let messageLog: MessageLog = undefined;
let processChain: Thenable = Promise.resolve();
let floorSign: Container = undefined;
let floorSignText: Text = undefined;
let attackOverlay: AttackOverlay = undefined;
let inputHandler: KeyboardInputHandler = undefined;
let teamOverlay: TeamOverlay = undefined;
let main: HTMLElement = undefined;
let awaitingMove: boolean = false;
let state: CensoredClientCrawlState;
let overworldRenderer: OverworldRenderer = undefined;
let scene: ClientOverworldScene = undefined;
let interacting: boolean = false;
let speakingArea: SpeakingArea = undefined;
let currentPhase: GamePhase = undefined;
let currentMenu: Menu = undefined;
let currentDirection: number = 0;

let x: number;
let y: number;
let z: number;
let w: number;

ticker.shared.autoStart = false;

/**
 * Loads the webfonts and kicks off asset loading on completion.
 */
document.addEventListener("DOMContentLoaded", () => {
	if ("WebFont" in window) { // Fails in offline mode
		WebFont.load({
			google: {
				families: ["Lato:100,300,400,700"]
			},
			active: loadAssets
		});
	} else {
		loadAssets();
	}
});

/**
 * Loads the assets needed to run the game.  TEMPORARY: a better solution is
 * needed (probably dynamic loading).
 */
function loadAssets(): void {
	(loader as any)._afterMiddleware.unshift(tilesheetParser); // tilesheet parser needs to run first

	loader
		.add("bg-ocean", "/assets/ocean.json")
		.add("dng-stormy-sea", "/assets/tileset-stormy-sea.json")
		.add("dng-wish-cave", "/assets/tileset-wish-cave.json")
		.add("dng-waterfall-pond", "/assets/tileset-waterfall-pond.json")
		.add("dng-surrounded-sea", "/assets/tileset-surrounded-sea.json")
		.add("ent-blender", "/assets/blender.json")
		.add("ent-toaster", "/assets/toaster.json")
		.add("ent-spatula", "/assets/spatula.json")
		.add("ent-golden-spatula", "/assets/golden-spatula.json")
		.add("items", "/assets/items.json")
		.add("blender-portrait", "/assets/blender-portrait.json")
		.once("complete", init);

	loader.load();
}

/**
 * Initializes the client.
 */
function init(): void {
	socket = new GameSocket();

	socket.onCrawlInit(startCrawl);

	socket.onCrawlEnd((log, result) => {
		processAll(log);

		processChain.then(() => {
			if (result.success) {
				floorSignText.text = `Cleared all ${result.floor} floors of ${result.dungeon.name}.\nCongratulations!\n\nRefresh to play again.`;
			} else {
				floorSignText.text = `Defeated on floor ${result.floor} of ${result.dungeon.name}.\n\nRefresh to play again.`;
			}

			Tweener.tween(floorSign, { alpha: 1 }, .1);
		});
	});

	if (localStorage.getItem("user") && localStorage.getItem("pass")) {
		socket.login(localStorage.getItem("user"), localStorage.getItem("pass"));
	}

	socket.onOverworldInit(showScene);

	socket.onCrawlInvalid(() => {
		console.info("invalid");
		awaitingMove = true;
	});

	socket.onGraphics((key: string, graphics: GraphicsObjectDescriptor) => {
		console.info("Adding graphics", key);
		GraphicsDescriptorCache.setGraphics(key, graphics);
	});

	socket.onEntityGraphics((key: string, graphics: EntityGraphicsDescriptor) => {
		console.info("Adding entity graphics", key);
		GraphicsDescriptorCache.setEntityGraphics(key, graphics);
	});

	socket.onUpdate(({stateUpdate, log, move}: UpdateMessage) => {
		let updates: Processable[] = log;

		console.info("update");

		if (stateUpdate !== undefined) {
			updates.push({ type: "done", move, state: stateUpdate });

			if (state.self === undefined) {
				state.self = stateUpdate.self; // required for the very first step
			}
		}

		processAll(updates);
	});

	for (let name in PixiUtils.TextureCache) {
		PixiUtils.TextureCache[name].baseTexture.scaleMode = SCALE_MODES.NEAREST;
	}

	PIXI.settings.RESOLUTION = window.devicePixelRatio || 1;

	renderer = autoDetectRenderer(800, 600, {
		antialias: true,
		resolution: PIXI.settings.RESOLUTION
	});

	GraphicsDescriptorCache.setRenderer(renderer);

	gameContainer = new Container();
	main = document.getElementsByTagName("main")[0] as HTMLElement;
	main.appendChild(renderer.view);

	// TODO (bluepichu): Handle mobile users
	inputHandler = new KeyboardInputHandler();
	commandArea = inputHandler.commandArea;

	commandArea.addHandler("start", {
		label: "start",
		description: "Start the game.",
		handler: () => {
			socket.emitTempSignal("start");
		}
	});

	commandArea.addHandler("help", {
		label: "help",
		description: "Get an explanation of the controls.",
		handler: () => {
			messageLog.push(Messages.CONTROLS, 15000);
		}
	});

	commandArea.onInvalid = (msg: string) => { messageLog.push(msg, 10000); };

	gameContainer.addChild(commandArea);

	messageLog = new MessageLog();
	gameContainer.addChild(messageLog);

	speakingArea = new SpeakingArea();
	gameContainer.addChild(speakingArea);

	messageLog.push(Messages.WELCOME, 10000);
	messageLog.push(Messages.START_HELP, 10000);

	window.addEventListener("orientationchange", handleWindowResize);
	window.addEventListener("resize", handleWindowResize);

	handleWindowResize();

	requestAnimationFrame(animate);
}

/**
 * Initiates a crawl.
 * @param dungeon - The dungeon in which the crawl will take place.
 */
function startCrawl(dungeon: Dungeon): void {
	if (overworldRenderer !== undefined) {
		overworldRenderer.clear();
	}

	if (currentMenu !== undefined) {
		gameContainer.removeChild(currentMenu);
	}

	speakingArea.hide();
	interacting = false;
	socket.clearInteractHandlers();

	state = {
		dungeon,
		floor: {
			number: 0,
			map: {
				width: 0,
				height: 0,
				grid: []
			}
		},
		entities: [],
		items: [],
		self: undefined
	};

	setGamePhase(GamePhase.CRAWL);

	dungeonRenderer = new DungeonRenderer(renderer, state.dungeon.graphics);
	gameContainer.addChildAt(dungeonRenderer, 0);

	// minimap = new Minimap(300, 200);
	// minimap.x = 50;
	// minimap.y = 50;
	// gameContainer.addChild(minimap);

	attackOverlay = new AttackOverlay();
	gameContainer.addChild(attackOverlay);

	let roomQuery = /room=([^&]*)(&|$)/.exec(window.location.search);
	let room: string = undefined;

	if (roomQuery) {
		room = roomQuery[1];
	}

	let nameQuery = /name=([^&]*)(&|$)/.exec(window.location.search);
	let name: string = undefined;

	if (nameQuery) {
		name = decodeURI(nameQuery[1]);
	}

	if (room) {
		socket.emitTempSignal("join", room);
	}

	if (name) {
		socket.emitTempSignal("name", name);
	}

	teamOverlay = new TeamOverlay(renderer);
	gameContainer.addChild(teamOverlay);

	floorSign = new Container();
	floorSign.alpha = 0;
	gameContainer.addChild(floorSign);

	let g = new Graphics();
	g.beginFill(0x000000);
	g.drawRect(0, 0, window.innerWidth, window.innerHeight);
	g.endFill();
	floorSign.addChild(g);

	floorSignText = new Text("", {
		fontFamily: "Lato",
		fontSize: "32px",
		fontWeight: "300",
		fill: Colors.WHITE,
		align: "center"
	});
	floorSignText.anchor.x = .5;
	floorSignText.anchor.y = .5;
	floorSignText.x = window.innerWidth / 2;
	floorSignText.y = window.innerHeight / 2;
	floorSignText.resolution = window.devicePixelRatio;
	floorSign.addChild(floorSignText);

	handleWindowResize();
}

/**
 * Handles a window resize event.
 */
function handleWindowResize(): void {
	let windowWidth = window.innerWidth;
	let windowHeight = window.innerHeight;

	let rendererWidth = windowWidth;
	let rendererHeight = windowHeight;

	renderer.view.style.width = `${windowWidth}px`;
	renderer.view.style.height = `${windowHeight}px`;

	renderer.resize(rendererWidth, rendererHeight);

	messageLog.x = rendererWidth;
	messageLog.y = rendererHeight;

	commandArea.x = rendererWidth - 310;
	commandArea.y = 10;

	speakingArea.x = rendererWidth / 2;
	speakingArea.y = rendererHeight - 10;

	if (floorSignText !== undefined) {
		floorSignText.x = rendererWidth / 2;
		floorSignText.y = rendererHeight / 2;
	}

	if (dungeonRenderer !== undefined) {
		dungeonRenderer.x = rendererWidth / 2;
		dungeonRenderer.y = rendererHeight / 2;
	}

	if (overworldRenderer !== undefined) {
		overworldRenderer.x = rendererWidth / 2;
		overworldRenderer.y = rendererHeight / 2;
	}

	if (teamOverlay !== undefined) {
		teamOverlay.x = 0;
		teamOverlay.y = rendererHeight;
	}

	// (renderer.view.requestFullscreen || renderer.view.webkitRequestFullscreen || (() => undefined))();
}

/**
 * Processes all of the given updates.
 * @param updates - The updates to process.
 */
function processAll(updates: Processable[]): void {
	processChain = processChain
		.then(() => console.warn("starting chain", updates))
		.then(() => getResolutionPromise(updates))
		.then(() => console.warn("finished chain"));
}

/**
 * Produces a promise chain to resolve the given processes.
 * @param processes - The processes to resolve.
 * @return The promise chain to resolve the oriesses.
 */
function getResolutionPromise(processes: Processable[]): Promise<void> {
	console.log(processes.map(p => p.type));

	return new Promise<void>((resolve, reject) => {
		if (processes.length === 0) {
			resolve();
			return;
		}

		let event = processes.shift();

		let done = () =>
			resolve(getResolutionPromise(processes));

		switch (event.type) {
			case "done":
				console.log("done");
				event.state.floor.mapUpdates.forEach((update) => {
					state.floor.map.grid[update.location.r][update.location.c] = update.tile;
					dungeonRenderer.updateGround(update.location, state.floor.map);
				});

				state.entities = event.state.entities;
				state.items = event.state.items;
				state.self = event.state.self;

				dungeonRenderer.update(state);
				dungeonRenderer.updatePosition(state.floor.map, state.self.location);
				attackOverlay.update(state.self.attacks);
				teamOverlay.update(state);

				commandArea.clearHandlers();

				if (state.floor.map.grid[state.self.location.r][state.self.location.c].stairs) {
					commandArea.addHandler("stairs", {
						label: "stairs",
						description: "Advance to the next floor.",
						handler: () => {
							socket.sendCrawlAction({
								type: "stairs"
							});
						}
					});
				}

				commandArea.addHandler("wait", {
					label: "wait",
					description: "Skip a single step.",
					handler: () => {
						socket.sendCrawlAction({
							type: "wait"
						});
					}
				});

				if (state.self.items.bag.items !== undefined) {
					for (let item of state.self.items.bag.items) {
						for (let action in item.actions) {
							for (let alias of item.actions[action]) {
								commandArea.addHandler(`${alias} ${item.name} (bag)`, {
									label: `${alias} <item>${item.name}</item> <minor>(bag)</minor>`,
									description: item.description,
									handler: () => {
										socket.sendCrawlAction({
											type: "item",
											direction: currentDirection,
											action: action as ItemActionType,
											item: item.id
										});
									}
								});
							}
						}

						if (state.self.items.held.items.length < state.self.items.held.capacity) {
							commandArea.addHandler(`equip ${item.name} (bag)`, {
								label: `equip <item>${item.name}</item> <minor>(bag)</minor>`,
								description: item.description,
								handler: () => {
									socket.sendCrawlAction({
										type: "item",
										direction: currentDirection,
										action: "equip",
										item: item.id
									});
								}
							});
						}
					}
				}

				for (let item of state.self.items.held.items) {
					for (let action in item.actions) {
						for (let alias of item.actions[action]) {
							commandArea.addHandler(`${alias} ${item.name} (held)`, {
								label: `${alias} <item>${item.name}</item> <minor>(held)</minor>`,
								description: item.description,
								handler: () => {
									socket.sendCrawlAction({
										type: "item",
										direction: currentDirection,
										action: action as ItemActionType,
										item: item.id
									});
								}
							});
						}
					}

					if (state.self.items.bag !== undefined
						&& state.self.items.bag.items.length < state.self.items.bag.capacity) {
						commandArea.addHandler(`unequip ${item.name} (held)`, {
							label: `unequip <item>${item.name}</item> <minor>(held)</minor>`,
							description: item.description,
							handler: () => {
								socket.sendCrawlAction({
									type: "item",
									direction: currentDirection,
									action: "unequip",
									item: item.id
								});
							}
						});
					}
				}

				awaitingMove = awaitingMove || event.move;

				return done();

			case "start":
				state.floor.number = event.floorInformation.number;
				state.floor.map.width = event.floorInformation.width;
				state.floor.map.height = event.floorInformation.height;

				let floorName =
					(state.dungeon.direction === "down" ? "B" : "")
					+ state.floor.number
					+ "F";

				floorSignText.text = `${state.dungeon.name}\n${floorName}`;

				state.floor.map.grid =
					utils.tabulate((row) =>
						utils.tabulate((col) => ({ type: DungeonTileType.UNKNOWN }), (event as StartLogEvent).floorInformation.width),
					event.floorInformation.height);

				state.self = event.self;

				dungeonRenderer.showFloorStart(state.self.location);

				Tweener.tween(floorSign, { alpha: 1 }, .1)
					.then(() => new Promise((resolve, _) => setTimeout(resolve, 2000)))
					.then(() => {
						setTimeout(() => Tweener.tween(floorSign, { alpha: 0 }, .1), 400);
						setTimeout(done, 400);
					});

				break;

			case "wait":
				setTimeout(done, 200);
				break;

			case "move":
				let getMovePromise = (evt: MoveLogEvent) => {
					if (evt.entity.id === state.self.id) {
						dungeonRenderer.updatePosition(state.floor.map, evt.end);
					}
					return dungeonRenderer.showWalk(evt.entity, evt.start, evt.end, evt.direction);
				};

				let movePromises: Thenable[] = [];
				let deferred: Processable[] = [];

				processes.unshift(event);

				while (processes.length > 0) {
					if (processes[0].type === "move") {
						movePromises.push(getMovePromise(processes.shift() as MoveLogEvent));
					} else if (processes[0].type === "done" || processes[0].type === "item_pickup") {
						deferred.push(processes.shift());
					} else {
						break;
					}
				}

				processes = deferred.concat(processes);

				Promise.all(movePromises).then(done);
				break;

			case "attack":
				messageLog.push(`${highlightEntity(event.entity)} used <attack>${event.attack.name}</attack>.`);
				dungeonRenderer.showAttack(event.entity, event.location, event.direction, event.attack.animation)
					.then(done);
				break;

			case "stat":
				switch (event.stat) {
					case "hp":
						if (event.change < 0) {
							messageLog.push(`${highlightEntity(event.entity)} took <attack>${-event.change}</attack> damage!`);
							dungeonRenderer.showHurt(event.entity, event.location, event.change).then(done);
						} else {
							messageLog.push(`${highlightEntity(event.entity)} recovered <attack>${event.change}</attack> HP!`);
							dungeonRenderer.showHeal(event.entity, event.location, event.change).then(done);
						}
						break;

					case "belly":
						if (event.change <= 0) {
							// idk lol
							done();
						} else {
							messageLog.push(`${highlightEntity(event.entity)}'s belly filled ${event.change <= 60 ? "somewhat" : "greatly"}!`);

							dungeonRenderer.showBelly(event.entity, event.location, Math.ceil(event.change / 6))
								.then(done);
						}
						break;

					default:
						if (event.change < 0) {
							if (event.change < -1) {
								messageLog.push(`${highlightEntity(event.entity)}'s ${event.stat} fell sharply!`);
							} else {
								messageLog.push(`${highlightEntity(event.entity)}'s ${event.stat} fell!`);
							}
						} else {
							if (event.change > 1) {
								messageLog.push(`${highlightEntity(event.entity)}'s ${event.stat} rose sharply!`);
							} else {
								messageLog.push(`${highlightEntity(event.entity)}'s ${event.stat} rose!`);
							}
						}

						done();
						break;
				}
				break;

			case "miss":
				messageLog.push(`The attack missed ${highlightEntity(event.entity)}!`);
				done();
				break;

			case "defeat":
				messageLog.push(`${highlightEntity(event.entity)} was defeated!`);
				dungeonRenderer.showDefeat(event.entity).then(done);
				break;

			case "stairs":
				messageLog.push(`${highlightEntity(event.entity)} went up the stairs!`);
				new Promise((resolve, _) => setTimeout(resolve, 600))
					.then(() => Tweener.tween(floorSign, { alpha: 1 }, .1))
					.then(() => {
						// minimap.clear();
						dungeonRenderer.clear();
						messageLog.clear();
						setTimeout(done, 1000);
					});
				break;

			case "message":
				console.log(event.message); // you're welcome
				messageLog.push(event.message);
				done();
				break;

			case "item_pickup":
				messageLog.push(`${highlightEntity(event.entity)} picked up the <item>${event.item.name}</item>.`);
				done();
				break;

			case "item_drop":
				messageLog.push(`${highlightEntity(event.entity)} dropped the <item>${event.item.name}</item>.`);
				done();
				break;

			case "item_throw":
				messageLog.push(`${highlightEntity(event.entity)} threw the <item>${event.item.name}</item>!`);
				dungeonRenderer.showThrow(event.entity, event.from, event.to, event.direction, event.item)
					.then(done);
				break;

			case "item_fall":
				messageLog.push(`The <item>${event.item.name}</item> fell to the ground.`);
				done();
				break;

			case "status_affliction":
				switch (event.status) {
					case StatusCondition.CONFUSED:
						messageLog.push(`${highlightEntity(event.entity)} became confused!`);
						break;

					case StatusCondition.SHORT_CIRCUITED:
						messageLog.push(`${highlightEntity(event.entity)} became paralyzed!`);
						break;

					case StatusCondition.POISONED:
						messageLog.push(`${highlightEntity(event.entity)} became poisoned!`);
						break;
				}
				done();
				break;

			case "status_recovery":
				switch (event.status) {
					case StatusCondition.CONFUSED:
						messageLog.push(`${highlightEntity(event.entity)} recovered from confusion.`);
						break;

					case StatusCondition.SHORT_CIRCUITED:
						messageLog.push(`${highlightEntity(event.entity)} recovered from paralysis.`);
						break;

					case StatusCondition.POISONED:
						messageLog.push(`${highlightEntity(event.entity)} recovered from poison.`);
						break;
				}
				done();
				break;

			default:
				unreachable(event);
		}
	});
}

/**
 * Prepares an entity to be displayed in the message log.
 * @param entity - The entity whose name should be displayed.
 * @return The entity's name with the appropriate tags.
 */
function highlightEntity(entity: CondensedEntity): string {
	if (entity.id === state.self.id) {
		return `<self>${entity.name}</self>`;
	} else {
		return `<enemy>${entity.name}</enemy>`;
	}
}

/**
 * Shows an overworld scene.
 * @param cos - The overworld scene to show.
 */
function showScene(cos: ClientOverworldScene) {
	scene = cos;
	setGamePhase(GamePhase.OVERWORLD);

	overworldRenderer = new OverworldRenderer(renderer);
	overworldRenderer.displayScene(scene);

	gameContainer.addChildAt(overworldRenderer, 0);

	handleWindowResize();
}

/**
 * Handles the start of an interaction.
 */
function startInteraction(): void {
	overworldRenderer.idle();
	interacting = true;

	socket.onInteractContinue((interaction: Interaction) => {
		console.log(interaction);
		if (interaction.type === "speak") {
			speakingArea.showSpeech(interaction);

			if (interaction.responses !== undefined && interaction.responses.length > 0) {
				let menu = new Menu(interaction.responses);
				speakingArea.onFinished = () => {
					currentMenu = menu;
					menu.x = speakingArea.x + speakingArea.width / 2 - menu.width;
					menu.y = speakingArea.y - 120 - menu.height;
					gameContainer.addChild(currentMenu);
				};
			}
		}
	});

	socket.onInteractEnd(() => {
		interacting = false;
		socket.clearInteractHandlers();
	});
}

/**
 * Sets up the appropraite display and input hooks for the given game phase.
 * @param phase - The game phase to which to switch.
 */
function setGamePhase(phase: GamePhase): void {
	switch (currentPhase) {
		case GamePhase.CRAWL:
			gameContainer.removeChild(dungeonRenderer);
			break;

		case GamePhase.OVERWORLD:
			gameContainer.removeChild(overworldRenderer);
			break;

		case undefined:
			// No need to do anything in particular
			break;

		default:
			unreachable(currentPhase);
	}

	currentPhase = phase;

	switch (phase) {
		case GamePhase.CRAWL:
			inputHandler.hooks = [
				{
					keys: [Keys.UP, Keys.DOWN, Keys.LEFT, Keys.RIGHT, Keys.SHIFT],
					delay: 4,
					handle: ([up, down, left, right, shift]: boolean[]) => {
						let direction = [-1, 0, 4, -1, 6, 7, 5, -1, 2, 1, 3, -1, -1, -1, -1, -1][(up ? 8 : 0) + (down ? 4 : 0) + (left ? 2 : 0) + (right ? 1 : 0)];
						if (direction < 0) {
							return;
						}
						if (awaitingMove) {
							dungeonRenderer.showDirection(state.self.id, direction);
							currentDirection = direction;

							if (!shift) {
								socket.sendCrawlAction({
									type: "move",
									direction
								}, {
									dash: key.isPressed(Keys.B)
								});
								awaitingMove = false;
							}
						}
					},
					enabled: () => awaitingMove
				},
				{
					keys: [Keys.W],
					handle: () => {
						socket.sendCrawlAction({
							type: "wait"
						});
					}
				},
				{
					keys: [Keys.SHIFT],
					handle: ([pressed]) => {
						attackOverlay.active = pressed;
					},
					always: true
				},
				{
					keys: [Keys.P],
					handle: () => {

					}
				},
				{
					keys: [Keys.ONE, Keys.TWO, Keys.THREE, Keys.FOUR],
					handle: ([one, two, three, four]) => {
						let attackIdx = -1;

						if (one) {
							attackIdx = 0;
						} else if (two) {
							attackIdx = 1;
						} else if (three) {
							attackIdx = 2;
						} else if (four) {
							attackIdx = 3;
						}

						if (awaitingMove) {
							socket.sendCrawlAction({
								type: "attack",
								direction: currentDirection,
								attack: state.self.attacks[attackIdx]
							});
							awaitingMove = false;
						}
					},
					enabled: () => attackOverlay.active
				},
				{
					keys: [Keys.M],
					handle: ([pressed]) => {
						dungeonRenderer.setZoomOut(pressed, state.floor.map);
					},
					always: true
				}
			];
			break;

		case GamePhase.OVERWORLD:
			inputHandler.hooks = [
				{
					keys: [Keys.UP, Keys.DOWN, Keys.LEFT, Keys.RIGHT],
					handle: ([up, down, left, right]: boolean[]) => {
						let direction = [-1, 0, 4, -1, 6, 7, 5, -1, 2, 1, 3, -1, -1, -1, -1, -1][(up && !down ? 8 : 0) + (down && !up ? 4 : 0) + (left && !right ? 2 : 0) + (right && !left ? 1 : 0)];
						let nextPos = Object.assign({}, scene.self.position);

						if (up) {
							nextPos.y -= Constants.OVERWORLD_WALK_SPEED;
						}

						if (down) {
							nextPos.y += Constants.OVERWORLD_WALK_SPEED;
						}

						if (left) {
							nextPos.x -= Constants.OVERWORLD_WALK_SPEED;
						}

						if (right) {
							nextPos.x += Constants.OVERWORLD_WALK_SPEED;
						}

						let hotzones = scene.scene.hotzones.filter((hotzone) => Geometry.pointInPolygon(nextPos, hotzone.area));

						if (hotzones.length > 0) {
							console.log("hotzone");
							let hotzone = hotzones[0];
							socket.sendHotzoneInteraction(hotzone.id);
							startInteraction();
							return;
						}

						if (Geometry.pointInRect(nextPos, scene.scene.bounds)
								&& scene.scene.obstacles.every((obst) => !Geometry.pointInPolygon(nextPos, obst))
								&& scene.scene.entities.every((ent) => !Geometry.pointInRect(nextPos, { x: { min: ent.position.x - 16, max: ent.position.x + 16 }, y: { min: ent.position.y - 12, max: ent.position.y + 12}}))) {
							overworldRenderer.moveTo(nextPos);
							scene.self.position = nextPos;
						}

						if (direction === -1) {
							overworldRenderer.idle();
						} else {
							overworldRenderer.walk(direction);
						}
					},
					always: true,
					enabled: () => !interacting
				},
				{
					keys: [Keys.Z],
					handle: () => {
						if (currentMenu !== undefined) {
							speakingArea.hide();
							gameContainer.removeChild(currentMenu);
							socket.sendInteractionResponse(currentMenu.selection);
							currentMenu = undefined;
						} else {
							if (speakingArea.finished) {
								speakingArea.hide();
								socket.sendInteractionResponse(0);
							} else {
								speakingArea.skip();
							}
						}
					},
					startOnly: true,
					enabled: () => interacting
				},
				{
					keys: [Keys.Z],
					handle: () => {
						console.log("interacting");
						// TODO (bluepichu): take into account which direction we're facing

						if (scene.scene.entities.length === 0) { // If there are no entities, we can't interact
							return;
						}

						let nearest = scene.scene.entities.reduce((entA, entB) => Geometry.dist(scene.self.position, entA.position) < Geometry.dist(scene.self.position, entB.position) ? entA : entB);

						if (Geometry.dist(nearest.position, scene.self.position) > 32) {
							return;
						}

						socket.sendEntityInteraction(nearest.id);
						startInteraction();
					},
					startOnly: true,
					enabled: () => !interacting
				},
				{
					keys: [Keys.UP, Keys.DOWN],
					handle: ([up, down]) => {
						if (up) {
							currentMenu.prev();
						}

						if (down) {
							currentMenu.next();
						}
					},
					startOnly: true,
					enabled: () => currentMenu !== undefined
				}
			];
			break;

		default:
			unreachable(phase);
	}
}

/**
 * Used for asserting that all cases should be handled.
 * @throws An error stating that the case is invalid.
 */
function unreachable(arg: never): never {
	throw new Error(`Reached default case of exhaustive switch.`);
}

/**
 * Does a single frame of animation and input.
 */
function animate(): void {
	inputHandler.handleInput();
	Tweener.step();
	renderer.render(gameContainer);
	requestAnimationFrame(animate);
}
