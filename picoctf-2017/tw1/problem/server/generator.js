var colors		= require("colors/safe");
var config		= require("./config");
var clone		= require("clone");
var utils		= require("./utils");

function generateFloor(floor){
	// Get actual options

	var opts = utils.getOptsForFloor(floor);

	var pl = clone(config.player);
	pl.id = 0;
	pl.stats.maxHp = pl.stats.hp;
	pl.stats.maxEnergy = pl.stats.energy;
	pl.stats.modifiers = {};
	pl.items = pl.items = [];
	pl.attacks = pl.attacks.map(function(atk){ return clone(config.attacks[atk]); });

	if(opts === null){
		return {done: true}; // no more floors
	}

	if(!opts.generate){
		var ret = clone(opts.description);
		ret.t = opts.timeLimit;
		ret.bgm = opts.bgm;
		ret.map.floor = floor;
		pl.location = ret.player.location;
		ret.player = pl;
		ret.log = [];
		return ret;
	}

	var timeLimit = opts.timeLimit;
	var bgm = opts.bgm;
	opts = opts.description;

	// Initialize map

	var grid = [];

	while(grid.length < opts.map.height){
		var row = [];
		while(row.length < opts.map.width){
			row.push(-1);
		}
		grid.push(row);
	}

	// Place rooms

	var roomCount = 0;

	for(var i = 0; i < opts.rooms.attempts; i++){
		var w = Math.floor(Math.random()*(opts.rooms.width.max - opts.rooms.width.min)) + opts.rooms.width.min;
		var h = Math.floor(Math.random()*(opts.rooms.height.max - opts.rooms.height.min)) + opts.rooms.height.min;
		var x = Math.floor(Math.random()*(opts.map.width - w-1));
		var y = Math.floor(Math.random()*(opts.map.height - h-1));

		while(w % opts.spacing != 1){
			w++;
		}
		while(h % opts.spacing != 1){
			h++;
		}
		while(x % opts.spacing != 1){
			x++;
		}
		while(y % opts.spacing != 1){
			y++;
		}

		var ok = x + w < opts.map.width && y + h < opts.map.height;

		for(var j = Math.max(y-opts.rooms.gutter, 0); j < Math.min(y+h+opts.rooms.gutter, opts.map.height); j++){
			for(var k = Math.max(x-opts.rooms.gutter); k < Math.min(x+w+opts.rooms.gutter, opts.map.width); k++){
				if(grid[j][k] >= 0){
					ok = false;
					break;
				}
			}
		}

		if(ok){
			roomCount++;

			for(var j = y; j < y+h; j++){
				for(var k = x; k < x+w; k++){
					try{
						grid[j][k] = roomCount;
					} catch(e){
						// ???
					}
				}
			}
		}
	}

	// Generate cooridors

	var cooridorCount = 0;

	for(var i = 1; i < opts.map.height; i += opts.spacing){
		for(var j = 1; j < opts.map.width; j += opts.spacing){
			if(grid[i][j] < 0){
				grid[i][j] = 0;
				cooridorCount += dfs(grid, i, j, null, opts);
			}
		}
	}

	// Connect to rooms

	var connections = {};

	for(var i = 0; i < opts.map.height; i++){
		for(var j = 0; j < opts.map.width; j++){
			if(grid[i][j] == 0 && (
				(i + opts.spacing < opts.map.height && grid[i+opts.spacing][j] == 0)
				|| (j + opts.spacing < opts.map.width && grid[i][j+opts.spacing] == 0)
				|| (i - opts.spacing >= 0 && grid[i-opts.spacing][j] == 0)
				|| (j - opts.spacing >= 0 && grid[i][j-opts.spacing] == 0))){
				for(var di = -1; di <= 1; di++){
					for(var dj = -1; dj <= 1; dj++){
						if(Math.abs(di) + Math.abs(dj) == 1){
							if(i + di*opts.spacing >= 0
							   && i + di*opts.spacing < opts.map.height
							   && j + dj*opts.spacing >= 0
							   && j + dj*opts.spacing < opts.map.width
							   && grid[i + di*opts.spacing][j + dj*opts.spacing] > 0){
								if(!(grid[i + di*opts.spacing][j + dj*opts.spacing] in connections)){
									connections[grid[i + di*opts.spacing][j + dj*opts.spacing]] = [];
								}
								connections[grid[i + di*opts.spacing][j + dj*opts.spacing]].push([i, j, di, dj]);
							}
						}
					}
				}
			}
		}
	}

	for(var room in connections){
		var choice = Math.floor(Math.random()*connections[room].length);
		var loc = connections[room][choice];

		for(var k = 0; k < opts.spacing; k++){
			grid[loc[0] + k*loc[2]][loc[1] + k*loc[3]] = 0;
		}

		for(var i = 0; i < connections[room].length; i++){
			var l = connections[room][i];
			var cnt = 0;
			for(var di = -1; di <= 1; di++){
				for(var dj = -1; dj <= 1; dj++){
					if(Math.abs(di) + Math.abs(dj) == 1 && grid[l[0]+l[2]+di][l[1]+l[3]+dj] == 0){
						cnt++;
					}
				}
			}
			if(cnt == 1 && Math.random() < opts.connectors.randomness){
				for(var k = 0; k < opts.spacing; k++){
					grid[l[0] + k*l[2]][l[1] + k*l[3]] = 0;
				}
			}
		}
	}

	// Remove cooridors

	var removed = 0;
	var removable = [];

	for(var i = 1; i < opts.map.height-1; i++){
		for(var j = 1; j < opts.map.width-1; j++){
			var cnt = 0;

			if(grid[i][j] != 0){
				continue;
			}

			for(var di = -1; di <= 1; di++){
				for(var dj = -1; dj <= 1; dj++){
					if(Math.abs(di) + Math.abs(dj) == 1 && grid[i+di][j+dj] >= 0){
						cnt++;
					}
				}
			}

			if(cnt == 1){
				removable.push([i, j]);
			}
		}
	}

	while(removable.length > 0 && removed < opts.corridors.remove * cooridorCount){
		var choice = Math.floor(Math.random() * removable.length);
		var loc = removable[choice];
		removable.splice(choice, 1);

		grid[loc[0]][loc[1]] = -1;
		removed++;

		for(var di = -1; di <= 1; di++){
			for(var dj = -1; dj <= 1; dj++){
				if(Math.abs(di) + Math.abs(dj) == 1 && grid[loc[0]+di][loc[1]+dj] >= 0){
					var cnt = 0;
					for(var ddi = -1; ddi <= 1; ddi++){
						for(var ddj = -1; ddj <= 1; ddj++){
							if(Math.abs(ddi) + Math.abs(ddj) == 1 && grid[loc[0]+di+ddi][loc[1]+dj+ddj] >= 0){
								cnt++;
							}
						}
					}

					if(cnt == 1){
						removable.push([loc[0]+di, loc[1]+dj]);
					}
				}
			}
		}
	}

	// Place player

	var playerLocation = {r: Math.floor(Math.random()*opts.map.height), c: Math.floor(Math.random()*opts.map.width)};

	while(grid[playerLocation.r][playerLocation.c] <= 0){
		playerLocation = {r: Math.floor(Math.random()*opts.map.height), c: Math.floor(Math.random()*opts.map.width)};
	}

	// Place stairs

	var stairsLocation = {r: Math.floor(Math.random()*opts.map.height), c: Math.floor(Math.random()*opts.map.width)};

	while(grid[stairsLocation.r][stairsLocation.c] <= 0 || (stairsLocation.r == playerLocation.r && stairsLocation.c == playerLocation.c)){
		stairsLocation = {r: Math.floor(Math.random()*opts.map.height), c: Math.floor(Math.random()*opts.map.width)};
	}

	// Place enemies

	var enemies = [];

	for(var i = 0; i < opts.enemies.density; i++){
		var enemyLoc = {r: Math.floor(Math.random()*opts.map.height), c: Math.floor(Math.random()*opts.map.width)};

		if(grid[enemyLoc.r][enemyLoc.c] <= 0 || (enemyLoc.r == playerLocation.r && enemyLoc.c == playerLocation.c) || (enemyLoc.r == stairsLocation.r && enemyLoc.c == stairsLocation.c)){
			continue;
		}

		var ok = true;

		for(var j = 0; j < enemies.length; j++){
			if(enemyLoc.r == enemies[j].location.r && enemyLoc.c == enemies[j].location.c){
				ok = false;
				break;
			}
		}

		if(ok){
			var en = generateEnemy(opts);
			en.location = enemyLoc;
			en.id = enemies.length + 1;
			enemies.push(en);
		}
	}

	// Place items

	var items = [];

	for(var i = 0; i < opts.items.density; i++){
		var itemLoc = {r: Math.floor(Math.random()*opts.map.height), c: Math.floor(Math.random()*opts.map.width)};

		if(grid[itemLoc.r][itemLoc.c] <= 0 || (itemLoc.r == playerLocation.r && itemLoc.c == playerLocation.c) || (itemLoc.r == stairsLocation.r && itemLoc.c == stairsLocation.c)){
			continue;
		}

		var ok = true;

		for(var j = 0; j < items.length; j++){
			if(itemLoc.r == items[j].location.r && itemLoc.c == items[j].location.c){
				ok = false;
				break;
			}
		}

		if(ok){
			var typeSelector = Math.random();
			var type = null;

			for(var itType in opts.items.distribution){
				type = itType;
				typeSelector -= opts.items.distribution[itType];

				if(typeSelector < 0){
					break;
				}
			}

			var item = clone(config.items[type]);
			item.location = itemLoc;
			item.id = items.length;
			items.push(item);
		}
	}

	// Fix wall designations

	for(var i = 0; i < opts.map.height; i++){
		for(var j = 0; j < opts.map.width; j++){
			if(grid[i][j] < 0){
				var d = 0;
				for(var ii = i-1; ii <= i+1; ii++){
					for(var jj = j-1; jj <= j+1; jj++){
						d <<= 1;
						if(ii < 0 || ii >= opts.map.height || jj < 0 || jj >= opts.map.width || grid[ii][jj] < 0){
							d += 1;
						}
					}
				}

				if((d & 0b111111111) == 0b111111111){
					grid[i][j] = -20;
				} else if((d & 0b111111011) == 0b111111011){
					grid[i][j] = -2;
				} else if((d & 0b111111110) == 0b111111110){
					grid[i][j] = -4;
				} else if((d & 0b110111111) == 0b110111111){
					grid[i][j] = -6;
				} else if((d & 0b011111111) == 0b011111111){
					grid[i][j] = -8;
				} else if((d & 0b011011011) == 0b011011011){
					grid[i][j] = -1;
				} else if((d & 0b111111000) == 0b111111000){
					grid[i][j] = -3;
				} else if((d & 0b110110110) == 0b110110110){
					grid[i][j] = -5;
				} else if((d & 0b000111111) == 0b000111111){
					grid[i][j] = -7;
				} else if((d & 0b011011000) == 0b011011000){
					grid[i][j] = -9;
				} else if((d & 0b110110000) == 0b110110000){
					grid[i][j] = -10;
				} else if((d & 0b000110110) == 0b000110110){
					grid[i][j] = -11;
				} else if((d & 0b000011011) == 0b000011011){
					grid[i][j] = -12;
				} else if((d & 0b010010010) == 0b010010010){
					grid[i][j] = -14;
				} else if((d & 0b000111000) == 0b000111000){
					grid[i][j] = -17;
				} else if((d & 0b000010010) == 0b000010010){
					grid[i][j] = -13;
				} else if((d & 0b010010000) == 0b010010000){
					grid[i][j] = -15;
				} else if((d & 0b000011000) == 0b000011000){
					grid[i][j] = -16;
				} else if((d & 0b000110000) == 0b000110000){
					grid[i][j] = -18;
				} else if((d & 0b000010000) == 0b000010000){
					grid[i][j] = -19;
				}
			}
		}
	}

	// Generate empty grid of same size

	var knownMap = [];

	for(var i = 0; i < opts.map.height; i++){
		knownMap.push([]);
		for(var j = 0; j < opts.map.width; j++){
			knownMap[i].push(-25);
		}
	}

	// Return results

	pl.location = playerLocation;

	return {
		map: {
			floor: floor,
			width: opts.map.width,
			height: opts.map.height,
			stairs: stairsLocation,
			grid: grid,
			known: {
				grid: knownMap
			}
		},
		player: pl,
		enemies: enemies,
		items: items,
		log: [],
		t: timeLimit,
		bgm: bgm
	}
}

