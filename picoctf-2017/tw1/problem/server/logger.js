"use strict";

var colors = require("colors/safe");

var write = function(method, args, color){
	var msg = [];
	msg.push.apply(msg, args);
	console[method](colors[color](msg.join(" ")));
}

var log = function(){
	write("log", arguments, "white");
}

var info = function(){
	write("info", arguments, "blue");
}

var warn = function(){
	write("warn", arguments, "yellow");
}

var error = function(){
	write("error", arguments, "red");
}

module.exports = {
	log: log,
	info: info,
	warn: warn,
	error: error
};