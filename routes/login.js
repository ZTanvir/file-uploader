const express = require("express");
const loginRoute = express.Router();

loginRoute.get("/log-in", (req, res) => {
  res.render("pages/login-page");
});

module.exports = loginRoute;
