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
  // get folder and file with parentFolder column null(Root folder)
  const userId = req.user.id;
  const folderList = await prisma.folder.findMany({
    where: {
      userId,
      parentFolderId: null,
    },
  });

  const fileList = await prisma.file.findMany({
    where: {
      parentFolderId: null,
      userId,
    },
  });
  const folderData = {
    parentFolder: { id: null, name: null },
    folderList,
    fileList,
  };
  return res.render("pages/library-page", { folderData });
});

libraryRoute.get("/library/:parentFolder", async (req, res, next) => {
  const userId = req.user.id;
  const parentFolderId = Number(req.params.parentFolder);

  const parentFolder = await prisma.folder.findFirst({
    where: {
      userId,
      id: parentFolderId,
    },
    select: {
      name: true,
    },
  });

  const folderList = await prisma.folder.findMany({
    where: {
      userId,
      parentFolderId,
    },
  });
  const fileList = await prisma.file.findMany({
    where: {
      parentFolderId,
      userId,
    },
  });
  const parentFolderName = parentFolder.name;

  const folderData = {
    parentFolder: { id: parentFolderId, name: parentFolderName },
    folderList,
    fileList,
  };

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
// Delete folder
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
    console.error("Error on deleting folder", error);
  }
});
// Edit folder name
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
// Delete file
libraryRoute.delete("/library/file/:parentFileId", async (req, res) => {
  const fileId = Number(req.params.parentFileId);
  const userId = Number(req.user.id);
  console.log(fileId, userId);
  try {
    const deleteFile = await prisma.file.delete({
      where: {
        id: fileId,
        userId,
      },
    });

    if (Object.keys(deleteFile).length > 0) {
      return res.status(200).end();
    }
  } catch (error) {
    console.error("Error on deleting folder", error);
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

    console.log("Multer error", error);

    if (error) {
      return res.status(500).json({ error });
    } else if (!req.file) {
      return res.status(400).json({ error: "Please upload a file" });
    }
    // when parent folder null means in the root folder
    if (!parentFolderId) {
      try {
        // check file with same name already in File table
        const files = await prisma.file.findMany({
          where: {
            userId,
            parentFolderId,
          },
        });
        const filterFileByName = files.filter((file) => file.name === fileName);

        if (filterFileByName.length > 0) {
          return res.status(409).json({
            error:
              "You already have a same file in the folder.Please change the filename.",
          });
        }
      } catch (error) {
        console.error("Error on fetching file from db.");
      }

      try {
        const file = await prisma.file.create({
          data: {
            name: fileName,
            size: fileSize,
            path: fileDestination,
            userId,
          },
        });
      } catch (error) {
        console.error(`Error when adding file to ${parentFolderId}`, error);
      }
      return res.status(200).json({ message: "File upload successfully" });
    } else {
      // For parent folder with id means it has parent folder
      try {
        // check file with same name already in File table
        const files = await prisma.file.findMany({
          where: {
            userId,
            parentFolderId,
          },
        });
        const filterFileByName = files.filter((file) => file.name === fileName);

        if (filterFileByName.length > 0) {
          return res.status(409).json({
            error:
              "You already have a same file in the folder.Please change the filename.",
          });
        }
      } catch (error) {
        console.error("Error on fetching file from db.");
      }
      try {
        const file = await prisma.file.create({
          data: {
            name: fileName,
            size: fileSize,
            path: fileDestination,
            parentFolderId: parentFolderId,
            userId,
          },
        });
        return res.status(200).json({ message: "File upload successfully" });
      } catch (error) {
        console.error("Error when adding file to a  subfolder", error);
      }
    }
  });
});

module.exports = libraryRoute;
