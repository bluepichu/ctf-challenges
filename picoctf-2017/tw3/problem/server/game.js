var config		= require("./config");
var deepDiff    = require("deep-diff");
var generator	= require("./generator");
var Promise		= require("promise");
var db			= require("./db");
var logger		= require("./logger");
var generator	= require("./generator");
var utils		= require("./utils");
var ai			= require("./ai");
var clone       = require("clone");

var CONNECTION_COUNT = 0;

module.exports = function(app, io){
	io.on("connection", function(socket){
		// logger.info("[connection]", socket.id);

		CONNECTION_COUNT++;
		io.sockets.emit("online", CONNECTION_COUNT);

		socket.on("disconnect", function(){
			// delete session, probably

			// logger.error("[disconnect]", socket.id);
			CONNECTION_COUNT--;
			io.sockets.emit("online", CONNECTION_COUNT);
		});

		socket.once("new", function(){
			// logger.warn("[new]", socket.id);

			var state = generator.generateFloor(1);
			updateKnownMap(state);

			db.commit(socket.id, state)
				.then(sendState(socket, {}, true));
		});

		socket.on("resortItems", function(){
			// logger.warn("[sort]", socket.id);

			db.getState(socket.id)
				.then(function(state){

				if (state.done) {
					return;
				}

				var oldState = censor(state);

				state.player.items.sort(function(a, b){
					if(a.name < b.name){
						return -1;
					}

					if(a.name > b.name){
						return 1;
					}

					return 0;
				});

				for(var i = 0; i < state.player.items.length; i++){
					state.player.items[i].id = i;
				}

				state.log = [];

				return db.commit(socket.id, state)
					.then(sendState(socket, oldState, false));
			});
		})

		socket.on("action", function(action){
			// logger.warn("[action]", socket.id);

			db.getState(socket.id)
				.then(function(state){
				if (state.done) {
					return Promise.reject();
				}

				var log = [];

				var initState = censor(state);

				if(state.done){
					socket.emit("failed");
					throw false;
				}

				var ok = doAction(state, state.player, action, log);

				if(!ok){
					socket.emit("failed");
					throw false;
				}

				if(state.player.location.r == state.map.stairs.r && state.player.location.c == state.map.stairs.c){
					var newState = generator.generateFloor(state.map.floor+1);
					if(newState.done){
						socket.emit("win");
						return Promise.all([db.commit(socket.id, {done: true, win: true}), initState]);
					}

					newState.player.items = state.player.items;
					newState.player.stats = state.player.stats;
					newState.player.stats.modifiers = {};
					newState.player.attacks = state.player.attacks;
					state = newState;
					log[0].outcome.push({
						type: "floor",
						number: state.map.floor + "F"
					});

					state.enemies = state.enemies.filter(function(en){
						return !en.dead;
					});
				} else {
					state.enemies = state.enemies.filter(function(en){
						return !en.dead;
					});

					for(var i = 0; i < state.enemies.length; i++){
						if(state.enemies[i].dead || state.player.dead){
							continue;
						}
						var act = ai(state, state.enemies[i]);
						// logger.info("Enemy " + state.enemies[i].id + " has chosen " + JSON.stringify(act));
						if(!doAction(state, state.enemies[i], act, log)){
							// nice one, AI
							// logger.error("Enemy " + state.enemies[i].id + " has chosen poorly.");
						} else {
							state.enemies = state.enemies.filter(function(en){
								return !en.dead;
							});
						}
					}

					// check for respawn

					var opts = utils.getOptsForFloor(state.map.floor);

					if(opts != null && Math.random() < opts.description.enemies.spawnProbability){
						var enemy = generator.generateEnemy(opts.description);
						var loc = { r: 0, c: 0 };

						while(true){
							loc = {
								r: Math.floor(Math.random() * state.map.height),
								c: Math.floor(Math.random() * state.map.width)
							};

							if(state.map.grid[loc.r][loc.c] <= 0){
								continue;
							}

							if(state.map.grid[loc.r][loc.c] > 0
							   && state.map.grid[loc.r][loc.c] == state.map.grid[state.player.location.r][state.player.location.c]){
								continue;
							}

							if(Math.abs(state.player.location.r - loc.r) <= 5
							   && Math.abs(state.player.location.c - loc.c) <= 5){ // fixme
								continue;
							}

							var ok = true;

							for(var i = 0; i < state.enemies.length; i++){
								if(loc.r == state.enemies[i].location.r
								   && loc.c == state.enemies[i].location.c){
									ok = false;
									break;
								}
							}

							if(!ok){
								continue;
							}

							break;
						}

						if (state.enemies.length == 0) {
							enemy.id = 1;
						} else {
							enemy.id = state.enemies[state.enemies.length-1].id+1;
						}

						enemy.location = loc;
						state.enemies.push(enemy);
					}
				}

				updateKnownMap(state);

				var finalLog = [];

				for(var i = 0; i < log.length; i++){
					if(log[i].entity.id == 0){
						finalLog.push(log[i]);
						continue;
					}

					var ent = null;

					for(var j = 0; j < state.enemies.length; j++){
						if(state.enemies[j].id == log[i].entity.id){
							ent = state.enemies[j];
						}
					}

					if(ent == null){
						continue;
					}

					if(log[i].outcome.length > 0 || log[i].action.type == "attack"){
						finalLog.push(log[i]);
					} else if(log[i].action.type == "move" || log[i].action.type == "item/use"){
						if((Math.abs(ent.location.r - state.player.location.r) <= 5
							&& Math.abs(ent.location.c - state.player.location.c) <= 5)
						   || (state.map.grid[state.player.location.r][state.player.location.c] > 0
							   && state.map.grid[ent.location.r][ent.location.c] == state.map.grid[state.player.location.r][state.player.location.c])){
							finalLog.push(log[i]);
						}
					}
				}

				state.log = finalLog;

				for(var i = 0; i < finalLog.length; i++){
					for(var j = 0; j < finalLog[i].outcome.length; j++){
						if(finalLog[i].outcome[j].type == "defeat" && finalLog[i].outcome[j].entity.id == 0){
							state.done = true;
							state.win = false;
						}
					}
				}

				if(!state.done){
					state.t--;

					if(state.t <= 0){
						state.done = true;
						state.win = false;
					}
				}

				return Promise.all([db.commit(socket.id, state), initState]);
			})
				.then(([_, initState]) => sendState(socket, initState, false)())
				.catch(function(err){
				if(!err){
					return;
				}
				logger.error(err.stack);
				socket.emit("error");
			});
		});
	});
}

