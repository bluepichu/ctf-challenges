"use strict";

var keysDown = {count: 0};
var state = null;
var oldState = null;
var facingDirection = 6;
var gameContainer = null;
var renderer = null;
var stage = null;
var floorContainer = null;
var alignmentContainer = null;
var itemContainer = null;
var playerContainer = null;
var enemyContainer = null;
var overlayContainer = null;
var effectsContainer = null;
var hudContainer = null;
var hudMapOverlay = null;
var hudMap = null;
var damageContainer = null;
var TILE_SIZE = 48;
var VIEW_WIDTH = 13;
var VIEW_HEIGHT = 9;
var socket = null;
var suppressRender = false;

var inputTimeout = null;
var INPUT_TIME = 75;
var WARP_TIME = 480;

var bgMove = null;

var lastAnimationTime = new Date().getTime();

var walkCycleFrame = 0;
var walkCycleTime = 0;

var entitySprites = {};
var itemSprites = {};
var damageIndicators = [];

$(document).ready(function(){
	socket = io();

	socket.on("online", function(count){
		$("#online-count").text(count);
	});

	socket.on("update", function(data){
		updateGrid(data);
	});

	socket.on("error", function(){
		console.error("server error");
		if(!inputTimeout){
			inputTimeout = setTimeout(inputLoop, INPUT_TIME);
		}
	});

	socket.on("failed", function(){
		console.warn("bad move");
		if(!inputTimeout){
			inputTimeout = setTimeout(inputLoop, INPUT_TIME);
		}
	});

	socket.on("win", function(){
		win();
	});

	renderer = PIXI.autoDetectRenderer(TILE_SIZE * VIEW_WIDTH, TILE_SIZE * VIEW_HEIGHT, {antialias: false});
	gameContainer = new PIXI.Container();

	document.getElementById("game-container").appendChild(renderer.view);

	PIXI.SCALE_MODES.DEFAULT = PIXI.SCALE_MODES.NEAREST;

	PIXI.Texture.addTextureToCache(PIXI.Texture.EMPTY, "empty");

	var loader = PIXI.loader
	.add("tiles", "/public/textures/tiles.json")
	.add("items", "/public/textures/items.json")
	.add("spatula", "/public/textures/spatula.json")
	.add("toaster", "/public/textures/toaster.json")
	.add("blender", "/public/textures/blender.json")
	.add("hud", "/public/textures/hud.json")
	.add("overlay", "/public/textures/overlay.json")
	.add("effects", "/public/textures/effects.json")
	.add("statboost", "/public/textures/statboost.json")
	.once("complete", function(){
		requestAnimationFrame(animate);
		newGame();
	}).load();

	$("body").keydown(function(e){
		keysDown[e.keyCode] = 1;
		keysDown.count++;
	});

	$("body").keyup(function(e){
		keysDown[e.keyCode] += 2;
		keysDown[e.keyCode] %= 4;

		if(keysDown[e.keyCode] == 0){
			keysDown.count--;
		}
	});
});

var sendMove = function(){
	var moveDir = -1;
	var input = 0;

	if(keysDown[37]){
		input += 1;
	}

	if(keysDown[38]){
		input += 2;
	}

	if(keysDown[39]){
		input += 4;
	}

	if(keysDown[40]){
		input += 8;
	}

	switch(input){
		case 4:
			moveDir = 0;
			break;
		case 6:
			moveDir = 1;
			break;
		case 2:
			moveDir = 2;
			break;
		case 3:
			moveDir = 3;
			break;
		case 1:
			moveDir = 4;
			break;
		case 9:
			moveDir = 5;
			break;
		case 8:
			moveDir = 6;
			break;
		case 12:
			moveDir = 7;
			break;
	}

	if(moveDir != -1){
		setEntityAnimation(0, "idle", moveDir);
	}

	if(moveDir >= 0){
		setPlayerDirection(moveDir);
	}

	if(keysDown[82]){ // R key makes you rotate without stepping
		inputTimeout = setTimeout(inputLoop, INPUT_TIME);
		return;
	}

	if(keysDown[13]){ // return does nothing
		api("action", {
			type: "none",
			direction: facingDirection
		});
		return;
	}

	if(keysDown[81]){
		api("resortItems", {});
		return;
	}

	if(keysDown[65]){
		api("action", {
			type: "item/use",
			item: 0,
			direction: facingDirection
		});
		return;
	} else if(keysDown[83]){
		api("action", {
			type: "item/use",
			item: 1,
			direction: facingDirection
		});
		return;
	} else if(keysDown[68]){
		api("action", {
			type: "item/use",
			item: 2,
			direction: facingDirection
		});
		return;
	} else if(keysDown[70]){
		api("action", {
			type: "item/use",
			item: 3,
			direction: facingDirection
		});
		return;
	} else if(keysDown[71]){
		api("action", {
			type: "item/use",
			item: 4,
			direction: facingDirection
		});
		return;
	} else if(keysDown[72]){
		api("action", {
			type: "item/use",
			item: 5,
			direction: facingDirection
		});
		return;
	} else if(keysDown[74]){
		api("action", {
			type: "item/use",
			item: 6,
			direction: facingDirection
		});
		return;
	} else if(keysDown[75]){
		api("action", {
			type: "item/use",
			item: 7,
			direction: facingDirection
		});
		return;
	}

	if(keysDown[90]){
		api("action", {
			type: "item/drop",
			item: 0,
			direction: facingDirection
		});
		return;
	} else if(keysDown[88]){
		api("action", {
			type: "item/drop",
			item: 1,
			direction: facingDirection
		});
		return;
	} else if(keysDown[67]){
		api("action", {
			type: "item/drop",
			item: 2,
			direction: facingDirection
		});
		return;
	} else if(keysDown[86]){
		api("action", {
			type: "item/drop",
			item: 3,
			direction: facingDirection
		});
		return;
	} else if(keysDown[66]){
		api("action", {
			type: "item/drop",
			item: 4,
			direction: facingDirection
		});
		return;
	} else if(keysDown[78]){
		api("action", {
			type: "item/drop",
			item: 5,
			direction: facingDirection
		});
		return;
	} else if(keysDown[77]){
		api("action", {
			type: "item/drop",
			item: 6,
			direction: facingDirection
		});
		return;
	} else if(keysDown[188]){
		api("action", {
			type: "item/drop",
			item: 7,
			direction: facingDirection
		});
		return;
	}

	if(keysDown[49] || keysDown[50] || keysDown[51] || keysDown[52]){
		// let's attack

		var atk = -1;

		if(keysDown[49]){
			atk = 0;
		} else if(keysDown[50]){
			atk = 1;
		} else if(keysDown[51]){
			atk = 2;
		} else if(keysDown[52]){
			atk = 3;
		}

		api("action", {
			type: "attack",
			attack: atk,
			direction: facingDirection
		});
		return;
	}

	// fine, we'll move

	if(moveDir == -1){
		inputTimeout = setTimeout(inputLoop, INPUT_TIME);
		return;
	}

	api("action", {
		type: "move",
		direction: moveDir
	});
}

