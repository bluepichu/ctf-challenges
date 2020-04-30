import * as bl from "beautiful-log";
import { json } from "body-parser";
import { randomBytes, createHash } from "crypto";
import express from "express";
import eba from "express-basic-auth";
import nconf from "nconf";

import { pool, transaction } from "./db";
import { startWorkers } from "./workers";

nconf.argv().env();
const PORT = nconf.get("PORT") ?? 8080;
const MAX_WORKERS = parseInt(nconf.get("MAX_WORKERS") ?? "4", 10);

bl.init("frontend", "console");
const log = bl.make("top");

const app = express();

async function getCurrentDifficulty() {
	let result = await pool.query("SELECT COUNT(*) FROM job");
	let { count } = result.rows[0];
	return Math.min(32, 16 + Math.floor(Math.log(count + 1)));
}

app.use(eba({ challenge: true, users: { "ppp": "kg7n5X3XEghtUYS6" }}));

app.use("/challenge", json());

app.get("/challenge", async (req, res) => {
	let prefix = randomBytes(12).toString("hex");
	let difficulty = await getCurrentDifficulty();
	let result = await pool.query("INSERT INTO challenge (prefix, difficulty, deadline) VALUES ($1, $2, NOW() + interval '2 minutes') RETURNING *", [prefix, difficulty]);
	let { uid } = result.rows[0];
	res.json({ uid, prefix, difficulty });
});

app.post("/challenge", async (req, res) => {
	let { uid, response, url } = req.body;

	if (typeof uid !== "string" || typeof response !== "string" || typeof url !== "string") {
		res.status(400).send("Invalid request");
		return;
	}

	let urlOk = false;

	try {
		if (url.length < 100 && new URL(url).toString() === url) {
			urlOk = true;
		}
	} finally {
		if (!urlOk) {
			res.status(400).send("Invalid URL");
			return;
		}
	}

	try {
		await transaction(async (client) => {
			let result = await client.query("SELECT * FROM challenge WHERE uid = $1 AND deadline > NOW() FOR UPDATE LIMIT 1", [uid]);

			if (result.rowCount !== 1) {
				throw new Error("Invalid challenge");
			}

			let task: { uid: string, prefix: string, difficulty: number } = result.rows[0];
			let resultBuffer = createHash("sha256").update(task.prefix).update(response).digest();
			let value = resultBuffer.readUInt32BE(0);
			value >>>= (32 - task.difficulty);

			if (value === 0) {
				let insertResult = await client.query("INSERT INTO job (url) VALUES ($1) RETURNING uid", [url]);
				let countResult = await client.query("SELECT COUNT(*) FROM job WHERE completed_at IS NULL");
				res.status(200).json({
					uid: insertResult.rows[0].uid,
					count: parseInt(countResult.rows[0].count, 10)
				});
			} else {
				res.status(400).send("Challenge failed");
			}

			await client.query("DELETE FROM challenge WHERE uid = $1", [uid]);
		});
	} catch (err) {
		log.error(err);
		res.status(500).send("Something went wrong");
	}
});

app.get("/position", async (req, res) => {
	let { uid } = req.query;

	try {
		let result = await pool.query(`
			SELECT
				(SELECT COUNT(*) FROM job WHERE completed_at IS NULL AND created_at < (SELECT created_at FROM job WHERE uid = $1)) AS position,
				(SELECT completed_at IS NOT NULL FROM job WHERE uid = $1) as completed
		`, [uid]);
		res.status(200).send(result.rows[0]);
	} catch (err) {
		res.status(500).send("Something went wrong");
	}
});

app.use(express.static("public"));

app.listen(PORT, () => {
	log("Listening on :8080");
	startWorkers(MAX_WORKERS);
});