function sendState(socket, oldState, isNew){
	return function(){
		db.getState(socket.id)
			.then(function(state){
			if (state.done) {
				socket.emit("update", { type: "new", state: state });
				return;
			}

			var st = censor(state);

			if (isNew) {
				socket.emit("update", { type: "new", state: st });
			} else {
				socket.emit("update", { type: "diff", state: deepDiff.diff(oldState, st) || [] });
			}
		})
	}
}

function doAction(state, entity, action, log){
	if(!action || !action.type){
		return false;
	}

	switch(action.type){
		case "none":
			break;

		case "move":
			if(!executeMove(state, entity, action, log)){
				return false;
			}
			break;

		case "attack":
			if(!executeAttack(state, entity, action, log)){
				return false;
			}
			break;

		case "item/use":
			if(!executeItemUse(state, entity, action, log)){
				return false;
			}
			break;

		case "item/drop":
			if(!executeItemDrop(state, entity, action, log)){
				return false;
			}
			break;

		default:
			return false;
	}

	return true;
}

function executeMove(state, entity, action, log){
	var direction = action.direction;
	var directionArr = utils.decodeDirection(direction);

	if(directionArr == null){
		return false;
	}

	if(state.map.grid[entity.location.r][entity.location.c] == 0 && direction % 2 == 1){
		return false;
	}

	if(utils.getEntityAtLocation(state, entity.location.r + directionArr[0], entity.location.c + directionArr[1]) != null){
		return false;
	}

	entity.location.r += directionArr[0];
	entity.location.c += directionArr[1];

	if(entity.location.r < 0
	   || entity.location.r >= state.map.height
	   || entity.location.c < 0
	   || entity.location.c >= state.map.width
	   || state.map.grid[entity.location.r][entity.location.c] < 0
	   || (state.map.grid[entity.location.r][entity.location.c] == 0 && direction % 2 == 1)){
	   	entity.location.r -= directionArr[0];
		entity.location.c -= directionArr[1];
		return false;
	}

	var msg = {
		entity: {
			id: entity.id,
			name: entity.name
		},
		action: {
			type: "move",
			direction: direction
		},
		outcome: []
	};

	// item check
	if(entity.items.length < entity.stats.maxItems){
		var itId = -1;
		var name = "";
		for(var i = 0; i < state.items.length; i++){
			if(state.items[i].location.r == entity.location.r && state.items[i].location.c == entity.location.c){
				itId = state.items[i].id;
				msg.outcome.push({
					type: "item/get",
					id: state.items[i].id,
					item: state.items[i].name
				});
				break;
			}
		}
	}

	entity.items = entity.items.concat(state.items.filter(function(it){ return it.id == itId; }));
	state.items = state.items.filter(function(it){ return it.id != itId; });

	log.push(msg);

	return true;
}

