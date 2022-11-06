"use strict";

import * as express          from "express";
import * as fs               from "fs";
import * as http             from "http";
import * as kue              from "kue";
import * as nconf            from "nconf";
import * as net              from "net";
import * as path             from "path";
import {generate as shortid} from "shortid";
import * as redis            from "redis";
import * as socketio         from "socket.io";
import * as socketioRedis    from "socket.io-redis";

import { generatePlayer }    from "../data/player";
import { scene, alphaScene } from "../data/overworld";

import CommController        from "./comm-controller";
import * as login            from "./login";

const log = require("beautiful-log")("dungeonkit:comm-server", { showDelta: false });
const redisClient = redis.createClient({ host: nconf.get("redis-host") || "127.0.0.1", port: nconf.get("redis-port") || 6379 });

// The following wasn't present in the original problem; users were created manually at deployment time
redisClient.set("user:bluepichu", "fbe7332815f0aa539dda2a01b0aabe135eee8cb993930446732f821fb35faae8");

interface GameInfo {
	room: string;
	name: string;
}

const controllerMap: Map<string, CommController> = new Map<string, CommController>();
const connections: Map<string, number> = new Map<string, number>();

const MAX_CONNECTIONS_PER_IP = 6;

/**
 * Starts this comm node.
 * @param queue - The job queue.
 */
export function start(queue: kue.Queue) {
	const app: express.Express = express();

	app.get("/", (req, res) => res.sendFile(path.join(__dirname, "../../client/index.html")));
	app.get("/game", (req, res) => res.sendFile(path.join(__dirname, "../../client/game.html")));
	app.get("/feed", (req, res) => res.sendFile(path.join(__dirname, "../../client/feed.html")));

	app.use("/", express.static(path.join(__dirname, "../../client")));

	const server: http.Server = app.listen(0, "localhost", () => {
		log("Comm server is up");
	});

	const io: SocketIO.Server = socketio(server);

	io.adapter(socketioRedis({ host: nconf.get("redis-host") || "127.0.0.1", port: nconf.get("redis-port") || 6379 }));

	io.on("connection", (socket: SocketIO.Socket) => {
		log(`<green>+ ${socket.id}</green>`);

		if (connections.get(socket.handshake.address) >= MAX_CONNECTIONS_PER_IP) {
			socket.disconnect();
			return;
		}

		if (!connections.has(socket.handshake.address)) {
			connections.set(socket.handshake.address, 0);
		}

		connections.set(socket.handshake.address, connections.get(socket.handshake.address) + 1);

		redisClient.hincrby(`comm_${process.env["worker_index"]}_stats`, "connections", 1);

		let player = generatePlayer();
		controllerMap.set(socket.id, new CommController(socket, queue, player, io));

		io.emit("feed", { type: "connect", user: socket.id });

		socket.on("disconnect", () => {
			connections.set(socket.handshake.address, connections.get(socket.handshake.address) - 1);
			log(`<red>- ${socket.id}</red>`);
			redisClient.hincrby(`comm_${process.env["worker_index"]}_stats`, "connections", -1);
			controllerMap.delete(socket.id);
		});

		socket.on("error", (err: Error) => log(err));

		socket.once("start", () => {
			log(`<magenta>S ${socket.id}</magenta>`);
			let controller = controllerMap.get(socket.id);
			controller.initOverworld(controller.user ? alphaScene : scene);
		});

		socket.once("login", (user: string, pass: string) => {
			login.checkLogin(user, pass)
				.then((user) => {
					controllerMap.get(socket.id).user = user;
					io.emit("feed", { type: "login", user: user, id: socket.id });
				})
				.catch(() => {
					// Do nothing
				});
		});
	});

	process.on("message", (message: string, connection: net.Socket) => {
		if (message !== "sticky-session:connection") {
			return;
		}

		server.emit("connection", connection);
		connection.resume();
	});

	process.on("unhandledRejection", (reason: string) => {
		log.error("Unhandled promise rejection:", reason);
	});

	queue.process("out", 2, (job: kue.Job, done: () => void) => {
		let { socketId, message } = job.data;
		let controller = controllerMap.get(socketId);
		if (controller === undefined) {
			log("No controller for socketId", socketId);
		} else {
			controller.receive(message);
		}
		done();
	});
}