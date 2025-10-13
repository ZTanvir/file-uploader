const prisma = require("../config/prismaClient");

const findUserByUserName = async (userName) => {
  try {
    const user = await prisma.user.findFirst({
      where: {
        username: userName,
      },
    });
    console.log("Username in db", user);
    return user;
  } catch (error) {
    console.error("Error when getting user by username:", error);
  }
};

module.exports = {
  findUserByUserName,
};
