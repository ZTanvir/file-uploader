const prisma = require("../config/prismaClient");

const findUserByUserName = async (userName) => {
  try {
    const user = await prisma.user.findFirst({
      where: {
        username: userName,
      },
    });
    return user;
  } catch (error) {
    console.error("Error when getting user by username:", error);
  }
};

const findUserByUserId = async (userId) => {
  try {
    const user = await prisma.user.findFirst({
      where: {
        id: userId,
      },
    });
    return user;
  } catch (error) {
    console.error("Error when getting user by user id:", error);
  }
};

const createNewUser = async (username, password) => {
  try {
    const newUser = await prisma.user.create({
      data: {
        username,
        password: password,
      },
    });
    return newUser;
  } catch (error) {
    console.error(
      "Error when creating new user by username and password:",
      error
    );
  }
};

const getParentFolders = async (parentFolderId, userId) => {
  const folder = await prisma.folder.findUnique({
    where: { id: parentFolderId, userId },
    include: { parentFolder: true },
  });
  console.log("In db query, folder info:", folder);

  if (!folder || !folder.parentFolder) {
    return [];
  }

  const parents = await getParentFolders(folder.parentFolder.id);

  return [folder.parentFolder, ...parents];
};
const getParentFolder = async (parentFolderId, userId) => {
  try {
    const folder = await prisma.folder.findUnique({
      where: { id: parentFolderId, userId },
      include: { parentFolder: true },
    });
    return folder;
  } catch (error) {
    console.error("Error on getting parent folder data:", error);
  }
};

const getAllChildFolders = async (folderId, userId) => {
  const children = await prisma.folder.findMany({
    where: { parentFolderId: folderId, userId },
    include: { childFolder: true },
  });

  let all = [...children];
  for (const child of children) {
    const descendants = await getAllChildFolders(child.id, userId);
    all = [...all, ...descendants];
  }

  return all;
};

const getFoldersByParentId = async (userId, parentFolderId) => {
  try {
    const folderList = await prisma.folder.findMany({
      where: {
        userId,
        parentFolderId,
      },
    });
    return folderList;
  } catch (error) {
    console.error(`Error when getting folders of user ${userId}:`, error);
  }
};

const findFolderById = async (userId, folderId) => {
  try {
    const folderList = await prisma.folder.findFirst({
      where: {
        userId,
        id: folderId,
      },
    });
    return folderList;
  } catch (error) {
    console.error(`Error when getting folders of user ${userId}:`, error);
  }
};

const createFolder = async (folderName, userId, parentFolderId, path) => {
  try {
    const folder = await prisma.folder.create({
      data: {
        name: folderName,
        userId,
        parentFolderId,
        path,
      },
    });
    return folder;
  } catch (error) {
    console.error(`Error when creating new folders:`, error);
  }
};

const deleteFolder = async (folderId, userId) => {
  try {
    const deleteFolder = await prisma.folder.delete({
      where: {
        id: folderId,
        userId,
      },
    });
    return deleteFolder;
  } catch (error) {
    console.error(`Error when deleting folders:`, error);
  }
};

const editFolder = async (userId, folderId, newFolderName, updatedPath) => {
  try {
    const editFolder = await prisma.folder.update({
      where: {
        userId,
        id: folderId,
      },
      data: {
        name: newFolderName,
        path: updatedPath,
      },
    });
    return editFolder;
  } catch (error) {
    console.error(`Error when editing folders name:`, error);
  }
};

const findFilesByParentId = async (userId, parentFolderId) => {
  try {
    const files = await prisma.file.findMany({
      where: {
        userId,
        parentFolderId,
      },
    });
    return files;
  } catch (error) {
    console.error(`Error when getting files of user ${userId}:`, error);
  }
};

const getFileByParentId = async (userId, parentFolderId) => {
  try {
    const file = await prisma.file.findFirst({
      where: {
        userId,
        parentFolderId,
      },
    });
    return file;
  } catch (error) {
    console.error(`Error when getting files of user ${userId}:`, error);
  }
};

const getFilePathById = async (fileId, userId) => {
  try {
    const { path } = await prisma.file.findFirst({
      where: {
        id: fileId,
        userId,
      },
      select: {
        path: true,
      },
    });
    return path;
  } catch (error) {
    console.error(`Error when getting file path:`, error);
  }
};

const deleteFile = async (fileId, userId) => {
  try {
    const deleteFile = await prisma.file.delete({
      where: {
        id: fileId,
        userId,
      },
    });
    return deleteFile;
  } catch (error) {
    console.error(`Error when deleting file :`, error);
  }
};

const findFileById = async (fileId, userId) => {
  try {
    const file = prisma.file.findFirst({
      where: {
        userId,
        id: fileId,
      },
    });
    return file;
  } catch (error) {
    console.error(`Error when finding file :`, error);
  }
};

const updateFileByNameAndPath = async (
  fileId,
  userId,
  newFileName,
  newFilePath
) => {
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
    return updateFile;
  } catch (error) {
    console.error(`Error when updating file name and path:`, error);
  }
};

const createFile = async (
  fileName,
  fileSizes,
  fileDestination,
  parentFolderId,
  userId
) => {
  try {
    const file = await prisma.file.create({
      data: {
        name: fileName,
        size: fileSizes,
        path: fileDestination,
        parentFolderId: parentFolderId,
        userId: userId,
      },
    });
    return file;
  } catch (error) {
    console.error(`Error when creating new file :`, error);
  }
};

module.exports = {
  findUserByUserName,
  findUserByUserId,
  createNewUser,
  getFoldersByParentId,
  getParentFolder,
  findFilesByParentId,
  findFolderById,
  getAllChildFolders,
  createFolder,
  deleteFolder,
  editFolder,
  getFilePathById,
  deleteFile,
  findFileById,
  getFileByParentId,
  updateFileByNameAndPath,
  createFile,
  getParentFolders,
};