function generateEnemy(opts){
	var typeSelector = Math.random();
	var type = null;

	for(var enType in opts.enemies.distribution){
		type = enType;
		typeSelector -= opts.enemies.distribution[enType];

		if(typeSelector < 0){
			break;
		}
	}

	var en = clone(config.enemies[type]);
	en.finalAttacks = [];

	var tot = 0;

	for(var atk in en.attacks){
		tot += en.attacks[atk];
	}

	for(var i = 0; i < 4; i++){
		if(tot == 0){
			break;
		}

		var x = Math.random()*tot;
		var a = null;

		for(var atk in en.attacks){
			a = atk;
			x -= en.attacks[atk];

			if(x < 0){
				tot -= en.attacks[atk];
				delete en.attacks[atk];
				break;
			}
		}

		en.finalAttacks.push(clone(config.attacks[a]));
	}

	en.attacks = en.finalAttacks;

	delete en.finalAttacks;

	en.items = [];
	/*en.items = [
		clone(config.items.berry)
	]*/
	en.stats.maxHp = en.stats.hp;
	en.stats.maxEnergy = en.stats.energy;
	en.stats.maxItems = 1;
	return en;
}

function dfs(grid, r, c, last, opts){
	var ret = 1;
	var moves = [[1, 0], [0, 1], [-1, 0], [0, -1]];
	moves = shuffle(moves);

	if(last != null && Math.random() < opts.corridors.straightness){
		moves.unshift(last);
	}

	for(var i = 0; i < moves.length; i++){
		var y = r + opts.spacing*moves[i][0];
		var x = c + opts.spacing*moves[i][1];

		if(y > 0 && y < opts.map.height && x > 0 && x < opts.map.width && grid[y][x] < 0){
			for(var k = 0; k <= opts.spacing; k++){
				grid[r + k*moves[i][0]][c + k*moves[i][1]] = 0;
			}

			ret += dfs(grid, y, x, moves[i], opts) + 1;
		}
	}

	return ret;
}

function shuffle(o){
	for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
	return o;
}

module.exports = {
	generateFloor: generateFloor,
	generateEnemy: generateEnemy
}
