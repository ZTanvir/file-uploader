const express = require("express");
const libraryRoute = express.Router();
const path = require("node:path");
const multer = require("multer");
const prisma = require("../utils/prismaClient");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, `uploads/`);
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
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
libraryRoute.delete("/library/:parentFolderId", async (req, res) => {
  const folderId = Number(req.params.parentFolderId);
  const userId = Number(req.user.id);
  try {
    const deleteFolder = await prisma.folder.delete({
      where: {
        id: folderId,
        userId,
      },
    });

    if (Object.keys(deleteFolder).length > 0) {
      return res.status(200).end();
    }
  } catch (error) {
    console.log("Error on deleting folder", error);
  }
});

libraryRoute.patch("/library/:parentFolderId", async (req, res) => {
  const folderId = Number(req.params.parentFolderId);
  const userId = Number(req.user.id);
  const newFolderName = String(req.body.newFolderName);
  try {
    const updateFolder = await prisma.folder.update({
      where: {
        userId,
        id: folderId,
      },
      data: {
        name: newFolderName,
      },
    });
    if (Object.keys(updateFolder).length > 0) {
      return res.status(200).end();
    }
  } catch (error) {
    console.error("Error on rename new folder:", error);
  }
});

libraryRoute.post("/upload/:parentFolderId", (req, res, next) => {
  const parentFolderId =
    req.params.parentFolderId === "null"
      ? null
      : Number(req.params.parentFolderId);
  const userId = req.user.id;

  upload(req, res, async (error) => {
    const fileName = req.file.filename;
    const fileSize = `${(Number(req.file.size) * 0.001).toFixed(2)} KB`;
    const fileDestination = String(req.file.path);

    if (error) {
      return res.status(500).json({ error });
    } else if (!req.file) {
      return res.status(400).json({ error: "Please upload a file" });
    }
    if (!parentFolderId) {
      // when parent folder null means in the root folder
      try {
        const file = await prisma.file.create({
          data: {
            name: fileName,
            size: fileSize,
            path: fileDestination,
            userId: userId,
          },
        });
        console.log("uploaded file", file);
      } catch (error) {
        console.error("Error when adding file to root folder", error);
        switch (error.code) {
          case "P2002": {
            return res.status(409).json({
              message:
                "You already have a same file in the folder.Please change the filename.",
            });
          }
        }
      }

      return res.status(200).json({ message: "File upload successfully" });
    }
  });
});

module.exports = libraryRoute;
