const { body, validationResult } = require("express-validator");
const bcryptjs = require("bcryptjs");
const prisma = require("../config/prismaClient");
const dbQuery = require("../db/query");

const signupValidationResult = [
  body("username")
    .notEmpty()
    .withMessage("Please enter your username.")
    .custom(async (value, { req }) => {
      const user = await dbQuery.findUserByUserName(req.body.username);
      if (user?.id) {
        throw new Error("User already exists with this name.");
      }
    }),

  body("password")
    .notEmpty()
    .withMessage("Please enter your password.")
    .escape()
    .isLength({ min: 10 })
    .withMessage("Password must be at least 10 digits long."),

  body("confirmPassword").custom(async (value, { req }) => {
    if (req.body.password !== value) {
      throw new Error("Please make sure your password match.");
    }
  }),
];

const signupGet = async (req, res) => {
  res.render("pages/signup-page", { errors: [], formData: {} });
};
const signupPost = async (req, res) => {
  const username = req.body.username;
  const password = req.body.password;
  const confirmPassword = req.body.confirmPassword;
  // validate username,password,confirm password
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).render("pages/signup-page", {
      errors: errors.array(),
      formData: { username, password, confirmPassword },
    });
  }
  // when user input pass the validation
  const hashedPassword = await bcryptjs.hash(password, 10);
  try {
    const newUser = await dbQuery.createNewUser(username, hashedPassword);
    if (newUser?.id) {
      // new register user added
      res.redirect("/log-in");
    }
  } catch (error) {
    console.log(error.message);
  }
};

module.exports = {
  signupValidationResult,
  signupGet,
  signupPost,
};
