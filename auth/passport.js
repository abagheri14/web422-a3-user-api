const JwtStrategy = require("passport-jwt").Strategy;
const ExtractJwt = require("passport-jwt").ExtractJwt;
const userService = require("../user-service.js");

const opts = {};
opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken(); 
opts.secretOrKey = process.env.JWT_SECRET;

module.exports = function (passport) {
  passport.use(
    new JwtStrategy(opts, (jwt_payload, done) => {
      // jwt_payload: { _id, userName, iat, exp }
      userService
        .getUserById(jwt_payload._id)
        .then((user) => {
          if (user) {
            return done(null, user);
          } else {
            return done(null, false);
          }
        })
        .catch((err) => {
          return done(err, false);
        });
    })
  );
};
