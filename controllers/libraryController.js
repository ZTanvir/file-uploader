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
  const folderList = await dbQuery.findFoldersByParentId(
    userId,
    (parentFolderId = null)
  );

  if (!userId) {
    // when unregister user try to visit /library
    return res.redirect("/log-in");
  }

  const fileList = await dbQuery.findFilesByParentId(
    userId,
    (parentFolderId = null)
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

  const folderList = await dbQuery.findFoldersByParentId(
    userId,
    parentFolderId
  );

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
  const userId = req.user.id;
  const folderName = req.body.folderName;

  async function createFolder(parentFolderId, userId, folderName) {
    const folder = await dbQuery.createFolder(
      folderName,
      userId,
      parentFolderId
    );
    return folder;
  }

  if (!parentFolderId) {
    // parent folder null means root folder
    const folder = await dbQuery.createFolder(
      folderName,
      userId,
      parentFolderId
    );
    if (folder?.id) {
      return res.status(200).end();
    }
  } else {
    // child folder
    const folder = await dbQuery.createFolder(
      folderName,
      userId,
      parentFolderId
    );

    if (folder?.id) {
      return res.status(200).end();
    }
  }
};

const libraryDeleteFolderDelete = async (req, res) => {
  const folderId = Number(req.params.parentFolderId);
  const userId = Number(req.user.id);
  //Todo: delete folder from supabase
  // const folderPath = `${req.user.username}-${userId}/${folderId}`;
  const folderPath = `${req.user.username}-${userId}/`;

  if (folderId) {
    // folder has parent folder
    const { data, error } = await supabase.storage
      .from("file-uploads")
      .list(folderPath, {
        limit: 1000,
        search: "",
      });
    const uploadedFileData = data;
    console.log("file and folder list", data);

    // if (error) {
    //   console.error("Error when getting files in folder supabase", error);
    // } else if (uploadedFileData.length === 0) {
    //   // not files in the supabase folder
    //   // clear db record
    //   try {
    //     const deleteFolder = await dbQuery.deleteFolder(folderId, userId);
    //     if (Object.keys(deleteFolder).length > 0) {
    //       return res.status(200).end();
    //     }
    //   } catch (error) {
    //     console.error("Error on deleting folder", error);
    //   }
    // } else {
    //   const addPathToFiles = uploadedFileData.map(
    //     (file) => `${folderPath}/${file.name}`
    //   );
    //   const { data, error } = await supabase.storage
    //     .from("file-uploads")
    //     .remove(addPathToFiles);
    //   if (error) {
    //     console.error("Error when deleting files in folder supabase", error);
    //   } else {
    //     // clear db record
    //     try {
    //       const deleteFolder = await dbQuery.deleteFolder(folderId, userId);
    //       if (Object.keys(deleteFolder).length > 0) {
    //         return res.status(200).end();
    //       }
    //     } catch (error) {
    //       console.error("Error on deleting folder", error);
    //     }
    //   }
    // }
  }
};
const libraryEditFolderPatch = async (req, res) => {
  const folderId = Number(req.params.parentFolderId);
  const userId = Number(req.user.id);
  const newFolderName = String(req.body.newFolderName);

  const updateFolder = await dbQuery.editFolder(
    userId,
    folderId,
    newFolderName
  );

  if (Object.keys(updateFolder).length > 0) {
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
  const userName = user.username;
  const userId = Number(user.id);
  const newFileName = String(req.body.newFileName);
  // get file path from db
  const fileData = await dbQuery.findFileById(fileId, userId);

  // rename the path in supabase
  if (fileData?.id) {
    const newFilePath = `${userName}-${userId}/${fileData.parentFolderId}/${newFileName}`;
    const { data, error } = await supabase.storage
      .from("file-uploads")
      .move(`${fileData.path}`, `${newFilePath}`);
    if (error) {
      console.error("Error when rename file ", error);
    } else {
      // update the path in db
      const updateFile = await dbQuery.updateFileByNameAndPath(
        fileId,
        userId,
        newFileName,
        newFilePath
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
      error
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
          userId
        );

        return res.status(200).json({ message: "File upload successfully" });
      }
    } else {
      // when parent folder has id means it has parent folder
      // find all parent folders
      const allParents = await dbQuery.getParentFolders(parentFolderId, userId);
      let parentFolderPath = null;

      if (allParents.length === 0) {
        const currentFolder = await dbQuery.findFolderById(
          userId,
          parentFolderId
        );
        parentFolderPath = currentFolder?.name;
      } else {
        // current folder name also needed to create full file path
        const currentFolder = await dbQuery.findFolderById(
          userId,
          parentFolderId
        );
        const allFolders = [currentFolder, ...allParents];

        parentFolderPath = allFolders
          .map((folder) => folder.name)
          .reverse()
          .join("/");

        const filePathSupabase = `${parentFolderSupabase}/${parentFolderPath}/${fileName}`;
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
            userId
          );
          return res.status(200).json({ message: "File upload successfully" });
        }
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