function executeAttack(state, attacker, action, log){
	var attackId = action.attack;
	var direction = action.direction;
	var directionArr = utils.decodeDirection(direction);

	if(directionArr == null){
		return false;
	}

	var attack = attacker.attacks[attackId];

	if(!attack){
		return false;
	}

	if(attack.cost > attacker.stats.energy){
		// attack fails due to insufficient energy
		return false;
	}

	attacker.stats.energy -= attack.cost;

	// find target
	var targets = [];

	switch(attack.range.type){
		case "self":
			targets = [attacker];
			break;
		case "straight":
			var cr = attacker.location.r + directionArr[0];
			var cc = attacker.location.c + directionArr[1];

			for(var i = 0; i < (attack.range.distance >= 0 ? attack.range.distance : i+1); i++){
				if(!attack.range.cutsCorners && direction % 2 == 1 && (state.map.grid[attacker.location.r][attacker.location.c] == 0 || state.map.grid[cr][cc] == 0)){
					break;
				}

				var ent = utils.getEntityAtLocation(state, cr, cc);

				if(ent){
					targets = [ent];
					break;
				} else if(state.map.grid[cr][cc] < 0){
					break;
				}

				cr += directionArr[0];
				cc += directionArr[1];
			}
			break;
		case "room":
			targets = utils.getEntitiesInRoom(state, state.map.grid[attacker.location.r][attacker.location.c], true).filter((ent) => ent.id != attacker.id);
			break;
		case "around":
			for(var i = -1; i <= 1; i++){
				for(var j = -1; j <= 1; j++){
					if(Math.abs(i) + Math.abs(j) > 0){
						var ent = utils.getEntityAtLocation(state, attacker.location.r+i, attacker.location.c+j);

						if(ent != null){
							targets.push(ent);
						}
					}
				}
			}
	}

	var msg = {
		entity: {
			id: attacker.id,
			name: attacker.name
		},
		action: {
			type: "attack",
			direction: direction,
			attack: attack.name,
			sfx: attack.sfx,
			effects: attack.effects
		},
		outcome: []
	};

	// exec move
	for(var i = 0; i < targets.length; i++){
		if(attack.power > 0){
			var dmg = computeDamage(attack.power, attack.accuracy, attacker, targets[i]);
			// logger.warn("Attack hit " + targets[i].name + " for " + dmg.amount + " damage!");
			if (dmg.amount > 0) {
				targets[i].hit = true
			}
			msg.outcome.push({
				type: "damage",
				entity: {
					id: targets[i].id,
					name: targets[i].name
				},
				amount: dmg.amount,
				critical: dmg.critical
			});
			targets[i].stats.hp -= dmg.amount;
			targets[i].stats.hp = Math.max(targets[i].stats.hp, 0);
			if(targets[i].stats.hp == 0){
				targets[i].dead = true;
				msg.outcome.push({
					type: "defeat",
					entity: {
						id: targets[i].id,
						name: targets[i].name
					}
				})
				// logger.error(targets[i].name + " was defeated!");
				while(targets[i].items.length > 0){
					var it = targets[i].items[0];
					executeItemDrop(state, targets[i], {direction: 0, item: 0}, []);
					msg.outcome.push({
						type: "item/drop",
						id: it.id,
						item: it.name
					})
				}
			}
		}

		for(var j = 0; j < attack.effects.length; j++){
			var effect = attack.effects[j];
			switch(effect.type){
				case "stat/hp":
					targets[i].stats.hp += effect.change;
					targets[i].stats.hp = Math.min(targets[i].stats.hp, targets[i].stats.maxHp);
					msg.outcome.push({
						type: "stat/hp",
						amount: effect.change,
						entity: {
							id: targets[i].id,
							name: targets[i].name
						}
					});
					break;
				case "stat/energy":
					targets[i].stats.energy += effect.change;
					targets[i].stats.energy = Math.min(targets[i].stats.energy, targets[i].stats.maxEnergy);
					msg.outcome.push({
						type: "stat/energy",
						amount: effect.change,
						entity: {
							id: targets[i].id,
							name: targets[i].name
						}
					});
					break;
				case "stat/modifier":
					if(!(effect.stat in targets[i].stats.modifiers)){
						targets[i].stats.modifiers[effect.stat] = 0;
					}
					targets[i].stats.modifiers[effect.stat] += effect.change;
					targets[i].stats.modifiers[effect.stat] = Math.max(Math.min(10, targets[i].stats.modifiers[effect.stat]), -10);
					msg.outcome.push({
						type: "stat/modifier",
						stat: effect.stat,
						amount: effect.change,
						entity: {
							id: targets[i].id,
							name: targets[i].name
						}
					});
					break;
			}
		}
	}

	log.push(msg);

	return true;
}

