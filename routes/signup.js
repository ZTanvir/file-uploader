const express = require("express");
const signupRoute = express();
const { body, validationResult } = require("express-validator");
const bcryptjs = require("bcryptjs");
const prisma = require("../utils/prismaClient");

const signupValidationResult = [
  body("username")
    .notEmpty()
    .withMessage("Please enter your username.")
    .custom(async (value, { req }) => {
      const existingUser = await prisma.user.findMany({
        where: {
          username: req.body.username,
        },
      });
      if (existingUser.length !== 0) {
        throw new Error("User already exists with this name.");
      }
    }),

  body("password")
    .notEmpty()
    .withMessage("Please enter your password.")
    .isLength({ min: 10 })
    .withMessage("Password must be at least 10 digit long."),

  body("confirmPassword").custom(async (value, { req }) => {
    if (req.body.password !== value) {
      throw new Error("Please make sure your password match.");
    }
  }),
];

signupRoute.get("/sign-up", async (req, res) => {
  res.render("pages/signup-page", { errors: [], formData: {} });
});

signupRoute.post("/sign-up", signupValidationResult, async (req, res) => {
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
    const newUser = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
      },
    });
    res.redirect("/log-in");
  } catch (error) {
    console.log(error.message);
  }
});

module.exports = signupRoute;
