const Router = require("express").Router();
const { index } = require("../controllers/index");
Router.get("/:hospitalCode", index);
module.exports = Router;
