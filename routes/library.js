const express = require("express");
const libraryRoute = express.Router();

libraryRoute.get("/library", (req, res, next) => {
  return res.render("pages/library-page");
});

module.exports = libraryRoute;
