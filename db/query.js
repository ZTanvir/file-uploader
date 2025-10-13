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

const findFoldersByParentId = async (userId, parentFolderId) => {
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

const findFilesByParentId = async (userId, parentFolderId) => {
  try {
    const folderList = await prisma.file.findMany({
      where: {
        userId,
        parentFolderId,
      },
    });
    return folderList;
  } catch (error) {
    console.error(`Error when getting files of user ${userId}:`, error);
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

const createFolder = async (folderName, userId, parentFolderId) => {
  try {
    const folder = await prisma.folder.create({
      data: {
        name: folderName,
        userId,
        parentFolderId,
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

const editFolder = async (userId, folderId, newFolderName) => {
  try {
    const editFolder = await prisma.folder.update({
      where: {
        userId,
        id: folderId,
      },
      data: {
        name: newFolderName,
      },
    });
    return editFolder;
  } catch (error) {
    console.error(`Error when editing folders name:`, error);
  }
};

module.exports = {
  findUserByUserName,
  findUserByUserId,
  createNewUser,
  findFoldersByParentId,
  findFilesByParentId,
  findFolderById,
  createFolder,
  deleteFolder,
  editFolder,
};
