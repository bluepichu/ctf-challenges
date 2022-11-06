"use strict";

var mongo	= require("mongodb").MongoClient;
var crypto	= require("crypto");
var nconf	= require("nconf");
var Promise	= require("promise");
var logger	= require("./logger");

var SCOREBOARD = {};

nconf.argv().env();

let games;

mongo.connect(`mongodb://mongo:27017/blundertale`)
	.then((d) => {
		games = d.collection("games");

		return d.authenticate(nconf.get("MONGO_USER"), nconf.get("MONGO_PASS"));
	})
	.then(() => {
		return games.stats();
	})
	.then((res) => {
		logger.info("[DB] DB is up");
	})
	.catch((err) => {
		logger.error("[DB] DB connection failed", err);
	});

module.exports = {
	newSession: function(){
		var id = crypto.randomBytes(64).toString("base64");

		return games.insert({
			socketId: id,
			state: null
		})
			.then(function(){
			return Promise.resolve(id);
		});
	},

	getState: function(socketId){
		return games.findOne({
			socketId: socketId
		}).then(function(data){
			data.state.map.floor = SCOREBOARD[socketId].floor;
			data.state.player.items = SCOREBOARD[socketId].items;

			return data.state;
		}).catch(function(err){
			// logger.error("Error in getState");
			// logger.error(err.stack);
		});
	},

	scoreboard: SCOREBOARD,

	censorScoreboard: function(io){
		return Object.keys(SCOREBOARD).map(function(id){
			var sock = io.sockets.connected[id];
			return {
				name: sock.name,
				color: sock.color,
				floor: SCOREBOARD[id].floor,
				items: SCOREBOARD[id].items.map(function(it){ return it.name; })
			};
		})
	},

	commit: function(socketId, state){
		if(!(socketId in SCOREBOARD)){
			SCOREBOARD[socketId] = {
				floor: -1,
				items: []
			};
		}

		if(state.map.floor > SCOREBOARD[socketId].floor){
			SCOREBOARD[socketId].time = new Date();
		}

		SCOREBOARD[socketId] = {
			floor: state.map.floor,
			items: state.player.items
		};

		delete state.map.floor;
		delete state.player.items;

		return games.update({
			socketId: socketId
		}, {
			$set: {
				state: state
			}
		}, {
			upsert: true
		});
	}
}