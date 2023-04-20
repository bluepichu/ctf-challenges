import { Socket } from "socket.io-client";
import { io } from "socket.io-client";

import { ClientEvents, ServerEvents } from "@puzzled/messages";
import { BoardInfo, GameState, Move, MovementToken, ShipState } from "@puzzled/types";

const socket: Socket<ServerEvents, ClientEvents> = io("ws://localhost");

async function event<K extends keyof ServerEvents>(event: K): Promise<Parameters<ServerEvents[K]>[0]> {
	return new Promise((resolve) => {
		socket.once(event, resolve as any);
	});
}

function getShipTokenCount(ship: ShipState, token: MovementToken) {
	switch (token) {
		case MovementToken.Forward: return ship.forwardTokens!;
		case MovementToken.Left: return ship.leftTokens!;
		case MovementToken.Right: return ship.rightTokens!;
	}
}

function consumeToken(ship: ShipState, token: MovementToken) {
	switch (token) {
		case MovementToken.Forward: {
			ship.forwardTokens!--;
			break;
		}

		case MovementToken.Left: {
			ship.leftTokens!--;
			break;
		}

		case MovementToken.Right: {
			ship.rightTokens!--;
			break;
		}
	}
}

function repeat<T>(n: number, value: T): T[] {
	return Array(n).fill(value);
}

type StepExecutionResult =
	| { kind: "hold" }
	| { kind: "advance", move?: Move }
	;

interface Step {
	execute(ship: ShipState): StepExecutionResult;
}

class SyncSignal {
	public readonly name: string;
	private static signals: SyncSignal[] = [];
	private expected: number;
	private count: number;
	private ready: boolean;

	constructor(name: string) {
		SyncSignal.signals.push(this);
		this.name = name;
		this.expected = 0;
		this.count = 0;
		this.ready = false;
	}

	public register() {
		this.expected++;
	}

	public wait() {
		this.count++;
	}

	public isReady() {
		return this.ready;
	}

	private afterMove() {
		if (!this.ready && this.count === this.expected) {
			console.log(`  Sync signal ${this.name} ready!`);
			this.ready = true;
		}
	}

	public static afterMove() {
		for (const signal of SyncSignal.signals) {
			signal.afterMove();
		}
	}
}

class MoveStep implements Step {
	constructor(
		private move: Move,
		private check = true
	) {}

	public execute(ship: ShipState): StepExecutionResult {
		if (this.check) {
			if(this.move.token !== undefined && getShipTokenCount(ship, this.move.token) === 0) {
				console.log("  Move step: insufficient tokens", ship);
				return { kind: "hold" };
			}

			const cannonCount = (
				(this.move.fire?.left ? 1 : 0)
				+ (this.move.fire?.right ? 1 : 0)
			);

			if (ship.loadedCannons! < cannonCount) {
				console.log("  Move step: insufficient cannons", ship);
				return { kind: "hold" };
			}
		}

		if (this.move.token !== undefined) {
			consumeToken(ship, this.move.token);
		}

		console.log("  Move step: move", this.move);
		return { kind: "advance", move: this.move };
	}
}

class WaitStep implements Step {
	constructor(private tokens: { [token in MovementToken]?: number }) {}

	public execute(ship: ShipState): StepExecutionResult {
		for (const token in this.tokens) {
			if (getShipTokenCount(ship, token as MovementToken) < this.tokens[token as MovementToken]!) {
				console.log("  Wait step: insufficient tokens", ship);
				return { kind: "hold" };
			}
		}

		console.log("  Wait step: continue");
		return { kind: "advance" };
	}
}

class SyncStep implements Step {
	private signal: SyncSignal;
	private waited: boolean;

	constructor(signal: SyncSignal) {
		this.signal = signal;
		this.signal.register();
		this.waited = false;
	}

	public execute(ship: ShipState): StepExecutionResult {
		const ready = this.signal.isReady();

		if (!this.waited) {
			this.waited = true;
			this.signal.wait();
		}

		if (ready) {
			console.log("  Sync step: continue");
			return { kind: "advance" };
		} else {
			console.log("  Sync step: waiting");
			return { kind: "hold" };
		}
	}
}

