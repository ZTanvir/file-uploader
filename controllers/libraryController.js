const multer = require("multer");
const { decode } = require("base64-arraybuffer");
const { filesize } = require("filesize");
const dayjs = require("dayjs");
const relativeTime = require("dayjs/plugin/relativeTime");
const dbQuery = require("../db/query");
const { supabase } = require("../config/supabase");

const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: { fileSize: 5000000 }, // 5 mb file size limit
}).single("upload_file");

const libraryRootPageGet = async (req, res, next) => {
  // get folder and file with parentFolder column null(Root folder)
  const userId = req.user?.id;
  const folderList = await dbQuery.getFoldersByParentId(
    userId,
    (parentFolderId = null),
  );

  if (!userId) {
    // when unregister user try to visit /library
    return res.redirect("/log-in");
  }

  const fileList = await dbQuery.findFilesByParentId(
    userId,
    (parentFolderId = null),
  );
  // format date in x time ago from now
  dayjs.extend(relativeTime);
  const formateFolderListDate = folderList.map((folder) => ({
    ...folder,
    createdAt: dayjs(folder.createdAt).fromNow(),
    updatedAt: dayjs(folder.updatedAt).fromNow(),
  }));
  const formateFileListDate = fileList.map((file) => ({
    ...file,
    createdAt: dayjs(file.createdAt).fromNow(),
    updatedAt: dayjs(file.updatedAt).fromNow(),
  }));
  const folderData = {
    parentFolder: { id: null, name: null },
    folderList: formateFolderListDate,
    fileList: formateFileListDate,
  };

  return res.render("pages/library-page", { folderData });
};

const librarySubfolderPageGet = async (req, res, next) => {
  const userId = req.user?.id;
  const parentFolderId = Number(req.params.parentFolder);
  if (!userId) {
    // when unregister user try to visit /library
    return res.redirect("/log-in");
  }
  const parentFolder = await dbQuery.findFolderById(userId, parentFolderId);

  const folderList = await dbQuery.getFoldersByParentId(userId, parentFolderId);

  const fileList = await dbQuery.findFilesByParentId(userId, parentFolderId);
  const parentFolderName = parentFolder?.name;

  // format date in x time ago from now
  dayjs.extend(relativeTime);
  const formateFolderListDate = folderList.map((folder) => ({
    ...folder,
    createdAt: dayjs(folder.createdAt).fromNow(),
    updatedAt: dayjs(folder.updatedAt).fromNow(),
  }));
  const formateFileListDate = fileList.map((file) => ({
    ...file,
    createdAt: dayjs(file.createdAt).fromNow(),
    updatedAt: dayjs(file.updatedAt).fromNow(),
  }));

  const folderData = {
    parentFolder: { id: parentFolderId, name: parentFolderName },
    folderList: formateFolderListDate,
    fileList: formateFileListDate,
  };

  return res.render("pages/library-page", { folderData });
};

const libraryAddFolderPost = async (req, res) => {
  const parentFolderId =
    req.params.parentFolderId === "null"
      ? null
      : Number(req.params.parentFolderId);

  const user = req.user;
  const userId = req.user.id;
  const folderName = req.body.folderName;

  const rootFolder = `${user.username}-${user.id}`;

  if (!parentFolderId) {
    // parent folder null means root folder
    const folderPath = `${rootFolder}/${folderName}`;
    const folder = await dbQuery.createFolder(
      folderName,
      userId,
      parentFolderId,
      folderPath,
    );
    if (folder?.id) {
      return res.status(200).end();
    }
  } else {
    // child folder
    const parentFolder = await dbQuery.findFolderById(userId, parentFolderId);
    const parentFolderPath = parentFolder.path;
    const path = `${parentFolderPath}/${folderName}`;
    const folder = await dbQuery.createFolder(
      folderName,
      userId,
      parentFolderId,
      path,
    );

    if (folder?.id) {
      return res.status(200).end();
    }
  }
};

