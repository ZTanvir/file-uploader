const express = require("express");
const libraryRoute = express.Router();
const multer = require("multer");
const prisma = require("../utils/prismaClient");
const { supabase } = require("../utils/superbase");
const { decode } = require("base64-arraybuffer");

const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: { fileSize: 5000000 }, // 5 mb file size limit
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

libraryRoute.post("/library/folder/:parentFolderId", async (req, res) => {
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
libraryRoute.delete("/library/folder/:parentFolderId", async (req, res) => {
  const folderId = Number(req.params.parentFolderId);
  const userId = Number(req.user.id);
  //Todo: delete folder from supabase
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
libraryRoute.patch("/library/folder/:parentFolderId", async (req, res) => {
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
libraryRoute.delete("/library/file/:fileId", async (req, res) => {
  const fileId = Number(req.params.fileId);
  const userId = Number(req.user.id);

  // get file path
  const { path } = await prisma.file.findFirst({
    where: {
      id: fileId,
      userId,
    },
    select: {
      path: true,
    },
  });
  // delete file from supabase
  const { data, error } = await supabase.storage
    .from("file-uploads")
    .remove([`${path}`]);
  if (error) {
    console.log("Error on deleting file from supabase", error);
  } else {
    // delete file log from db
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
  }
});
// Edit file name
libraryRoute.patch("/library/file/:fileId", async (req, res) => {
  const fileId = Number(req.params.fileId);
  const user = req.user;
  const userName = user.username;
  const userId = Number(user.id);
  const newFileName = String(req.body.newFileName);
  // get file path from db
  let fileData = null;
  try {
    const fileDetails = await prisma.file.findFirst({
      where: {
        userId,
        id: fileId,
      },
    });
    fileData = fileDetails;
  } catch (error) {
    console.error("Could not find the file in db on download request", error);
  }
  // rename the path in supabase
  if (fileData !== null) {
    const newFilePath = `${userName}-${userId}/${fileData.parentFolderId}/${newFileName}`;
    const { data, error } = await supabase.storage
      .from("file-uploads")
      .move(`${fileData.path}`, `${newFilePath}`);
    if (error) {
      console.error("Error when rename file ", error);
    } else {
      // update the path in db
      try {
        const updateFile = await prisma.file.update({
          where: {
            userId,
            id: fileId,
          },
          data: {
            name: newFileName,
            path: newFilePath,
          },
        });
        if (Object.keys(updateFile).length > 0) {
          return res.status(200).end();
        }
      } catch (error) {
        console.error("Error on rename new folder:", error);
      }
    }
  }
});
// Download file
libraryRoute.get("/library/file/:fileId", async (req, res) => {
  const fileId = Number(req.params.fileId);
  const userId = Number(req.user.id);
  const fileData = await prisma.file.findFirst({
    where: {
      userId,
      id: fileId,
    },
  });
  const { path } = fileData;
  const { data, error } = supabase.storage
    .from("file-uploads")
    .getPublicUrl(`${path}`, {
      download: true,
    });
  if (error) {
    console.error(
      "Error while getting download url from supabase for this file.",
      error
    );
  } else {
    return res.status(200).redirect(data.publicUrl);
  }
});
// Get details of a file
libraryRoute.get("/library/file/fileDetails/:fileId", async (req, res) => {
  const fileId = Number(req.params.fileId);
  const userId = Number(req.user.id);
  const file = await prisma.file.findFirst({
    where: {
      id: fileId,
      userId,
    },
  });
  return res.render("pages/file-details-page", { file });
});
// Upload file
libraryRoute.post("/upload/:parentFolderId", (req, res, next) => {
  const parentFolderId =
    req.params.parentFolderId === "null"
      ? null
      : Number(req.params.parentFolderId);
  const user = req.user;

  upload(req, res, async (err) => {
    const file = req.file;

    if (err instanceof multer.MulterError) {
      return res.status(500).json({ err });
    } else if (!req.file) {
      return res.status(400).json({ error: "Please upload a file" });
    }
    const fileSize = `${(Number(req.file.size) * 0.001).toFixed(2)} KB`;
    const fileBase64 = decode(file.buffer.toString("base64"));
    const fileName = file.originalname;

    // file with same name will not store in same folder
    // store by userName/folder/file
    const filePathSupabase = `${user.username}-${user.id}/${parentFolderId}/${fileName}`;
    // upload file to supabase
    const { data, error } = await supabase.storage
      .from("file-uploads")
      .upload(`${filePathSupabase}`, fileBase64);
    const fileDestination = data?.path;
    if (error) {
      return res.status(400).json({ error: error.message });
    } else {
      if (!parentFolderId) {
        // when parent folder null means in the root folder
        try {
          const file = await prisma.file.create({
            data: {
              name: fileName,
              size: fileSize,
              path: fileDestination,
              userId: user?.id,
            },
          });
        } catch (error) {
          console.error(`Error when adding file to root folder`, error);
        }
        return res.status(200).json({ message: "File upload successfully" });
      } else {
        // when parent folder has id means it has parent folder
        try {
          const file = await prisma.file.create({
            data: {
              name: fileName,
              size: fileSize,
              path: fileDestination,
              parentFolderId: parentFolderId,
              userId: user?.id,
            },
          });
          return res.status(200).json({ message: "File upload successfully" });
        } catch (error) {
          console.error(
            `Error when adding file to a  subfolder with id ${parentFolderId}`,
            error
          );
        }
      }
    }
  });
});

module.exports = libraryRoute;
