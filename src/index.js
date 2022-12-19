//import app from "./app.js";

const app = require("./app")

const port = process.env.PORT || 3000;

app.listen(port, () => {
	console.log(`Server is up at port http://localhost:${port}`);
});
