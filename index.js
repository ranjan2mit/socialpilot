const express = require("express");
const app = express();
const route = require("./src/routers");

app.use(express.json());
app.use(route);

app.listen(3000, () => console.log("server connected"));