function executeItemUse(state, entity, action, log){
	var direction = action.direction;
	var directionArr = utils.decodeDirection(direction);

	if(directionArr == null){
		return false;
	}

	if(action.item === undefined){
		return false;
	}

	if(action.item >= entity.items.length){
		return false;
	}

	var msg = {
		entity: {
			id: entity.id,
			name: entity.name
		},
		action: {
			type: "item/use",
			direction: direction,
			item: entity.items[action.item].name
		},
		outcome: []
	};

	for(var i = 0; i < entity.items[action.item].effects.length; i++){
		var effect = entity.items[action.item].effects[i];
		var outcome = {
			type: effect.type,
			entity: {
				id: entity.id,
				name: entity.name
			}
		};
		switch(effect.type){
			case "stat/hp":
				outcome.amount = Math.min(effect.change, entity.stats.maxHp - entity.stats.hp);
				entity.stats.hp += outcome.amount;
				break;
			case "stat/energy":
				outcome.amount = Math.min(effect.change, entity.stats.maxEnergy - entity.stats.energy);
				entity.stats.energy += outcome.amount;
				break;
			case "stat/modifier":
				outcome.stat = effect.stat;
				outcome.amount = effect.change;
				if(!(effect.stat in entity.stats.modifiers)){
					entity.stats.modifiers[effect.stat] = 0;
				}
				entity.stats.modifiers[effect.stat] += effect.change;
				break;
			case "revealStairs":
				state.map.known.stairs = state.map.stairs;
				break;
			case "move":
				switch(effect.location){
					case "random":
						var newloc = { r: Math.floor(Math.random() * state.map.height), c: Math.floor(Math.random() * state.map.width) };

						while(state.map.grid[newloc.r][newloc.c] <= 0
							  || (state.map.stairs.r == newloc.r && state.map.stairs.c == newloc.c)
							  || utils.getEntityAtLocation(state, newloc.r, newloc.c) != null){
							newloc = { r: Math.floor(Math.random() * state.map.height), c: Math.floor(Math.random() * state.map.width) };
						}

						outcome.moveType = "warp";
						outcome.location = newloc;
						entity.location = newloc;
						break;
				}
				break;
			case "destroyItems":
				state.player.items = [];
				state.items = [];
				msg.outcome.push(outcome);
				log.push(msg);
				return true;
			case "revealFlag":
				outcome.flag = process.env["PICO_CTF_FLAG"];
				break;
		}
		msg.outcome.push(outcome);
	}

	entity.items.splice(action.item, 1);

	log.push(msg);

	return true;
}

