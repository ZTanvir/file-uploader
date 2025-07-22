const express = require("express");

const app = express();

app.get("/", (req, res) => {
  res.json({ message: "You are in home page" });
});

module.exports = app;
