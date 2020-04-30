const express = require("express");

const app = express();

app.use("/", (req, res) => {
	res.sendFile("index.html", { root: __dirname });
});

app.listen(12345);
