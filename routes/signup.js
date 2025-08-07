const express = require("express");
const signupRoute = express();

signupRoute.get("/sign-up", (req, res) => {
  res.render("pages/signup-page");
});

signupRoute.post("/sign-up", (req, res) => {
  const username = req.body.username;
  const password = req.body.username;
  const confirmPassword = req.body.confirmPassword;
  console.log({ username, password, confirmPassword });
});

module.exports = signupRoute;
