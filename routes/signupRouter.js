const express = require("express");
const signupRoute = express();
const signupController = require("../controllers/signupController");

signupRoute.get("/sign-up", signupController.signupGet);

signupRoute.post(
  "/sign-up",
  signupController.signupValidationResult,
  signupController.signupPost
);

module.exports = signupRoute;