const libraryDeleteFolderDelete = async (req, res) => {
  const folderId = Number(req.params.parentFolderId);
  const userId = Number(req.user.id);
  let isFileDeleted = true;
  // get files in the folder
  const filesInFolder = await dbQuery.findFilesByParentId(userId, folderId);

  for (const file of filesInFolder) {
    // delete files from supabase
    const { data, error } = await supabase.storage
      .from("file-uploads")
      .remove([`${file.path}`]);

    if (error) {
      isFileDeleted = false;
      console.error("Error on deleting files inside folder:", error);
      return res.status(500).end();
    }
  }

  // get all nested folders inside the folder
  const allNestedFolders = await dbQuery.getAllChildFolders(folderId, userId);

  for (const folder of allNestedFolders) {
    // get files inside each folder

    const files = await dbQuery.findFilesByParentId(userId, folder.id);

    let filePaths = [];
    for (const file of files) {
      filePaths = filePaths.concat(file.path);
    }

    // delete files from supabase
    if (filePaths.length > 0) {
      const { data, error } = await supabase.storage
        .from("file-uploads")
        .remove(filePaths);

      if (error) {
        isFileDeleted = false;
        console.error("Error on deleting files inside folder:", error);
        return res.status(500).end();
      }
    }
  }

  // if both ok delete folder from db
  if (isFileDeleted) {
    const deletedFolder = await dbQuery.deleteFolder(folderId, userId);
    return res.status(200).end();
  }
};
const libraryEditFolderPatch = async (req, res) => {
  const folderId = Number(req.params.parentFolderId);
  const userId = Number(req.user.id);
  const newFolderName = String(req.body.newFolderName);
  let isFolderUpdated = true;

  const folder = await dbQuery.findFolderById(userId, folderId);
  // change the folder name in path
  const folderPath = folder.path.split("/").slice(0, -1);
  const updatedPath = folderPath.concat(newFolderName).join("/");
  const editedFolder = await dbQuery.editFolder(
    userId,
    folderId,
    newFolderName,
    updatedPath,
  );
  const filesInFolder = await dbQuery.findFilesByParentId(
    userId,
    editedFolder.id,
  );

  for (const file of filesInFolder) {
    // update file path , so user can delete,download and edit file from supabase
    const newPath = `${editedFolder.path}/${file.name}`;
    const updatedFileInFolder = await dbQuery.updateFileByNameAndPath(
      file.id,
      userId,
      file.name,
      newPath,
    );

    const { data, error } = await supabase.storage
      .from("file-uploads")
      .move(`${file.path}`, `${updatedFileInFolder.path}`);
    if (error) {
      isFolderUpdated = false;
      console.error("Error on moving file from one folder to another", error);
      return res.status(500).end();
    }
  }

  // get all child folders in a folder
  const allNestedFolders = await dbQuery.getAllChildFolders(folderId, userId);

  // update child folder path
  for (const folder of allNestedFolders) {
    const parentFolder = await dbQuery.getParentFolder(
      folder.parentFolderId,
      userId,
    );
    const parentFolderPath = parentFolder.path;
    const newPath = `${parentFolderPath}/${folder.name}`;
    // update folder path
    const updatedFolder = await dbQuery.editFolder(
      userId,
      folder.id,
      folder.name,
      newPath,
    );
  }
  const updatedNestedFolders = await dbQuery.getAllChildFolders(
    folderId,
    userId,
  );

  // get child file of each child folder
  // update child files path
  for (const folder of updatedNestedFolders) {
    const files = await dbQuery.findFilesByParentId(userId, folder.id);
    for (const file of files) {
      const newPath = `${folder.path}/${file.name}`;
      const updatedFileInFolder = await dbQuery.updateFileByNameAndPath(
        file.id,
        userId,
        file.name,
        newPath,
      );

      const { data, error } = await supabase.storage
        .from("file-uploads")
        .move(`${file.path}`, `${updatedFileInFolder.path}`);

      if (error) {
        isFolderUpdated = false;
        console.error("Error on moving file from one folder to another", error);
        return res.status(500).end();
      }
    }
  }

  if (isFolderUpdated) {
    return res.status(200).end();
  }
};
const libraryDeleteFileDelete = async (req, res) => {
  const fileId = Number(req.params.fileId);
  const userId = Number(req.user.id);

  // get file path
  const path = await dbQuery.getFilePathById(fileId, userId);
  // delete file from supabase
  const { data, error } = await supabase.storage
    .from("file-uploads")
    .remove([`${path}`]);
  if (error) {
    console.error("Error on deleting file from supabase", error);
  } else {
    // delete file log from db
    const deleteFile = await dbQuery.deleteFile(fileId, userId);

    if (Object.keys(deleteFile).length > 0) {
      return res.status(200).end();
    }
  }
};