var clearGrid = function(){
	if(floorContainer){
		gameContainer.removeChild(floorContainer);
		gameContainer.removeChild(alignmentContainer);
		gameContainer.removeChild(itemContainer);
		gameContainer.removeChild(playerContainer);
		gameContainer.removeChild(enemyContainer);
		gameContainer.removeChild(hudContainer);
		gameContainer.removeChild(overlayContainer);
		gameContainer.removeChild(effectsContainer);
	}

	floorContainer = new PIXI.Container();
	alignmentContainer = new PIXI.Container();
	itemContainer = new PIXI.Container();
	playerContainer = new PIXI.Container();
	enemyContainer = new PIXI.Container();
	damageContainer = new PIXI.Container();
	overlayContainer = new PIXI.Container();
	effectsContainer = new PIXI.Container();
	hudContainer = new PIXI.Container();
	hudMap = new PIXI.Container();
	hudMapOverlay = new PIXI.Container();

	gameContainer.addChild(floorContainer);
	gameContainer.addChild(alignmentContainer);
	gameContainer.addChild(itemContainer);
	gameContainer.addChild(playerContainer);
	gameContainer.addChild(enemyContainer);
	gameContainer.addChild(damageContainer);
	gameContainer.addChild(overlayContainer);
	gameContainer.addChild(effectsContainer);
	gameContainer.addChild(hudContainer);

	entitySprites = {};
	itemSprites = {};

	setEntityAnimation(0, "idle", 6, []);

	playerContainer.addChild(entitySprites[0].container);
	entitySprites[0].container.x = TILE_SIZE * (VIEW_WIDTH)/2;
	entitySprites[0].container.y = TILE_SIZE * (VIEW_HEIGHT)/2;

	hudContainer.x = 18;
	hudContainer.y = 18;

	hudContainer.addChild(hudMap);
	hudContainer.addChild(hudMapOverlay);

	var overlay = PIXI.Sprite.fromFrame("overlay");
	overlay.width = TILE_SIZE * VIEW_WIDTH;
	overlay.height = TILE_SIZE * VIEW_HEIGHT;
	overlayContainer.addChild(overlay);

	for(var i = -(VIEW_HEIGHT-1)/2; i <= (VIEW_HEIGHT-1)/2; i++){
		for(var j = -(VIEW_WIDTH-1)/2; j <= (VIEW_WIDTH-1)/2; j++){
			var spr = getSprite("tile-marker");
			spr.x = TILE_SIZE * (j + (VIEW_WIDTH-1)/2);
			spr.y = TILE_SIZE * (i + (VIEW_HEIGHT-1)/2);
			alignmentContainer.addChild(spr);
		}
	}
}

