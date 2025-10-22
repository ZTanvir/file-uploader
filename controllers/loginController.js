const passport = require("passport");
const bcrypt = require("bcryptjs");
const dbQuery = require("../db/query");
const { body, validationResult } = require("express-validator");

const signinValidationResult = [
  body("username")
    .notEmpty()
    .withMessage("Please enter your username.")
    .custom(async (value, { req }) => {
      if (Boolean(value)) {
        // user typed something
        const user = await dbQuery.findUserByUserName(req.body.username);
        if (!user) {
          throw new Error("Username not found.");
        }
      }
    }),
  body("password")
    .notEmpty()
    .withMessage("Please enter your password.")
    .custom(async (value, { req }) => {
      if (Boolean(value)) {
        // user typed something
        const user = await dbQuery.findUserByUserName(req.body.username);
        if (user) {
          const match = await bcrypt.compare(value, user.password);
          if (!match) {
            throw new Error("Incorrect password.");
          }
        }
      }
    }),
];

const logInGet = (req, res) => {
  return res.render("pages/login-page", {
    errors: [],
    formData: {},
  });
};

const logInPost = async (req, res, next) => {
  console.log("I am in login post route");
  const username = req.body.username;
  const password = req.body.password;
  console.log("user", username, password);

  // validate username,password,confirm password
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).render("pages/login-page", {
      errors: errors.array(),
      formData: { username, password },
    });
  }
  next();
};

const logInDemoUser = async (req, res, next) => {
  const username = "demo user";
  const password = await bcrypt.hash("12345612345", 10);
  let demoUser = undefined;

  // check in db that is there any user with name demo-user
  const checkDemoUserInDb = await dbQuery.findUserByUserName(username);
  if (checkDemoUserInDb === null) {
    // register demo user
    const newUser = await dbQuery.createNewUser(username, password);
    demoUser = newUser;
  } else {
    // demo user already registered
    demoUser = checkDemoUserInDb;
  }

  req.login(demoUser, (err) => {
    if (err) return next(err);
    res.redirect("/");
  });
};

const passportAuthenticate = passport.authenticate("local", {
  successRedirect: "/",
  failureRedirect: "/log-in",
});

const logOutGet = (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
};

module.exports = {
  logInGet,
  signinValidationResult,
  logInPost,
  logInDemoUser,
  passportAuthenticate,
  logOutGet,
};
