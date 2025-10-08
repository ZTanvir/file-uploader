const express = require("express");
const loginRoute = express.Router();
const loginController = require("../controllers/loginController");

loginRoute.get("/log-in", loginController.logInGet);

loginRoute.post(
  "/log-in",
  loginController.signinValidationResult,
  loginController.logInPost,
  loginController.passportAuthenticate
);

loginRoute.get("/log-out", loginController.logOutGet);

module.exports = loginRoute;