var updateGrid = function(stateUpdate){
	oldState = state;
	if (stateUpdate.type == "new") {
		state = stateUpdate.state;
	} else {
		state = $.extend(true, {}, state);
		for (var i = stateUpdate.state.length - 1; i >= 0; i--) {
			DeepDiff.applyChange(state, {}, stateUpdate.state[i]);
		}
	}

	if(oldState == state){
		if(!inputTimeout){
			inputTimeout = setTimeout(inputLoop, INPUT_TIME);
		}
		return;
	}

	if(oldState != null && state.map.floor != oldState.map.floor){
		displaySteps(state.log, 0, 0);

		setTimeout(function(){
			var storedState = state;
			state = null;

			storedState.log[0].outcome = [];
			updateGrid({ type: "new", state: storedState });
		}, 800);
		return;
	}

	if(oldState == null){
		clearGrid();

		for(var i = -10; i < state.map.height + 10; i++){
			for(var j = -10; j < 0; j++){
				addTileToFloor("wall-20", "wall-20" + ((i % 2 == 0 && (i+j) % 7 == 0) ? "b" : "a"), i, j);
			}
		}

		for(var i = -10; i < state.map.height + 10; i++){
			for(var j = state.map.width; j <= state.map.width + 10; j++){
				addTileToFloor("wall-20", "wall-20" + ((i % 2 == 0 && (i+j) % 7 == 0) ? "b" : "a"), i, j);
			}
		}

		for(var i = -10; i < 0; i++){
			for(var j = 0; j < state.map.width; j++){
				addTileToFloor("wall-20", "wall-20" + ((i % 2 == 0 && (i+j) % 7 == 0) ? "b" : "a"), i, j);
			}
		}

		for(var i = state.map.height; i < state.map.height + 10; i++){
			for(var j = 0; j < state.map.width; j++){
				addTileToFloor("wall-20", "wall-20" + ((i % 2 == 0 && (i+j) % 7 == 0) ? "b" : "a"), i, j);
			}
		}

		floorContainer.x = -TILE_SIZE * (state.player.location.c - (VIEW_WIDTH-1)/2);
		floorContainer.y = -TILE_SIZE * (state.player.location.r - (VIEW_HEIGHT-1)/2);
		itemContainer.x = -TILE_SIZE * (state.player.location.c - (VIEW_WIDTH-1)/2);
		itemContainer.y = -TILE_SIZE * (state.player.location.r - (VIEW_HEIGHT-1)/2);
		enemyContainer.x = -TILE_SIZE * (state.player.location.c - (VIEW_WIDTH-1)/2);
		enemyContainer.y = -TILE_SIZE * (state.player.location.r - (VIEW_HEIGHT-1)/2);
		damageContainer.x = -TILE_SIZE * (state.player.location.c - (VIEW_WIDTH-1)/2);
		damageContainer.y = -TILE_SIZE * (state.player.location.r - (VIEW_HEIGHT-1)/2);
	}

	if(state.map.grid[state.player.location.r][state.player.location.c] == 0){
		overlayContainer.visible = true;
	} else {
		overlayContainer.visible = false;
	}

	for(var i = 0; i < state.map.height; i++){
		for(var j = 0; j < state.map.width; j++){
			if(oldState == null
			   || state.map.grid[i][j] != oldState.map.grid[i][j]
			   || ((oldState == null || !oldState.map.stairs) && state.map.stairs && i == state.map.stairs.r && j == state.map.stairs.c)){
				if(state.map.stairs && i == state.map.stairs.r && j == state.map.stairs.c){
					addTileToFloor("stairs", "stairs", i, j, true);
				}

				if(state.map.grid[i][j] > 0){
					var probs = [.96, .04/11, .04/11, .04/11, .04/11, .04/11, .04/11, .04/11, .04/11, .04/11, .04/11, .04/11];

					var v = Math.random();
					var x = 0;

					while(v > 0){
						v -= probs[x];
						x++;
					}

					addTileToFloor("floor", "floor-" + x, i, j);
				} else if(state.map.grid[i][j] == 0){
					addTileToFloor("floor", "floor-1", i, j);
				} else if(state.map.grid[i][j] == -20){
					addTileToFloor("wall-20", "wall-20" + ((i % 2 == 0 && (i+j) % 7 == 0) ? "b" : "a"), i, j);
				} else if(state.map.grid[i][j] > -25){
					addTileToFloor("wall" + state.map.grid[i][j], "wall" + state.map.grid[i][j], i, j);
				}
			}
		}
	}

	for(var i = 0; i < state.enemies.length; i++){
		if(!(state.enemies[i].id in entitySprites)){
			setEntityAnimation(state.enemies[i].id, "idle", 6);
			enemyContainer.addChild(entitySprites[state.enemies[i].id].container);
			entitySprites[state.enemies[i].id].container.x = TILE_SIZE * (state.enemies[i].location.c + .5);
			entitySprites[state.enemies[i].id].container.y = TILE_SIZE * (state.enemies[i].location.r + .5);
		}
	}

	for(var ent in entitySprites){
		if(ent == 0){
			continue;
		}

		var found = false;

		for(var i = 0; i < state.enemies.length; i++){
			if(state.enemies[i].id == ent){
				found = true;
				break;
			}
		}

		for(var i = 0; i < state.log.length; i++){
			if(state.log[i].entity.id == ent){
				found = true;
				break;
			}

			for(var j = 0; j < state.log[i].outcome.length; j++){
				if(state.log[i].outcome[j].entity && state.log[i].outcome[j].entity.id == ent){
					found = true;
					break;
				}
			}

			if(found){
				break;
			}
		}

		if(!found){
			enemyContainer.removeChild(entitySprites[ent].container);
		} else if(enemyContainer.children.indexOf(entitySprites[ent].container) < 0){
			enemyContainer.addChild(entitySprites[ent].container);
		}
	}

	for(var i = 0; i < state.items.length; i++){
		if(!(state.items[i].id in itemSprites)){
			addItemToFloor(state.items[i].id, state.items[i].sprite, state.items[i].location.r, state.items[i].location.c);
		}
	}

	if(oldState != null){
		for(var i = 0; i < oldState.items.length; i++){
			if(oldState.items[i].render){
				enemyContainer.removeChild(oldState.items[i].render);
			}
		}
	}

	hudMapOverlay.removeChildren();

	for(var i = 0; i < state.items.length; i++){
		addHudIcon("item", state.items[i].location.r, state.items[i].location.c);
	}

	for(var i = 0; i < state.enemies.length; i++){
		addHudIcon("enemy", state.enemies[i].location.r, state.enemies[i].location.c);
	}

	addHudIcon("player", state.player.location.r, state.player.location.c);

	for(var i = 0; i < 8; i++){
		var row = $($("#item-table tr")[i+1]);

		if(i < state.player.items.length){
			$(row.children()[2]).html("<span class='item-icon " + state.player.items[i].name.toLowerCase() + "'></span><span class='item-name'>" + state.player.items[i].name + "</span>");
			$(row.children()[3]).text(state.player.items[i].description);
		} else {
			$(row.children()[2]).html("&mdash;");
			$(row.children()[3]).html("&mdash;");
		}
	}

	for(var i = 0; i < 4; i++){
		var row = $($("#attacks-table tr")[i+1]);

		if(i < state.player.attacks.length){
			var atk = state.player.attacks[i];

			$(row.children()[1]).html(format(atk.name, "attack"));

			switch(atk.range.type){
				case "straight":
					if(atk.range.distance == 1){
						$(row.children()[2]).text("Enemy in front" + (atk.range.cutsCorners ? "; cuts corners" : ""));
					} else if(atk.range.distance != -1) {
						$(row.children()[2]).text(sprintf("%s tiles in front", atk.range.distance) + (atk.range.cutsCorners ? "; cuts corners" : ""));
					} else {
						$(row.children()[2]).text(sprintf("Straight line", atk.range.distance));
					}
					break;
				case "room":
					$(row.children()[2]).text("Enemies in room");
					break;
				case "around":
					$(row.children()[2]).text("All directions");
					break;
				case "self":
					$(row.children()[2]).text("User");
					break;
			}

			$(row.children()[3]).html(atk.power || "&mdash;");
			$(row.children()[4]).html(atk.cost + "<span class='energy'></span>");
			$(row.children()[5]).html(atk.description || "&mdash;");
		} else {
			$(row.children()[1]).html("&mdash;");
			$(row.children()[2]).html("&mdash;");
			$(row.children()[3]).html("&mdash;");
			$(row.children()[4]).html("&mdash;");
			$(row.children()[5]).html("&mdash;");
		}
	}

	$("#stats-table tr:nth-child(1) td:nth-child(2)").text(state.player.stats.hp);
	$("#stats-table tr:nth-child(1) td:nth-child(3)").text("/" + state.player.stats.maxHp);
	$("#stats-table tr:nth-child(1) td.bar-container .bar-filled").width((state.player.stats.hp/state.player.stats.maxHp*100) + "%");

	$("#stats-table tr:nth-child(2) td:nth-child(2)").text(state.player.stats.energy);
	$("#stats-table tr:nth-child(2) td:nth-child(3)").text("/" + state.player.stats.maxEnergy);
	$("#stats-table tr:nth-child(2) td.bar-container .bar-filled").width((state.player.stats.energy/state.player.stats.maxEnergy*100) + "%");

	if(state.player.stats.modifiers.attack){
		$("#stats-table tr:nth-child(3) td.scale-container .scale-filled").width("calc(" +(Math.abs(state.player.stats.modifiers.attack)*5) + "% + 2px)");
		if(state.player.stats.modifiers.attack > 0){
			$("#stats-table tr:nth-child(3) td:nth-child(2)").text("+" + state.player.stats.modifiers.attack);
			$("#stats-table tr:nth-child(3) td.scale-container .scale-filled").css({
				"margin-left": (Math.abs(state.player.stats.modifiers.attack)*5) + "%",
				"margin-right": "0px",
				"background": "#66EE66",
				"border-left": "2px solid #FFFFFF",
				"border-right": "0px solid #FFFFFF"
			});
		} else {
			$("#stats-table tr:nth-child(3) td:nth-child(2)").text("-" + state.player.stats.modifiers.attack);
			$("#stats-table tr:nth-child(3) td.scale-container .scale-filled").width("calc(" +(Math.abs(state.player.stats.modifiers.attack)*5) + "% + 2px)");
			$("#stats-table tr:nth-child(3) td.scale-container .scale-filled").css({
				"margin-right": (Math.abs(state.player.stats.modifiers.attack)*5) + "%",
				"margin-left": "0px",
				"background": "#EE5555",
				"border-right": "2px solid #FFFFFF",
				"border-left": "0px solid #FFFFFF"
			});
		}
	} else {
		$("#stats-table tr:nth-child(3) td:nth-child(2)").html("&plusmn;0");
		$("#stats-table tr:nth-child(3) td.scale-container .scale-filled").width(0);
		$("#stats-table tr:nth-child(3) td.scale-container .scale-filled").css({
			"margin-left": "0px",
			"margin-right": "0px",
			"border-right": "2px solid #FFFFFF",
			"border-left": "0px solid #FFFFFF"
		});
	}

	if(state.player.stats.modifiers.defense){
		$("#stats-table tr:nth-child(4) td.scale-container .scale-filled").width("calc(" +(Math.abs(state.player.stats.modifiers.defense)*5) + "% + 2px)");
		if(state.player.stats.modifiers.defense > 0){
			$("#stats-table tr:nth-child(4) td:nth-child(2)").text("+" + state.player.stats.modifiers.defense);
			$("#stats-table tr:nth-child(4) td.scale-container .scale-filled").css({
				"margin-left": (Math.abs(state.player.stats.modifiers.defense)*5) + "%",
				"margin-right": "0px",
				"background": "#66EE66",
				"border-left": "2px solid #FFFFFF",
				"border-right": "0px solid #FFFFFF"
			});
		} else {
			$("#stats-table tr:nth-child(4) td:nth-child(2)").text("-" + state.player.stats.modifiers.defense);
			$("#stats-table tr:nth-child(4) td.scale-container .scale-filled").width("calc(" +(Math.abs(state.player.stats.modifiers.attack)*5) + "% + 2px)");
			$("#stats-table tr:nth-child(4) td.scale-container .scale-filled").css({
				"margin-right": (Math.abs(state.player.stats.modifiers.defense)*5) + "%",
				"margin-left": "0px",
				"background": "#EE5555",
				"border-right": "2px solid #FFFFFF",
				"border-left": "0px solid #FFFFFF"
			});
		}
	} else {
		$("#stats-table tr:nth-child(4) td:nth-child(2)").html("&plusmn;0");
		$("#stats-table tr:nth-child(4) td.scale-container .scale-filled").width(0);
		$("#stats-table tr:nth-child(4) td.scale-container .scale-filled").css({
			"margin-left": "0px",
			"margin-right": "0px",
			"border-right": "2px solid #FFFFFF",
			"border-left": "0px solid #FFFFFF"
		});
	}

	displaySteps(state.log, 0, 0);
}