const libraryEditFilePatch = async (req, res) => {
  const fileId = Number(req.params.fileId);
  const user = req.user;
  const userId = Number(user.id);
  const newFileName = String(req.body.newFileName);
  // get file path from db
  const fileData = await dbQuery.findFileById(fileId, userId);
  console.log("File data", fileData);
  // rename the path in supabase
  if (fileData?.id) {
    const splitPath = fileData.path.split("/");
    const updatedPath = `${splitPath
      .slice(0, splitPath.length - 1)
      .join("/")}/${newFileName}`;

    const { data, error } = await supabase.storage
      .from("file-uploads")
      .move(`${fileData.path}`, `${updatedPath}`);
    if (error) {
      console.error("Error when rename file ", error);
    } else {
      // update the path in db
      const updateFile = await dbQuery.updateFileByNameAndPath(
        fileId,
        userId,
        newFileName,
        updatedPath,
      );
      if (Object.keys(updateFile).length > 0) {
        return res.status(200).end();
      }
    }
  }
};

const libraryDownloadFileGet = async (req, res) => {
  const fileId = Number(req.params.fileId);
  const userId = Number(req.user.id);
  const fileData = await dbQuery.findFileById(fileId, userId);

  const { path } = fileData;
  const { data, error } = supabase.storage
    .from("file-uploads")
    .getPublicUrl(`${path}`, {
      download: true,
    });
  if (error) {
    console.error(
      "Error while getting download url from supabase for this file.",
      error,
    );
  } else {
    return res.status(200).redirect(data.publicUrl);
  }
};

const libraryFileDetailsGet = async (req, res) => {
  const fileId = Number(req.params.fileId);
  const userId = Number(req.user.id);
  const file = await dbQuery.findFileById(fileId, userId);
  return res.render("pages/file-details-page", { file });
};
const libraryAddFilePost = (req, res, next) => {
  const parentFolderId =
    req.params.parentFolderId === "null"
      ? null
      : Number(req.params.parentFolderId);
  const user = req.user;
  const userId = req.user.id;

  upload(req, res, async (err) => {
    const file = req.file;

    if (err instanceof multer.MulterError) {
      return res.status(500).json({ err });
    } else if (!req.file) {
      return res.status(400).json({ error: "Please upload a file" });
    }
    const fileSizes = filesize(req.file.size);
    const fileBase64 = decode(file.buffer.toString("base64"));
    const fileName = file.originalname;

    // file with same name will not store in same folder
    // store by supabaseBucketName/userName
    const parentFolderSupabase = `${user.username}-${user.id}`;

    // when parent folder null means in the root folder
    if (!parentFolderId) {
      const filePathSupabase = `${parentFolderSupabase}/${fileName}`;
      const { data, error } = await supabase.storage
        .from("file-uploads")
        .upload(filePathSupabase, fileBase64);
      if (error) {
        return res.status(400).json({ error: error.message });
      } else {
        const fileDestination = data?.path;
        const file = await dbQuery.createFile(
          fileName,
          fileSizes,
          fileDestination,
          parentFolderId,
          userId,
        );

        return res.status(200).json({ message: "File upload successfully" });
      }
    } else {
      // when parent folder has id means it has parent folder
      const currentFolder = await dbQuery.findFolderById(
        userId,
        parentFolderId,
      );

      const parentFolderPath = currentFolder.path;
      const filePathSupabase = `${parentFolderPath}/${fileName}`;
      const { data, error } = await supabase.storage
        .from("file-uploads")
        .upload(filePathSupabase, fileBase64);
      if (error) {
        return res.status(400).json({ error: error.message });
      } else {
        const fileDestination = data?.path;

        const file = await dbQuery.createFile(
          fileName,
          fileSizes,
          fileDestination,
          parentFolderId,
          userId,
        );
        return res.status(200).json({ message: "File upload successfully" });
      }
    }
  });
};

module.exports = {
  libraryRootPageGet,
  librarySubfolderPageGet,
  libraryAddFolderPost,
  libraryDeleteFolderDelete,
  libraryEditFolderPatch,
  libraryDeleteFileDelete,
  libraryEditFilePatch,
  libraryDownloadFileGet,
  libraryFileDetailsGet,
  libraryAddFilePost,
};
