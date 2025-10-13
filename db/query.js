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

module.exports = {
  findUserByUserName,
  findUserByUserId,
  createNewUser,
  findFoldersByParentId,
  findFilesByParentId,
  findFolderById,
};
