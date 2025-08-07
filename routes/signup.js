const express = require("express");
const signupRoute = express();
const bcryptjs = require("bcryptjs");
const prisma = require("../utils/prismaClient");

signupRoute.get("/sign-up", async (req, res) => {
  res.render("pages/signup-page");
});

signupRoute.post("/sign-up", (req, res) => {
  const username = req.body.username;
  const password = req.body.username;
  const confirmPassword = req.body.confirmPassword;
  console.log({ username, password, confirmPassword });
});
module.exports = signupRoute;
