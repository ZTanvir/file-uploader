const prisma = require("../config/prismaClient");
const { supabase } = require("../config/supabase");
const { decode } = require("base64-arraybuffer");

const libraryRootPageGet = async (req, res, next) => {
  // get folder and file with parentFolder column null(Root folder)
  const userId = req.user?.id;
  const folderList = await prisma.folder.findMany({
    where: {
      userId,
      parentFolderId: null,
    },
  });

  if (!userId) {
    // when unregister user try to visit /library
    return res.redirect("/log-in");
  }

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
};

const librarySubfolderPageGet = async (req, res, next) => {
  const userId = req.user?.id;
  const parentFolderId = Number(req.params.parentFolder);
  if (!userId) {
    // when unregister user try to visit /library
    return res.redirect("/log-in");
  }
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
};

const libraryAddFolderPost = async (req, res) => {
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
};

const libraryDeleteFolderDelete = async (req, res) => {
  const folderId = Number(req.params.parentFolderId);
  const userId = Number(req.user.id);
  //Todo: delete folder from supabase
  const folderPath = `${req.user.username}-${userId}/${folderId}`;
  if (folderId) {
    // folder has parent folder
    const { data, error } = await supabase.storage
      .from("file-uploads")
      .list(folderPath);
    const uploadedFileData = data;

    if (error) {
      console.error("Error when getting files in folder supabase", error);
    } else if (uploadedFileData.length === 0) {
      // not files in the supabase folder
      // clear db record
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
    } else {
      const addPathToFiles = uploadedFileData.map(
        (file) => `${folderPath}/${file.name}`
      );
      const { data, error } = await supabase.storage
        .from("file-uploads")
        .remove(addPathToFiles);
      if (error) {
        console.error("Error when deleting files in folder supabase", error);
      } else {
        // clear db record
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
      }
    }
  }
};
const libraryEditFolderPatch = async (req, res) => {
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
};

module.exports = {
  libraryRootPageGet,
  librarySubfolderPageGet,
  libraryAddFolderPost,
  libraryDeleteFolderDelete,
  libraryEditFolderPatch,
};