class ShipActor {
	public readonly steps: Step[];
	private index: number;

	constructor(steps: Step[]) {
		this.steps = steps;
		this.index = 0;
	}

	public execute(ship: ShipState): Move {
		while (true) {
			if (this.index >= this.steps.length) {
				return {};
			}

			const step = this.steps[this.index];
			const result = step.execute(ship);

			if (result.kind === "hold") {
				return {};
			}

			this.index++;

			if (result.move !== undefined) {
				return result.move;
			}
		}
	}
}

socket.onAny((event, ...args) => {
	// console.log(event, ...args);
});

socket.once("flag", (flag) => { // just so we don't miss it
	console.log("FLAG!", flag);
});

// const board = BoardInfo.fromJson(await event("board"));
console.log("waiting for state...");
let state = GameState.fromJson(await event("state"));
// console.log(board);
console.log(state);

const phase2StartSignal = new SyncSignal("Phase 2");
const phase3StartSignal = new SyncSignal("Phase 3");
const phase4StartSignal = new SyncSignal("Phase 4");

const actors = {
	"Active Pike": new ShipActor([
		new MoveStep({ token: MovementToken.Forward, fire: { left: true, right: true } }),
		new WaitStep({ [MovementToken.Left]: 1 }),
		new MoveStep({ token: MovementToken.Forward }),
		new MoveStep({ token: MovementToken.Left }),
		new MoveStep({ token: MovementToken.Forward }),
		new MoveStep({ token: MovementToken.Left }),
		new MoveStep({ token: MovementToken.Right }),
		new MoveStep({ token: MovementToken.Right }),
		new MoveStep({ token: MovementToken.Left }),
		new WaitStep({ [MovementToken.Left]: 1 }),
		new MoveStep({ token: MovementToken.Right }),
		new MoveStep({ token: MovementToken.Left }),
		new MoveStep({ token: MovementToken.Forward }),
		new MoveStep({ token: MovementToken.Forward }),
		new MoveStep({ token: MovementToken.Forward }),
		new MoveStep({ token: MovementToken.Right }),
		new MoveStep({ token: MovementToken.Left }),
		new MoveStep({ token: MovementToken.Forward }),
		new MoveStep({ token: MovementToken.Left, fire: { left: true } }),
		new SyncStep(phase2StartSignal),
		new SyncStep(phase3StartSignal),
		new WaitStep({ [MovementToken.Right]: 1 }),
		new SyncStep(phase4StartSignal),
		...repeat(1000, new MoveStep({ token: MovementToken.Right, fire: { left: true, right: true } }, false)),
	]),
	"Magnificent Marlin": new ShipActor([
		new MoveStep({ token: MovementToken.Forward }),
		new MoveStep({ token: MovementToken.Forward }),
		new MoveStep({ token: MovementToken.Forward }),
		new MoveStep({ token: MovementToken.Left }),
		new MoveStep({ token: MovementToken.Right }),
		new MoveStep({ token: MovementToken.Left }),
		new MoveStep({ token: MovementToken.Forward }),
		new MoveStep({ token: MovementToken.Right }),
		new MoveStep({ token: MovementToken.Forward }),
		new MoveStep({ token: MovementToken.Forward }),
		new MoveStep({ token: MovementToken.Forward }),
		new MoveStep({ token: MovementToken.Forward }),
		new MoveStep({ token: MovementToken.Right }),
		new WaitStep({ [MovementToken.Left]: 1 }),
		new SyncStep(phase2StartSignal),
		...repeat(10, new MoveStep({ token: MovementToken.Left, fire: { right: true } }, false)),
		new SyncStep(phase3StartSignal),
		new MoveStep({ token: MovementToken.Left }),
		new MoveStep({ token: MovementToken.Right }),
		new MoveStep({ token: MovementToken.Right }),
		new WaitStep({ [MovementToken.Right]: 1 }),
		new SyncStep(phase4StartSignal),
		...repeat(1000, new MoveStep({ token: MovementToken.Right }, false)),
	]),
	"Clever Bluegill": new ShipActor([
		new MoveStep({ token: MovementToken.Forward }),
		new MoveStep({ token: MovementToken.Forward }),
		new MoveStep({ token: MovementToken.Right }),
		new MoveStep({ token: MovementToken.Left }),
		new MoveStep({ token: MovementToken.Forward }),
		new MoveStep({ token: MovementToken.Left }),
		new MoveStep({ token: MovementToken.Right }),
		new MoveStep({ token: MovementToken.Right }),
		new MoveStep({ token: MovementToken.Left }),
		new MoveStep({ token: MovementToken.Forward }),
		new MoveStep({ token: MovementToken.Right }),
		new MoveStep({ token: MovementToken.Forward }),
		new MoveStep({ token: MovementToken.Left }),
		new WaitStep({ [MovementToken.Forward]: 1, [MovementToken.Left]: 1 }),
		new MoveStep({ token: MovementToken.Forward }),
		new MoveStep({ token: MovementToken.Left }),
		new MoveStep({ token: MovementToken.Forward }),
		new MoveStep({ token: MovementToken.Forward }),
		new SyncStep(phase2StartSignal),
		...repeat(10, new MoveStep({ token: MovementToken.Right, fire: { left: true } }, false)),
		new SyncStep(phase3StartSignal),
		new MoveStep({ token: MovementToken.Right }),
		new MoveStep({ token: MovementToken.Left }),
		new WaitStep({ [MovementToken.Left]: 1, [MovementToken.Forward]: 1 }),
		new MoveStep({ token: MovementToken.Left }),
		new MoveStep({ token: MovementToken.Forward }),
		new MoveStep({ token: MovementToken.Right }),
		new MoveStep({ token: MovementToken.Right }),
		new SyncStep(phase4StartSignal),
		...repeat(1000, new MoveStep({ token: MovementToken.Right, fire: { left: true } }, false)),
	]),
	"Grateful Salmon": new ShipActor([
		new MoveStep({ token: MovementToken.Left }),
		new MoveStep({ token: MovementToken.Right }),
		new MoveStep({ token: MovementToken.Left }),
		new MoveStep({ token: MovementToken.Right }),
		new MoveStep({ token: MovementToken.Forward }),
		new WaitStep({ [MovementToken.Forward]: 2, [MovementToken.Left]: 1, [MovementToken.Right]: 1 }),
		new MoveStep({ token: MovementToken.Forward }),
		new MoveStep({ token: MovementToken.Forward }),
		new MoveStep({ token: MovementToken.Left }),
		new MoveStep({ token: MovementToken.Right }),
		new MoveStep({ token: MovementToken.Left }),
		new MoveStep({ token: MovementToken.Forward }),
		new MoveStep({ token: MovementToken.Forward }),
		new MoveStep({ token: MovementToken.Right }),
		new SyncStep(phase2StartSignal),
		...repeat(10, new MoveStep({ token: MovementToken.Left, fire: { right: true } }, false)),
		new SyncStep(phase3StartSignal),
		new MoveStep({ token: MovementToken.Forward }),
		new MoveStep({ token: MovementToken.Left }),
		new MoveStep({ token: MovementToken.Right }),
		new SyncStep(phase4StartSignal),
		...repeat(1000, new MoveStep({ token: MovementToken.Right, fire: { left: true } }, false)),
	]),
	"Idealistic Halibut": new ShipActor([
		new MoveStep({ token: MovementToken.Forward }),
		new MoveStep({ token: MovementToken.Forward }),
		new MoveStep({ token: MovementToken.Left }),
		new MoveStep({ token: MovementToken.Forward }),
		new MoveStep({ token: MovementToken.Right }),
		new MoveStep({ token: MovementToken.Forward }),
		new MoveStep({ token: MovementToken.Forward }),
		new WaitStep({ [MovementToken.Forward]: 2, [MovementToken.Right]: 1 }),
		new MoveStep({ token: MovementToken.Forward }),
		new MoveStep({ token: MovementToken.Forward }),
		new MoveStep({ token: MovementToken.Right }),
		new MoveStep({ token: MovementToken.Left }),
		new WaitStep({ [MovementToken.Right]: 1 }),
		new SyncStep(phase2StartSignal),
		...repeat(10, new MoveStep({ token: MovementToken.Right, fire: { left: true } }, false)),
		new SyncStep(phase3StartSignal),
		new MoveStep({ token: MovementToken.Forward }),
		new MoveStep({ token: MovementToken.Right }),
		new MoveStep({ token: MovementToken.Forward }),
		new MoveStep({ token: MovementToken.Forward }),
		new MoveStep({ token: MovementToken.Forward }),
		new MoveStep({ token: MovementToken.Right }),
		new WaitStep({ [MovementToken.Right]: 1 }),
		new SyncStep(phase4StartSignal),
		...repeat(1000, new MoveStep({ token: MovementToken.Right })),
	]),
	"Lazy Grunion": new ShipActor([
		new MoveStep({ token: MovementToken.Forward, fire: { left: true, right: true } }),
		new MoveStep({ token: MovementToken.Left }),
		new MoveStep({ token: MovementToken.Right }),
		new MoveStep({ token: MovementToken.Forward }),
		new MoveStep({ token: MovementToken.Forward }),
		new MoveStep({ token: MovementToken.Forward }),
		new MoveStep({ token: MovementToken.Forward }),
		new MoveStep({ token: MovementToken.Forward, fire: { left: true } }),
		new WaitStep({ [MovementToken.Right]: 1 }),
		new SyncStep(phase2StartSignal),
		...repeat(10, new MoveStep({ token: MovementToken.Left, fire: { left: true, right: true } }, false)),
		new SyncStep(phase3StartSignal),
		new WaitStep({ [MovementToken.Forward]: 1 }),
		new MoveStep({ token: MovementToken.Right }),
		new MoveStep({ token: MovementToken.Forward }),
		new MoveStep({ token: MovementToken.Forward }),
		new MoveStep({ token: MovementToken.Left }),
		new MoveStep({ token: MovementToken.Right }),
		new MoveStep({ token: MovementToken.Left }),
		new MoveStep({ token: MovementToken.Right }),
		new WaitStep({ [MovementToken.Left]: 1 }),
		new SyncStep(phase4StartSignal),
		...repeat(1000, new MoveStep({ token: MovementToken.Left, fire: { left: true } })),
	])
};

