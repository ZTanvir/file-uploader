const express = require("express");
const libraryRoute = express.Router();
const multer = require("multer");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10000000 }, // 10 mb file size limit
}).single("upload_file");

libraryRoute.get("/library", (req, res, next) => {
  return res.render("pages/library-page");
});

libraryRoute.post("/upload", (req, res, next) => {
  upload(req, res, (error) => {
    if (error) {
      return res.status(500).json({ error });
    } else if (!req.file) {
      return res.status(400).json({ error: "Please upload a file" });
    }
    return res.status(200).json({ message: "File upload successfully" });
  });
});

module.exports = libraryRoute;
