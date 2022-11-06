var express		= require("express");
var app			= express();

app.use(require("body-parser").json());
app.use(require("cookie-parser")());
// app.use(require("morgan")("dev"));

var http		= require("http").Server(app);
var path		= require("path");
var fs			= require("fs");
var Promise		= require("promise");
var logger		= require("./logger");
var sprintf		= require("sprintf");
var nconf		= require("nconf");
var db			= require("./db");
var io			= require("socket.io")(http);

require("./game")(app, io);

nconf.argv().env();

var PORT = nconf.get("port") || 8888;

app.get("/", function(req, res){
	res.status(200);
	res.sendFile(path.join(__dirname, "../public/html/index.html"));
});

app.use(express.static(path.join(__dirname, "..")));

http.listen(PORT, function(){
	logger.info("[server] Listening on *:" + PORT);
});

process.on("unhandledRejection", (err) => {
	logger.error(err.stack);
});