const express = require("express");
const libraryRoute = express.Router();
const libraryController = require("../controllers/libraryController");

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
libraryRoute.delete(
  "/library/file/:fileId",
  libraryController.libraryDeleteFileDelete
);
// Edit file name
libraryRoute.patch(
  "/library/file/:fileId",
  libraryController.libraryEditFilePatch
);
// Download file
libraryRoute.get(
  "/library/file/:fileId",
  libraryController.libraryDownloadFileGet
);
// Get details of a file
libraryRoute.get(
  "/library/file/fileDetails/:fileId",
  libraryController.libraryFileDetailsGet
);
// Upload file
libraryRoute.post(
  "/upload/:parentFolderId",
  libraryController.libraryAddFilePost
);

module.exports = libraryRoute;
