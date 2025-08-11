const express = require("express");
const loginRoute = express.Router();
const passport = require("passport");
const { body, validationResult } = require("express-validator");

const signinValidationResult = [
  body("username").notEmpty().withMessage("Please enter your username."),
  body("password").notEmpty().withMessage("Please enter your password."),
];

loginRoute.get("/log-in", (req, res) => {
  return res.render("pages/login-page", {
    errors: [],
    formData: {},
  });
});

loginRoute.post(
  "/log-in",
  signinValidationResult,
  passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/log-in",
  }),
  async (req, res) => {
    const username = req.body.username;
    const password = req.body.password;
    // validate username,password,confirm password
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).render("pages/login-page", {
        errors: errors.array(),
        formData: { username, password },
      });
    }
  }
);

loginRoute.get("/log-out", (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
});

module.exports = loginRoute;
