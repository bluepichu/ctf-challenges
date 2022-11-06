"use strict";

$(document).ready(function(){
	window.socket = io();

	socket.emit("subscribe");

	socket.on("scoreboard", function(scoreboard){
		var order = Object.keys(scoreboard);
		
		order.sort(function(a, b){
			if(scoreboard[a].floor == scoreboard[b].floor){
				return scoreboard[a].time - scoreboard[b].time;
			}
			return scoreboard[b].floor - scoreboard[a].floor;
		})
		
		$("#scoreboard-table tr:not(#header)").remove();
		
		order.forEach(function(socket, rank){
			var it = [];
			
			for(var i = 0; i < 8; i++){
				if(i < scoreboard[socket].items.length){
					it.push(scoreboard[socket].items[i]);
				} else {
					it.push("none");
				}
			}
			var row = $("<tr></tr>");
			row.append("<td>" + (rank+1) + "</td>");
			row.append("<td style='color:" + scoreboard[socket].color +  ";'>" + scoreboard[socket].name + "</td>");
			row.append("<td> " + scoreboard[socket].floor + "</td>");
			row.append("<td>" + it.reduce(function(s, el){ return s + "<span class='item-icon " + el + "'></span>" }, "") + "</td>");
			$("#scoreboard-table").append(row);
		});
	});
})