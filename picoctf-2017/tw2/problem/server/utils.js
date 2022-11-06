"use strict";

var logger	= require("./logger");
var colors	= require("colors/safe");
var config	= require("./config");

function printState(state){
	console.log();
	var out = "";

	for(var i = 0; i < state.map.height; i++){
		for(var j = 0; j < state.map.width; j++){
			var isEnemyLoc = false;
			for(var k = 0; k < state.enemies.length; k++){
				if(i == state.enemies[k].location.r && j == state.enemies[k].location.c){
					isEnemyLoc = state.enemies[k].id;
					break;
				}
			}

			var isItemLoc = false;
			for(var k = 0; k < state.items.length; k++){
				if(i == state.items[k].location.r && j == state.items[k].location.c){
					isItemLoc = true;
					break;
				}
			}

			if(isEnemyLoc !== false){
				out += colors.red(getCircle(isEnemyLoc) + " ");
			} else if(i == state.player.location.r && j == state.player.location.c){
				out += colors.yellow("\u25cf ");
			} else if(isItemLoc){
				out += colors.blue("\u25cf ");
			} else if(state.map.stairs && i == state.map.stairs.r && j == state.map.stairs.c){
				out += colors.blue("\u29c8 ");
			} else if(state.map.grid[i][j] == -25){
				out += colors.black("\u2588\u2588");
			} else if(state.map.grid[i][j] <= -1){
				out += colors.blue("\u2588\u2588");
			} else {
				out += "  ";
			}
		}
		out += "\n";
	}
	console.log(out);
	console.log();
}

function getCircle(ind){
	if(ind === undefined){
		return "\u25cf";
	}
	if(ind == 0){
		return String.fromCharCode(0x24ea);
	}
	if(ind <= 20){
		return String.fromCharCode(0x245f + ind);
	}
	return String.fromCharCode(0x3250 + ind - 20);
}

function strpad(str, pad, width){
	while(str.length < width){
		str = pad + str;
	}
	return str;
}

function decodeDirection(dir){
	switch(dir){
		case 0:
			return [0, 1];
			break;
		case 1:
			return [-1, 1];
			break;
		case 2:
			return [-1, 0];
			break;
		case 3:
			return [-1, -1];
			break;
		case 4:
			return [0, -1];
			break;
		case 5:
			return [1, -1];
			break;
		case 6:
			return [1, 0];
			break;
		case 7:
			return [1, 1];
			break;
		default:
			return null;
			break;
	}
}

function getItemAtLocation(state, r, c) {
	for (var i = 0; i < state.items.length; i++) {
		var s = state.items[i]
		if (s.location.r == r && s.location.c == c) {
			return s
		}
	}
	return null
}

function getEntityAtLocation(state, r, c){
	if(state.player.location.r == r && state.player.location.c == c){
		return state.player;
	}

	for(var i = 0; i < state.enemies.length; i++){
		if(state.enemies[i].location.r == r && state.enemies[i].location.c == c){
			return state.enemies[i];
		}
	}

	return null;
}


function getEntitiesInRoom(state, roomId, includePlayer){
	includePlayer = includePlayer || false;

	if(roomId <= 0){
		return [];
	}

	var ret = state.enemies.filter(function(ent){
		return state.map.grid[ent.location.r][ent.location.c] == roomId;
	});

	if(includePlayer && state.map.grid[state.player.location.r][state.player.location.c] == roomId){
		ret.push(state.player);
	}

	return ret;
}

function getOptsForFloor(floor){
	for(var i = 0; i < config.floors.length; i++){
		if(config.floors[i].range[0] <= floor && config.floors[i].range[1] >= floor){
			return config.floors[i];
		}
	}
	
	return null;
}

module.exports = {
	printState: printState,
	decodeDirection: decodeDirection,
	getEntityAtLocation: getEntityAtLocation,
	getEntitiesInRoom: getEntitiesInRoom,
	getItemAtLocation: getItemAtLocation,
	getOptsForFloor: getOptsForFloor
}
