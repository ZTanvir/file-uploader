const express = require("express");
const libraryRoute = express.Router();
const libraryController = require("../controllers/libraryController");
const multer = require("multer");

const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: { fileSize: 5000000 }, // 5 mb file size limit
}).single("upload_file");

// Folders and files in root folder
libraryRoute.get("/library", libraryController.libraryRootPageGet);

// Folders and files in another folder
libraryRoute.get(
  "/library/:parentFolder",
  libraryController.librarySubfolderPageGet
);

// Add folder to root folder or subfolder
libraryRoute.post(
  "/library/folder/:parentFolderId",
  libraryController.libraryAddFolderPost
);
// Delete folder
libraryRoute.delete(
  "/library/folder/:parentFolderId",
  libraryController.libraryDeleteFolderDelete
);
// Edit folder name
libraryRoute.patch(
  "/library/folder/:parentFolderId",
  libraryController.libraryEditFolderPatch
);
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
