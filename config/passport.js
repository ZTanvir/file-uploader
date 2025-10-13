const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require("bcryptjs");
const dbQuery = require("../db/query");

passport.use(
  new LocalStrategy(async (username, password, done) => {
    try {
      const user = await dbQuery.findUserByUserName(username);
      if (!user) {
        return done(null, false, { message: "Incorrect username" });
      }

      const match = await bcrypt.compare(password, user.password);
      if (!match) {
        return done(null, false, { message: "Incorrect password" });
      }
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  })
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await dbQuery.findUserByUserId(id);
    console.log("find by user id", user);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

module.exports = passport;