var displaySteps = function(steps, i, delayBefore){
	if(i >= steps.length){
		setTimeout(function(){
			if(state.player.dead){
				lose();
			}

			if(state.t == 100){
				appendMessage(format("You hear a distant rumble.  Perhaps it's time to leave this floor.", "important"));
			} else if(state.t == 50){
				appendMessage(format("The rumbling seems to be approaching.  Best get moving along.", "important"));
			} else if(state.t == 20){
				appendMessage(format("The shaking increases in intensity; it's almost upon you.  Get out of there, quick!", "important"));
			} else if(state.t <= 0){
				appendMessage(format("Oh no!  You're too late!", "important"));
				lose();
			}
			if(!inputTimeout){
				inputTimeout = setTimeout(inputLoop, INPUT_TIME);
			}
		}, delayBefore - INPUT_TIME);
		return;
	}

	var nextSprites = {};
	var delayNext = 0;
	var delayNow = 0;

	var entity = null;

	if(steps[i].entity.id == 0){
		entity = state.player;
	} else {
		for(var j = 0; j < state.enemies.length; j++){
			if(steps[i].entity.id == state.enemies[j].id){
				entity = state.enemies[j];
			}
		}
	}

	switch(steps[i].action.type){
		case "move":
			if(!(steps[i].entity.id in entitySprites)){
				break;
			}
			setEntityAnimation(steps[i].entity.id, "walk", steps[i].action.direction, ["idle"]);
			delayNext = MOVE_TIME;
			if(steps[i].entity.id == 0){
				bgMove = {
					x: -TILE_SIZE * (state.player.location.c - (VIEW_WIDTH-1)/2) - floorContainer.x,
					y: -TILE_SIZE * (state.player.location.r - (VIEW_HEIGHT-1)/2) - floorContainer.y
				}
			} else {
				if(entity){
					entitySprites[steps[i].entity.id].move = {
						x: TILE_SIZE * (entity.location.c + .5) - entitySprites[steps[i].entity.id].container.x,
						y: TILE_SIZE * (entity.location.r + .5) - entitySprites[steps[i].entity.id].container.y,
					}
				}
			}
			break;

		case "item/use":
			appendMessage(sprintf("%s used the %s!", format(steps[i].entity.name, steps[i].entity.id == 0 ? "player" : "enemy"), format(steps[i].action.item, "item")));
			break;

		case "item/drop":
			appendMessage(sprintf("%s dropped the %s.", format(steps[i].entity.name, steps[i].entity.id == 0 ? "player" : "enemy"), format(steps[i].action.item, "item")));
			break;

		case "attack":
			appendMessage(sprintf("%s used %s!", format(steps[i].entity.name, steps[i].entity.id == 0 ? "player" : "enemy"), format(steps[i].action.attack, "attack")));

			if (!entity) {
				break;
			}

			if(delayBefore != 0){
				setTimeout(function(){
					displaySteps(steps, i, 0);
				}, delayBefore);
				return;
			}
			var hitDelay = 0;
			var pastHit = false;
			var anim = entity.sprites + "-attack-" + steps[i].action.attack.toLowerCase().replace(" ", "-");

			steps[i].action.effects.forEach(function(effect){
				switch(effect){
					case "heat":
						var overlay = PIXI.extras.TilingSprite.fromFrame("heat-overlay");
						effectsContainer.addChild(overlay);
						overlay.width = TILE_SIZE * VIEW_WIDTH;
						overlay.height = TILE_SIZE * VIEW_HEIGHT;

						setTimeout((function(overlay){
							return function(){
								effectsContainer.removeChild(overlay);
							}
						})(overlay), 800);
						break;
				}
			});

			for(var j = 0; j < animations[anim].length; j++){
				delayNow += animations[anim][j].length;

				if(!pastHit){
					hitDelay += animations[anim][j].length;
				}

				if(animations[anim][j].hitFrame){
					pastHit = true;
				}
			}

			setEntityAnimation(steps[i].entity.id, anim.substring(entity.sprites.length+1), steps[i].action.direction, ["idle"]);
			break;
	}

	for(var j = 0; j < steps[i].outcome.length; j++){
		switch(steps[i].outcome[j].type){
			case "item/get":
				appendMessage(sprintf("%s picked up the %s.", format(steps[i].entity.name, steps[i].entity.id == 0 ? "player" : "enemy"), format(steps[i].outcome[j].item, "item")));
				if(steps[i].outcome[j].id in itemSprites){
					itemContainer.removeChild(itemSprites[steps[i].outcome[j].id]);
					delete itemSprites[steps[i].outcome[j].id];
				}
				break;

			case "item/drop":
				appendMessage(sprintf("The %s fell to the ground.", format(steps[i].outcome[j].item, "item")));
				break;

			case "defeat":
				appendMessage(sprintf(steps[i].outcome[j].entity.id == 0 ? "Oh no!  %s was defeated!" : "%s was defeated!", format(steps[i].outcome[j].entity.name, steps[i].outcome[j].entity.id == 0 ? "player" : "enemy")));
				setTimeout((function(i, j){
					return function(){
						entitySprites[steps[i].outcome[j].entity.id].complete = ["defeat", "remove"];
					}
				})(i, j), hitDelay + 100);
				delayNow += 600;
				break;

			case "damage":
				if(steps[i].outcome[j].amount == 0){
					appendMessage(sprintf("The attack missed %s!", format(steps[i].outcome[j].entity.name, steps[i].outcome[j].entity.id == 0 ? "player" : "enemy")));
					if(entitySprites[steps[i].outcome[j].entity.id]){
						setTimeout((function(i, j){
							return function(){
								showStatChange(steps[i].outcome[j].entity.id, "hp", "MISS");
							}
						})(i, j), hitDelay + 100);
					}
				} else {
					appendMessage(sprintf("%s took %s damage!%s", format(steps[i].outcome[j].entity.name, steps[i].outcome[j].entity.id == 0 ? "player" : "enemy"), steps[i].outcome[j].amount, steps[i].outcome[j].critical ? "  A critical hit!" : ""));
					if(entitySprites[steps[i].outcome[j].entity.id]){
						setTimeout((function(i, j){
							return function(){
								setEntityAnimation(steps[i].outcome[j].entity.id, "hurt", -1, ["idle"]);
								showStatChange(steps[i].outcome[j].entity.id, "hp", "-" + steps[i].outcome[j].amount);
							}
						})(i, j), hitDelay + 100);
					}
				}
				delayNow = Math.max(delayNow, hitDelay + HURT_TIME);
				break;

			case "stat/modifier":
				if(steps[i].outcome[j].amount != 0){
					setTimeout((function(i, j){
						return function() {
							appendMessage(sprintf("%s's %s %s by %d!",format(steps[i].outcome[j].entity.name, steps[i].outcome[j].entity.id == 0 ? "player" : "enemy"), steps[i].outcome[j].stat, (steps[i].outcome[j].amount >= 0 ? "increased" : "decreased"), Math.abs(steps[i].outcome[j].amount)));
							showStatBoost(steps[i].outcome[j].entity, steps[i].outcome[j].stat);
						}
					})(i, j), delayNow);
					delayNow += 300;
				}
				break;

			case "stat/hp":
				if(steps[i].outcome[j].amount >= 0){
					appendMessage(sprintf("%s recovered %d HP!", format(steps[i].outcome[j].entity.name, steps[i].outcome[j].entity.id == 0 ? "player" : "enemy"), steps[i].outcome[j].amount));
					showStatChange(steps[i].outcome[j].entity.id, "hp", "+" + steps[i].outcome[j].amount);
				} else {
					appendMessage(sprintf("%s took %d damage!", format(steps[i].outcome[j].entity.name, steps[i].outcome[j].entity.id == 0 ? "player" : "enemy"), Math.abs(steps[i].outcome[j].amount)));
					showStatChange(steps[i].outcome[j].entity.id, "hp", steps[i].outcome[j].amount);
				}
				break;

			case "stat/energy":
				if(steps[i].outcome[j].amount >= 0){
					appendMessage(sprintf("%s recovered %d energy!", format(steps[i].outcome[j].entity.name, steps[i].outcome[j].entity.id == 0 ? "player" : "enemy"), steps[i].outcome[j].amount));
					showStatChange(steps[i].outcome[j].entity.id, "energy", "+" + steps[i].outcome[j].amount);
				} else {
					appendMessage(sprintf("%s lost %d energy!", format(steps[i].outcome[j].entity.name, steps[i].outcome[j].entity.id == 0 ? "player" : "enemy"), Math.abs(steps[i].outcome[j].amount)));
					showStatChange(steps[i].outcome[j].entity.id, "energy", steps[i].outcome[j].amount);
				}
				break;

			case "move":
				switch(steps[i].outcome[j].moveType){
					case "warp":
						delayNow = 2*WARP_TIME;
						setEntityAnimation(steps[i].outcome[j].entity.id, "warpout", 6, ["idle"]);

						setTimeout((function(outc){
							return function(){
								setEntityAnimation(outc.entity.id, "warpin", 6, ["idle"]);

								if(outc.entity.id == 0){
									floorContainer.x = -TILE_SIZE * (outc.location.c - (VIEW_WIDTH-1)/2);
									itemContainer.x = -TILE_SIZE * (outc.location.c - (VIEW_WIDTH-1)/2);
									enemyContainer.x = -TILE_SIZE * (outc.location.c - (VIEW_WIDTH-1)/2);
									damageContainer.x = -TILE_SIZE * (outc.location.c - (VIEW_WIDTH-1)/2);

									floorContainer.y = -TILE_SIZE * (outc.location.r - (VIEW_HEIGHT-1)/2);
									itemContainer.y = -TILE_SIZE * (outc.location.r - (VIEW_HEIGHT-1)/2);
									enemyContainer.y = -TILE_SIZE * (outc.location.r - (VIEW_HEIGHT-1)/2);
									damageContainer.y = -TILE_SIZE * (outc.location.r - (VIEW_HEIGHT-1)/2);
								} else {
									entitySprites[ent].container.x = TILE_SIZE * outc.location.c;
									entitySprites[ent].container.y = TILE_SIZE * outc.location.r;
								}
							}
						})(steps[i].outcome[j]), WARP_TIME);

						break;
				}
				break;

			case "floor":
				$("#floor-indicator .floor").text(steps[i].outcome[j].number);
				$("#floor-indicator").addClass("active");
				suppressRender = true;

				setTimeout((function(flr){
					return function(){
						$("#floor-indicator").removeClass("active");
						$("#message-log").empty();
						appendMessage(format(sprintf("&mdash; Entered %s, %s &mdash;", "Creaky Kitchen Floor", flr), "soft"));
						suppressRender = false;
					}
				})(steps[i].outcome[j].number), 2600);

				delayNow = 2600;
				break;

			case "revealFlag":
				if (steps[i].outcome[j].flag) {
					appendMessage(sprintf("A soft voice on the wind speaks to you: \"The secret you are looking for is %s.  Use it wisely.\"", format(steps[i].outcome[j].flag, "important")));
				} else {
					appendMessage("A soft voice on the wind speaks to you: \"This is not the secret you seek.  You need to keep looking.\"")
				}
				break;

			case "destroyItems":
				appendMessage("All items were destroyed!");
				itemContainer.removeChildren();
				break;
		}
	}

	setTimeout(function(){
		displaySteps(steps, i+1, delayNext)
	}, delayNow);
}

