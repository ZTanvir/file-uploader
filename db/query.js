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
module.exports = {
  findUserByUserName,
  findUserByUserId,
  createNewUser,
};