function executeItemDrop(state, entity, action, log){
	var direction = action.direction;
	var directionArr = utils.decodeDirection(direction);

	if(directionArr == null){
		return false;
	}

	if(action.item === undefined){
		return false;
	}

	if(action.item >= entity.items.length){
		return false;
	}

	var msg = {
		entity: {
			id: entity.id,
			name: entity.name
		},
		action: {
			type: "item/drop",
			direction: direction,
			item: entity.items[action.item].name
		},
		outcome: []
	};

	placeItem(state, entity.items[action.item], entity.location.r, entity.location.c);
	entity.items.splice(action.item, 1);

	log.push(msg);

	return true;
}

function placeItem(state, item, r, c){
	if(isValidDropLocation(state, r, c)){
		item.location = {r: r, c: c};
		state.items.push(item);
		return;
	}

	for(var i = 1; i < 8; i++){
		for(var j = 0; j < i; j++){
			if(i % 2 == 0){
				r++;
			} else {
				r--;
			}

			if(isValidDropLocation(state, r, c)){
				item.location = {r: r, c: c};
				state.items.push(item);
				return;
			}
		}

		for(var j = 0; j < i; j++){
			if(i % 2 == 0){
				c--;
			} else {
				c++;
			}

			if(isValidDropLocation(state, r, c)){
				item.location = {r: r, c: c};
				state.items.push(item);
				return;
			}
		}
	}
}

function isValidDropLocation(state, r, c){
	if(r < 0 || r >= state.map.height || c < 0 || c >= state.map.width){
		return false;
	}

	if(state.map.stairs.r == r && state.map.stairs.c == c){
		return false;
	}

	if(state.map.grid[r][c] < 0){
		return false;
	}

	for(var i = 0; i < state.items.length; i++){
		if(state.items[i].location.r == r && state.items[i].location.c == c){
			return false;
		}
	}

	return true;
}

function computeDamage(power, accuracy, attacker, defender){
	if(Math.random()*100 > accuracy){
		return {
			amount: 0,
			critical: false
		};
	}

	var atk = attacker.stats.attack * getAttackMultiplier(attacker.stats.modifiers.attack || 0);
	var def = defender.stats.defense * getDefenseMultiplier(defender.stats.modifiers.defense || 0);
	var crit = false;

	var dmg = (atk - def)/8 + (attacker.stats.attack / defender.stats.attack) * 20;

	dmg *= (57344 + Math.floor(Math.random()*16384))/65536;

	if(dmg < 1){
		dmg = 1;
	} else if(dmg > 999){
		dmg = 999;
	}

	if(Math.random() < .1){
		dmg = dmg * 1.5;
		crit = true;
	}

	dmg = Math.round(dmg);

	return {
		amount: dmg,
		critical: crit
	};
}

