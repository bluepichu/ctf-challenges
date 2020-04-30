const express = require("express");

const app1 = express();
const app2 = express();

app1.use("/", (req, res) => {
	res.sendFile("index.html", { root: __dirname });
});

app2.use("/", (req, res) => {
	res.sendFile("index.html", { root: __dirname });
});

app1.listen(12345);
app1.listen(12346);
