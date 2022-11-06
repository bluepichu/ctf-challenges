var mongo	= require("mongodb").MongoClient;
var nconf	= require("nconf");

nconf.argv().env();

let db;

function init() {
	mongo.connect(`mongodb://mongo:27017/blundertale?authSource=admin`)
		.then((d) => {
			db = d;
			console.log(nconf.get("MONGO_USER"), nconf.get("MONGO_PASS"));
			return db.authenticate(nconf.get("MONGO_USER"), nconf.get("MONGO_PASS"));
		})
		.then(() => {
			return db.createCollection("games");
		})
		.catch((err) => {
			console.error("[DB] DB connection failed", err);
			setTimeout(init, 1000);
		})
		.then(() => {
			db.close();
		});
}

init();
