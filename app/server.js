const express = require("express");
const bodyParser = require("body-parser");
const { exec } = require("child_process");

const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public")); // Assuming your HTML file is in a folder named "public"

app.get("/", (req, res) => {
	res.sendFile(__dirname + "/public/index.html");
});

app.post("/runScript", async (req, res) => {
	const baseUrl = req.body.baseUrl;
	const city = req.body.city;
	const country = req.body.country;
	const command = `node app.js ${baseUrl} ${city} ${country}`;

	exec(command, (error, stdout, stderr) => {
		if (error) {
			console.error(`Error: ${error.message}`);
			console.error("stderr:", stderr);
			return res.status(500).send("Internal Server Error");
		}
		console.log(`stdout: ${stdout}`);
		console.error(`stderr: ${stderr}`);
		res.status(200).send("Script executed successfully");
	});
});

app.listen(port, () => {
	console.log(`Server is running at http://localhost:${port}`);
});
