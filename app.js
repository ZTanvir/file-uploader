const express = require("express");
const path = require("path");
const loginRoute = require("./routes/login");
const signupRoute = require("./routes/signup");

const app = express();
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.set("public", path.join(__dirname, "public"));
app.use("/public", express.static(path.join(__dirname, "public")));
// body parser middleware
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.get("/", (req, res) => {
  res.render("home");
});
app.use("/", loginRoute);
app.use("/", signupRoute);

module.exports = app;
