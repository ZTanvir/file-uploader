const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require("bcryptjs");
const dbQuery = require("../db/query");
const demoUser = { id: 1000, username: "demo", password: "demo123" };

passport.use(
  new LocalStrategy(async (username, password, done) => {
    if (username === demoUser.username && password === demoUser.password) {
      return done(null, demoUser);
    }
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
  if (id === demoUser.id) {
    done(null, demoUser);
  } else {
    try {
      const user = await dbQuery.findUserByUserId(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  }
});

module.exports = passport;
