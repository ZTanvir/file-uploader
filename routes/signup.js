const express = require("express");
const signupRoute = express();

signupRoute.get("/sign-up", (req, res) => {
  res.render("pages/signup-page");
});

module.exports = signupRoute;