var inputLoop = function(){
	for(var key in keysDown){
		if(key != "count"){
			if(keysDown[key] % 2 == 1){
				keysDown[key]++;
				keysDown[key] %= 4;

				if(keysDown[key] == 0){
					keysDown.count--;
				}

				if(keysDown.count == -1){
					debugger;
				}
			}
		}
	}

	if(keysDown.count > 0){
		inputTimeout = null;
		sendMove();
	} else {
		inputTimeout = setTimeout(inputLoop, INPUT_TIME);
	}
}

var addTileToFloor = function(type, flavor, i, j, onTop){
	//	console.log("Adding " + type + " at " + i + ", " + j);
	var tile = getSprite(flavor);
	tile.x = TILE_SIZE * j;
	tile.y = TILE_SIZE * i;

	floorContainer.addChildAt(tile, onTop ? floorContainer.children.length : 0);

	var hudTile = getSprite("hud-" + type);
	hudTile.width = 8;
	hudTile.height = 8;
	hudTile.x = 8 * j;
	hudTile.y = 8 * i;

	hudMap.addChildAt(hudTile, onTop ? hudMap.children.length : 0);

	return tile;
}

var addHudIcon = function(type, i, j){
	var hudTile = getSprite("hud-" + type);
	hudTile.width = 8;
	hudTile.height = 8;
	hudTile.x = 8 * j;
	hudTile.y = 8 * i;

	hudMapOverlay.addChild(hudTile);
}

