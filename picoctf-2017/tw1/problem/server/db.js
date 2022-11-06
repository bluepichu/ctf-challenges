var mongo	= require("mongodb").MongoClient;
var crypto	= require("crypto");
var nconf	= require("nconf");
var Promise	= require("promise");
var logger	= require("./logger");

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
			return data.state;
		}).catch(logger.error);
	},

	commit: function(socketId, state){
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