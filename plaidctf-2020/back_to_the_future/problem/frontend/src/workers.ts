import * as bl from "beautiful-log";
import Docker from "dockerode";

import { transaction } from "./db";
import seccomp from "./seccomp";

const log = bl.make("workers");
const docker = new Docker();

export function startWorkers(count: number) {
	for (let i = 0; i < count; i++) {
		worker(i);
	}
}

function sleep(time: number) {
	return new Promise((resolve) => setTimeout(resolve, time));
}

async function worker(index: number) {
	while (true) {
		try {
			let jobCompleted = await transaction(async (client) => {
				let jobResult = await client.query("SELECT * FROM job WHERE completed_at IS NULL ORDER BY created_at LIMIT 1 FOR UPDATE SKIP LOCKED");
				let job: { uid: string, url: string } = jobResult.rows[0];

				if (!job) {
					return false;
				}

				await doJob(index, job.url);
				await client.query("UPDATE job SET completed_at = NOW() WHERE uid = $1", [job.uid]);
			});

			if (!jobCompleted) {
				log(`[worker ${index}] No job found; sleeping for 1s and trying again.`);
				await sleep(1000);
			} else {
				log(`[worker ${index}] Job completed!  Looking for a new job.`);
			}
		} catch (err) {
			log.error(err);
		}
	}
}

async function doJob(index: number, url: string) {
	log(`[worker ${index}] Launching worker container for URL <cyan>${url}</cyan>.`);

	let _, container = await docker.createContainer({
		Image: "bttf-worker:latest",
		HostConfig: {
			AutoRemove: true,
			SecurityOpt: [
				"seccomp=" + JSON.stringify(seccomp)
			]
		},
		Env: [
			`URL=${url}`
		]
	});
	await container.start();

	let rs = await container.attach({ stream: true, stdout: true, stderr: true });
	rs.pipe(process.stdout);

	log(`[worker ${index}] Container is up, waiting for 10s.`);
	await sleep(10000);

	try {
		log(`[worker ${index}] Killing the worker container.`);
		await container.stop();
		await container.remove();
	} catch (err) {
		// Guess it was already dead /shrug
	}
}
