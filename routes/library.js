const express = require("express");
const libraryRoute = express.Router();
const multer = require("multer");
const prisma = require("../utils/prismaClient");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, `uploads/`);
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

libraryRoute.get("/library", async (req, res, next) => {
  const userId = req.user.id;

  const folderList = await prisma.folder.findMany({
    where: {
      userId,
      parentFolderId: null,
    },
  });
  const folderData = { parentFolderId: null, folderList };
  return res.render("pages/library-page", { folderData });
});

libraryRoute.get("/library/:parentFolder", async (req, res, next) => {
  const userId = req.user.id;
  const parentFolderId = Number(req.params.parentFolder);

  const folderList = await prisma.folder.findMany({
    where: {
      userId,
      parentFolderId,
    },
  });
  const folderData = { parentFolderId, folderList };

  return res.render("pages/library-page", { folderData });
});

libraryRoute.post("/library/:parentFolderId", async (req, res) => {
  const parentFolderId =
    req.params.parentFolderId === "null"
      ? null
      : Number(req.params.parentFolderId);
  const userId = req.user.id;
  const folderName = req.body.folderName;

  async function createFolder(parentFolderId, userId, folderName) {
    try {
      const folder = await prisma.folder.create({
        data: {
          name: folderName,
          userId,
          parentFolderId,
        },
      });
    } catch (error) {
      console.error("Error on creating new folder", error);
    }
  }

  if (!parentFolderId) {
    // parent folder null means root folder
    createFolder(parentFolderId, userId, folderName).then(() => {
      return res.status(200).end();
    });
  } else {
    // child folder
    createFolder(parentFolderId, userId, folderName).then(() => {
      return res.status(200).end();
    });
  }
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
