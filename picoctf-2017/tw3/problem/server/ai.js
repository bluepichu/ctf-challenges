var clone	= require("clone");
var utils	= require("./utils");

module.exports = function(state, entity){
	// If HP is low, use an item or move to recover it
	if (entity.stats.hp <= entity.stats.maxHp / 4) {
		for (var i = 0; i < entity.items.length; i++) {
			for (var j = 0; j < entity.items[i].effects.length; j++) {
				if (entity.items[i].effects[j].type == "stat/hp") {
					return { type: "item/use", item: i, direction: 6 };
				}
			}
		}

		for (var i = 0; i < entity.attacks.length; i++) {
			for (var j = 0; j < entity.attacks[i].effects.length; j++) {
				if (entity.attacks[i].effects[j].type == "stat/hp") {
					return { type: "attack", attack: i, direction: 6 };
				}
			}
		}
	}

	// If energy is low, use an item or move to recover it
	if (entity.stats.energy <= entity.stats.maxEnergy / 4) {
		for (var i = 0; i < entity.items.length; i++) {
			for (var j = 0; j < entity.items[i].effects.length; j++) {
				if (entity.items[i].effects[j].type == "stat/energy") {
					return { type: "item/use", item: i, direction: 6 };
				}
			}
		}

		for (var i = 0; i < entity.attacks.length; i++) {
			for (var j = 0; j < entity.attacks[i].effects.length; j++) {
				if (entity.attacks[i].effects[j].type == "stat/energy") {
					return { type: "attack", attack: i, direction: 6 };
				}
			}
		}
	}

	// If we can attack the player, do so
	var attacks = [];

	for (var i = 0; i < entity.attacks.length; i++) {
		attacks.push(i);
	}

	for (var i = entity.attacks.length - 1; i >= 0; i--) {
		var index = Math.floor(Math.random() * (i + 1));
		var tmp = attacks[i];
		attacks[i] = attacks[index];
		attacks[index] = tmp;
	}

	var curDist = measureDist(state.player.location, entity.location);
	var playerRoom = state.map.grid[state.player.location.r][state.player.location.c];
	var entityRoom = state.map.grid[entity.location.r][entity.location.c];

	for (var i = 0; i < attacks.length; i++) {
		var attack = entity.attacks[attacks[i]];
		switch (attack.range.type) {
			case "self":
				break;

			case "room":
				if (playerRoom > 0 && playerRoom == entityRoom) {
					return { type: "attack", attack: attacks[i], direction: 6 };
				}
				break;

			case "around":
				if (curDist < 1.1) {
					return { type: "attack", attack: attacks[i], direction: 6 };
				}
				break;

			case "straight":
				if (curDist < 1.1) {
					for (var d = 0; d < 8; d += 2) {
						var dir = utils.decodeDirection(d);
						if (entity.location.r + dir[0] == state.player.location.r && entity.location.c + dir[1] == state.player.location.c) {
							return { type: "attack", attack: attacks[i], direction: d };
						}
					}

					for (var d = 1; d < 8; d += 2) {
						var dir = utils.decodeDirection(d);
						if (entity.location.r + dir[0] == state.player.location.r && entity.location.c + dir[1] == state.player.location.c && (attack.range.cutsCorners || (entityRoom > 0 && playerRoom > 0))) {
							return { type: "attack", attack: attacks[i], direction: d };
						}
					}
				}
				break;
		}
	}

	// If the player is nearby (at most 3 steps) or is in the same room, move toward them
	if (curDist <= 3 || (playerRoom > 0 && playerRoom == entityRoom)) {
		var bestDist = curDist;
		var bestDir = 0;

		for (var i = 0; i < 8; i++) {
			if (validMove(state, entity, { type: "move", direction: i })) {
				var dir = utils.decodeDirection(i);
				var newDist = measureDist(state.player.location, { r: entity.location.r + dir[0], c: entity.location.c + dir[1] });
				if (newDist < bestDist) {
					bestDist = newDist;
					bestDir = i;
				}
			}
		}

		entity.lastMoveDir = bestDir;
		return { type: "move", direction: bestDir };
	}

	// If we're in a corridor, try to keep moving in the same direction
	if (state.map.grid[entity.location.r][entity.location.c] == 0) {
		var offsets = [0, 1, 7, 2, 6];

		for (var i = 0; i < offsets.length; i++) {
			var movedir = (entity.lastMoveDir + offsets[i]) % 8;
			if (validMove(state, entity, { type: "move", direction: movedir })) {
				entity.lastMoveDir = movedir;
				return { type: "move", direction: movedir };
			}
		}
	}

	// If nothing else, do something random
	entity.lastMoveDir = Math.floor(Math.random() * 8);
	return { type: "move", direction: entity.lastMoveDir };
}

function validMove(state, entity, action) {
	var direction = action.direction;
	var directionArr = utils.decodeDirection(direction);

	if(directionArr == null){
		return false;
	}

	if(state.map.grid[entity.location.r][entity.location.c] == 0 && direction % 2 == 1){
		return false;
	}

	var row = entity.location.r
	var clm = entity.location.c

	row += directionArr[0];
	clm += directionArr[1];

	if(row < 0
	   || row >= state.map.height
	   || clm < 0
	   || clm >= state.map.width
	   || state.map.grid[row][clm] < 0
	   || (state.map.grid[row][clm] == 0 && direction % 2 == 1)){
		return false;
	}

	return true;
}

function measureDist(a, b) {
	var r = Math.abs(a.r - b.r);
	var c = Math.abs(a.c - b.c);

	var m = Math.min(r, c);
	var d = Math.max(r, c);

	return d + m / 20;
}
