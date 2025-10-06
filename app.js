const express = require("express");
const path = require("path");
const loginRoute = require("./routes/login");
const signupRoute = require("./routes/signup");
const libraryRoute = require("./routes/library");
const expressSession = require("express-session");
const passport = require("./config/passport");
const { PrismaSessionStore } = require("@quixo3/prisma-session-store");
const { PrismaClient } = require("@prisma/client");
require("dotenv").config();

const app = express();
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.set("public", path.join(__dirname, "public"));
app.use("/public", express.static(path.join(__dirname, "public")));
// body parser middleware
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.use(
  expressSession({
    cookie: {
      maxAge: 1 * 24 * 60 * 60 * 1000, // ms 	Determines how long the user stays logged in before their session cookie expires.
    },
    secret: process.env.SESSION_SECRET,
    resave: true,
    saveUninitialized: true,
    store: new PrismaSessionStore(new PrismaClient(), {
      checkPeriod: 1 * 24 * 60 * 60 * 1000, //ms Determines how often the database runs cleanup to remove expired session records.
      dbRecordIdIsSessionId: true,
      dbRecordIdFunction: undefined,
    }),
  })
);
app.use(passport.session());
// store user so it can use in views
app.use((req, res, next) => {
  res.locals.currentUser = req.user;
  next();
});

app.get("/", (req, res) => {
  res.render("home");
});
app.use("/", loginRoute);
app.use("/", signupRoute);
app.use("/", libraryRoute);

module.exports = app;