var addItemToFloor = function(id, type, i, j){
	var item = getSprite(type);
	item.width = 16/24*TILE_SIZE;
	item.height = 16/24*TILE_SIZE;
	item.pivot.x = 8;
	item.pivot.y = 8;

	item.x = TILE_SIZE * (j+.5);
	item.y = TILE_SIZE * (i+.5);
	itemSprites[id] = item;

	itemContainer.addChild(item);

	return item;
}

var setPlayerDirection = function(dir){
	facingDirection = dir;
}

var getSprite = function(name){
	var spr = PIXI.Sprite.fromFrame(name);
	spr.width = TILE_SIZE;
	spr.height = TILE_SIZE;

	return spr;
}

var newGame = function(){
	api("new", {});
	appendMessage(format(sprintf("&mdash; Entered %s, %s &mdash;", "Sinister Woods", "B1F"), "soft"));

	setTimeout(function(){
		$("#floor-indicator").removeClass("active");
	}, 1200);
}

var api = function(method, body, cb){
	socket.emit(method, body);
}

var setEntityAnimation = function(entity, anim, direction, onComplete){
	if(entity in entitySprites){
		entitySprites[entity].animation = anim;
		entitySprites[entity].direction = (direction == -1 ? entitySprites[entity].direction : direction);
		entitySprites[entity].t = 0;
		entitySprites[entity].frame = 0;
		entitySprites[entity].complete = onComplete || [];
	} else {
		var shadow = getSprite(getEntity(entity).sprites + "-shadow");
		var spr = getSprite(animations[getEntity(entity).sprites + "-" + anim][0].frame(direction));
		var cont = new PIXI.Container();
		cont.addChild(shadow);
		cont.addChild(spr);

		shadow.pivot.x = 12;
		shadow.pivot.y = 12;

		entitySprites[entity] = {
			animation: anim,
			direction: direction,
			t: 0,
			frame: 0,
			container: cont,
			sprite: spr,
			shadow: shadow,
			complete: onComplete || [],
			move: null
		};
	}
}

