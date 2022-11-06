"use strict";

document.addEventListener("DOMContentLoaded", () => {
	if ("WebFont" in window) { // Fails in offline mode
		WebFont.load({
			google: {
				families: ["Lato:100,300,400,700,900", "Material+Icons"]
			},
			active: start
		});
	} else {
		start();
	}
});

function start() {
	let commContainer = document.getElementById("comm-container");
	let logicContainer = document.getElementById("logic-container");
	let queueContainer = document.getElementById("queues-container");
	let socket = io();

	socket.on("update", (stats: MonitorStats) => {
		while (commContainer.firstChild) {
			commContainer.removeChild(commContainer.firstChild);
		}

		while (logicContainer.firstChild) {
			logicContainer.removeChild(logicContainer.firstChild);
		}

		while (queueContainer.firstChild) {
			queueContainer.removeChild(queueContainer.firstChild);
		}

		commContainer.innerHTML = stats.commNodes.map((stats) =>
			`<div class="node comm-node">
				<h2>${stats.name}</h2>
				<div class="connections">
					<span class="material-icons">label</span> ${0/*stats.connections*/}
				</div>
			</div>`).join("");

		logicContainer.innerHTML = stats.logicNodes.map((stats) =>
			`<div class="node logic-node">
				<h2>${stats.name}</h2>
				<div class="throughput">
					<span class="material-icons">arrow_forward</span> ${0/*stats.throughput / 5*/}
				</div>
				<div class="games">
					<span class="material-icons">videogame_asset</span> ${stats.games}
				</div>
			</div>`).join("");

		queueContainer.innerHTML = stats.queues.map((stats) =>
			`<div class="node queue">
				<h2>${stats.name}</h2>
				<div class="length">
					<span class="material-icons">view_headline</span> ${stats.length}
				</div>
			</div>`).join("");
	});
}