function getAttackMultiplier(stage){
	var val = 10 + stage;

	if(val < 0){
		val = 0;
	}

	if(val > 20){
		val = 20;
	}

	return [128, 133, 138, 143, 148, 153, 161, 171, 179, 204, 256, 307, 332, 358, 384, 409, 422, 435, 448, 460, 473][val] / 256;
}

function getDefenseMultiplier(stage){
	var val = 10 + stage;

	if(val < 0){
		val = 0;
	}

	if(val > 20){
		val = 20;
	}

	return [7, 12, 25, 38, 51, 64, 76, 102, 128, 179, 256, 332, 409, 486, 537, 588, 640, 691, 742, 793, 844][val] / 256;
}

function updateKnownMap(state){
	state.map.known.floor = state.map.floor;
	state.map.known.width = state.map.width;
	state.map.known.height = state.map.height;

	for(var i = Math.max(0, state.player.location.r - (config.viewport.height-1)/2);
		i < Math.min(state.map.height, state.player.location.r + (config.viewport.height-1)/2 + 1);
		i++){
		for(var j = Math.max(0, state.player.location.c - (config.viewport.width-1)/2);
			j < Math.min(state.map.width, state.player.location.c + (config.viewport.width-1)/2 + 1);
			j++){
			state.map.known.grid[i][j] = state.map.grid[i][j];
		}
	}

	if(state.map.grid[state.player.location.r][state.player.location.c] > 0){
		for(var i = 0; i < state.map.height; i++){
			for(var j = 0; j < state.map.width; j++){
				if(state.map.grid[i][j] == state.map.grid[state.player.location.r][state.player.location.c]){
					for(var ii = i-1; ii <= i+1; ii++){
						for(var jj = j-1; jj <= j+1; jj++){
							state.map.known.grid[ii][jj] = state.map.grid[ii][jj];
						}
					}
				}
			}
		}
	}

	if((
		Math.abs(state.map.stairs.r - state.player.location.r) <= (config.viewport.height-1)/2
		&& Math.abs(state.map.stairs.c - state.player.location.c) <= (config.viewport.width-1)/2)
	   || state.map.grid[state.map.stairs.r][state.map.stairs.c] == state.map.grid[state.player.location.r][state.player.location.c]){
		state.map.known.stairs = state.map.stairs;
	}
}

function censor(state){
	var censored = {
		bgm: state.bgm,
		player: clone(state.player),
		t: state.t,
		map: clone(state.map.known),
		log: clone(state.log)
	};

	var en = [];

	for(var i = 0; i < state.enemies.length; i++){
		if((Math.abs(state.enemies[i].location.r - state.player.location.r) <= (config.viewport.width-1)/2
			&& Math.abs(state.enemies[i].location.c - state.player.location.c) <= (config.viewport.width-1)/2)
		   || (state.map.grid[state.player.location.r][state.player.location.c] > 0
			   && state.map.grid[state.enemies[i].location.r][state.enemies[i].location.c] == state.map.grid[state.player.location.r][state.player.location.c])){
			en.push(clone(state.enemies[i]));
		}
	}

	var it = [];

	for(var i = 0; i < state.items.length; i++){
		if((Math.abs(state.items[i].location.r - state.player.location.r) <= (config.viewport.width-1)/2
			&& Math.abs(state.items[i].location.c - state.player.location.c) <= (config.viewport.width-1)/2)
		   || (state.map.grid[state.player.location.r][state.player.location.c] > 0
			   && state.map.grid[state.items[i].location.r][state.items[i].location.c] == state.map.grid[state.player.location.r][state.player.location.c])){
			it.push(clone(state.items[i]));
		}
	}

	censored.enemies = en;
	censored.items = it;
	return censored;
}