function appendMessage(msg){
	var cont = $("<div class='message'></div>");
	cont.html(msg);
	$("#message-log").append(cont);
	$("#message-log").stop().animate({ scrollTop: $("#message-log")[0].scrollHeight }, 600);
}

function format(str, type){
	return sprintf("<span class='%s'>%s</span>", type, str);
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

function showStatBoost(entity, stat) {
	var spr = entitySprites[entity.id];

	if (!spr) {
		return;
	}

	var statboost = PIXI.Sprite.fromFrame(stat + "-boost-0");
	statboost.pivot.x = 24;
	statboost.pivot.y = 43;
	statboost.scale.x = 2;
	statboost.scale.y = 2;
	statboost.x = spr.container.x;
	statboost.y = spr.container.y + 20;
	effectsContainer.addChild(statboost);

	function step(i) {
		return function() {
			i++;
			if (i <= 6) {
				statboost.texture = PIXI.Texture.fromFrame(stat + "-boost-" + i);
				setTimeout(step(i), 50);
			} else {
				effectsContainer.removeChild(statboost);
			}
		}
	}

	setTimeout(step(0), 50);
}

function showStatChange(entity, stat, change){
	var indicator = {
		text: new PIXI.Container(),
		time: 600
	};

	var color = "#FFFFFF";

	switch(stat){
		case "hp":
			color = "#FFFF33";
			break;
		case "energy":
			color = "#00AAFF";
			break;
	}

	indicator.text.addChild(new PIXI.Text(change, {font: "20px PMD", fill: color, strokeThickness: 4}));

	var ent = getEntity(entity);

	if(!ent){
		return;
	}

	if(entity != 0){
		indicator.text.x = entitySprites[entity].container.x - indicator.text.width/2;
		indicator.text.y = entitySprites[entity].container.y - TILE_SIZE*.75;
	} else {
		indicator.text.x = TILE_SIZE * (ent.location.c + .5) - indicator.text.width/2;
		indicator.text.y = TILE_SIZE * (ent.location.r - .75) + 21;
	}

	damageContainer.addChild(indicator.text);

	damageIndicators.push(indicator);
}

function getEntity(id){
	if(id == 0){
		return state.player;
	}

	for(var i = 0; i < state.enemies.length; i++){
		if(state.enemies[i].id == id){
			return state.enemies[i];
		}
	}

	for(var i = 0; i < oldState.enemies.length; i++){
		if(oldState.enemies[i].id == id){
			return oldState.enemies[i];
		}
	}

	return null;
}

var win = function(){
	$("#floor-indicator .floor").text("Dungeon Cleared - Congratulations!")
	$("#floor-indicator").addClass("active");
}

var lose = function(){
	setTimeout(function(){
		$("#floor-indicator .floor").text(sprintf("Defeated on %s.", $("#floor-indicator .floor").text()));
		$("#floor-indicator").addClass("active");
	}, 1200);
}

var animate = function(){
	requestAnimationFrame(animate);

	if(suppressRender){
		return;
	}

	var time = new Date().getTime();
	var delta = time-lastAnimationTime;

	if(bgMove){
		if(bgMove.x != 0){
			var dx = Math.min(Math.abs(bgMove.x), delta * TILE_SIZE/MOVE_TIME);
			dx *= bgMove.x / Math.abs(bgMove.x);

			floorContainer.x += dx;
			itemContainer.x += dx;
			enemyContainer.x += dx;
			damageContainer.x += dx;

			bgMove.x -= dx;
		}

		if(bgMove.y != 0){
			var dy = Math.min(Math.abs(bgMove.y), delta * TILE_SIZE/MOVE_TIME);
			dy *= bgMove.y / Math.abs(bgMove.y);

			floorContainer.y += dy;
			itemContainer.y += dy;
			enemyContainer.y += dy;
			damageContainer.y += dy;

			bgMove.y -= dy;
		}

		if(bgMove.x == 0 && bgMove.y == 0){
			bgMove = null;
		}
	}

	for(var i = 0; i < damageIndicators.length; i++){
		damageIndicators[i].time -= delta;
		if(damageIndicators[i].time < 0){
			damageContainer.removeChild(damageIndicators[i].text);
			damageIndicators.splice(i, 1);
			i--;
			continue;
		}

		damageIndicators[i].text.y -= delta/60;
	}

	for(var ent in entitySprites){
		var spr = entitySprites[ent];

		if(spr.animation == "remove"){
			enemyContainer.removeChild(spr.container);
			delete entitySprites[ent];
			continue;
		}

		spr.t += delta;
		var entity = getEntity(ent);

		if(!entity){
			enemyContainer.removeChild(spr.container);
			delete entitySprites[ent];
			continue;
		}

		var anim = entity.sprites + "-" + spr.animation;

		while(spr.t >= animations[anim][spr.frame].length){
			spr.t -= animations[anim][spr.frame].length;

			spr.frame++;

			if(spr.frame >= animations[anim].length){
				var next = (spr.complete.length == 0 ? spr.animation : spr.complete.shift());
				var reset = spr.animation != next;
				spr.animation = next
				spr.frame = 0;

				if(spr.animation == "remove"){
					enemyContainer.removeChild(spr.container);
					delete entitySprites[ent];
					break;
				}

				if(reset){
					spr.t = 0;
					break;
				}
			}
		}

		if(!(ent in entitySprites)){
			continue;
		}

		var fr = animations[anim][spr.frame].frame(spr.direction);
		var frd = getFrameDetails(fr);
		spr.sprite.texture = PIXI.Texture.fromFrame(fr);

		var dirArr = decodeDirection(spr.direction);

		spr.sprite.width = spr.sprite.texture.width*2;
		spr.sprite.height = spr.sprite.texture.height*2;
		spr.sprite.pivot = frd.pivot;
		spr.sprite.x = dirArr[1] * animations[anim][spr.frame].delta * TILE_SIZE;
		spr.sprite.y = dirArr[0] * animations[anim][spr.frame].delta * TILE_SIZE;

		if(spr.move){
			if(spr.move.x != 0){
				var dx = Math.min(Math.abs(spr.move.x), delta * TILE_SIZE/MOVE_TIME);
				dx *= spr.move.x / Math.abs(spr.move.x);

				spr.container.x += dx;
				spr.move.x -= dx;
			}

			if(spr.move.y != 0){
				var dy = Math.min(Math.abs(spr.move.y), delta * TILE_SIZE/MOVE_TIME);
				dy *= spr.move.y / Math.abs(spr.move.y);

				spr.container.y += dy;
				spr.move.y -= dy;
			}

			if(spr.move.x == 0 && spr.move.y == 0){
				spr.move = null;
			}
		}
	}

	if(alignmentContainer){
		alignmentContainer.visible = (keysDown[82] > 0);

		if(alignmentContainer.visible){
			alignmentContainer.children = [];
			var dir = decodeDirection(facingDirection);

			for(var i = -(VIEW_HEIGHT-1)/2; i <= (VIEW_HEIGHT-1)/2; i++){
				for(var j = -(VIEW_WIDTH-1)/2; j <= (VIEW_WIDTH-1)/2; j++){
					var text = "tile-marker";

					if((i == 0 && j == 0)
					   || (dir[0] != 0 && i/dir[0] >= 0 && j/i*dir[0] == dir[1])
					   || (dir[1] != 0 && j/dir[1] >= 0 && i/j*dir[1] == dir[0])){
						text = "tile-alignment-marker";
					}

					var spr = getSprite(text);
					spr.x = TILE_SIZE * (j + (VIEW_WIDTH-1)/2);
					spr.y = TILE_SIZE * (i + (VIEW_HEIGHT-1)/2);
					alignmentContainer.addChild(spr);
				}
			}
		}
	}

	lastAnimationTime = time;
	renderer.render(gameContainer);
}