function getShip(state: GameState, name: string): ShipState {
	const ship = state.ships.find((ship) => ship.name === name);

	if (ship === undefined) {
		throw new Error(`Ship ${name} not found`);
	}

	return ship;
}

let round = 36;

while (true) {
	const moves = {} as Record<string, Move[]>;

	for (let i = 0; i < 4; i++) {
		for (const [shipName, actor] of Object.entries(actors)) {
			console.log(shipName);
			const move = actor.execute(getShip(state, shipName));
			moves[shipName] = moves[shipName] ?? [];
			moves[shipName].push(move);
		}
		SyncSignal.afterMove();
	}

	console.log(`Round ${round}:`, moves);

	for (const [shipName, turnMoves] of Object.entries(moves)) {
		socket.emit("setMoves", {
			id: getShip(state, shipName).id,
			moves: turnMoves as [Move, Move, Move, Move]
		});
	}

	console.log("emitting advanceRound");
	socket.emit("advanceRound", { round });
	round++;
	console.log("waiting for new state");
	const oldState = state;
	state = GameState.fromJson(await event("state"));
	console.log("Player score delta:", state.factions.find((f) => f.id === 1)!.score - oldState.factions.find((f) => f.id === 1)!.score);
	console.log("Enemy score delta:", state.factions.find((f) => f.id === 2)!.score - oldState.factions.find((f) => f.id === 2)!.score);

	// if (round == 5) {
	// 	break;
	// }
}