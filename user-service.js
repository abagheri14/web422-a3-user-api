const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

let User; // Mongoose model

function connect() {
  if (User) {
    return Promise.resolve();
  }

  return mongoose
    .connect(process.env.MONGO_URL)
    .then(() => {
      const Schema = mongoose.Schema;

      const userSchema = new Schema({
        userName: { type: String, unique: true },
        email: String,
        password: String,
        favourites: [String]
      });

      User = mongoose.models.User || mongoose.model("User", userSchema);
    });
}

// Register a new user
function registerUser(userData) {
  // 🛑 FIX: Ensure connect runs before using the User model
  return connect().then(() => {
    return new Promise((resolve, reject) => {
      if (!userData.userName || !userData.password || !userData.password2) {
        reject("userName, password, and password2 are all required.");
        return;
      }

      if (userData.password !== userData.password2) {
        reject("Passwords do not match.");
        return;
      }

      bcrypt
        .hash(userData.password, 10)
        .then((hash) => {
          const newUser = new User({
            userName: userData.userName,
            email: userData.email || "",
            password: hash,
            favourites: []
          });

          return newUser.save();
        })
        .then(() => resolve("User registered successfully."))
        .catch((err) => {
          if (err.code === 11000) {
            reject("User Name already taken.");
          } else {
            console.error("MongoDB Error during registration:", err);
            reject("There was an error creating the user: " + err);
          }
        });
    });
  });
}

// Check user login
function checkUser(loginData) {
  // 🛑 FIX: Ensure connect runs before using the User model
  return connect().then(() => {
    return new Promise((resolve, reject) => {
      if (!loginData.userName || !loginData.password) {
        reject("userName and password are required.");
        return;
      }

      User.findOne({ userName: loginData.userName })
        .exec()
        .then((user) => {
          if (!user) {
            reject("Unable to find user.");
          } else {
            bcrypt
              .compare(loginData.password, user.password)
              .then((result) => {
                if (result) {
                  // Return full user doc so server.js can build JWT payload
                  resolve(user);
                } else {
                  reject("Incorrect password.");
                }
              });
          }
        })
        .catch((err) => {
          reject("There was an error verifying the user: " + err);
        });
    });
  });
}

function getUserById(id) {
  // 🛑 FIX: Ensure connect runs before using the User model
  return connect().then(() => {
    return User.findById(id).exec();
  });
}

// Favourites operations use JWT-authenticated user
function getFavourites(userId) {
  // 🛑 FIX: Ensure connect runs before using the User model
  return connect().then(() => {
    return new Promise((resolve, reject) => {
      User.findById(userId)
        .exec()
        .then((user) => {
          if (!user) {
            reject("User not found.");
          } else {
            resolve(user.favourites || []);
          }
        })
        .catch((err) => {
          reject("Unable to get favourites: " + err);
        });
    });
  });
}

function addFavourite(userId, bookId) {
  // 🛑 FIX: Ensure connect runs before using the User model
  return connect().then(() => {
    return new Promise((resolve, reject) => {
      User.findById(userId)
        .exec()
        .then((user) => {
          if (!user) {
            reject("User not found.");
          } else {
            if (!user.favourites.includes(bookId)) {
              user.favourites.push(bookId);
            }
            return user.save();
          }
        })
        .then((user) => resolve(user.favourites))
        .catch((err) => reject("Unable to add favourite: " + err));
    });
  });
}

function removeFavourite(userId, bookId) {
  // 🛑 FIX: Ensure connect runs before using the User model
  return connect().then(() => {
    return new Promise((resolve, reject) => {
      User.findById(userId)
        .exec()
        .then((user) => {
          if (!user) {
            reject("User not found.");
          } else {
            user.favourites = (user.favourites || []).filter((f) => f !== bookId);
            return user.save();
          }
        })
        .then((user) => resolve(user.favourites))
        .catch((err) => reject("Unable to remove favourite: " + err));
    });
  });
}

module.exports = {
  connect,
  registerUser,
  checkUser,
  getUserById,
  getFavourites,
  addFavourite,
  removeFavourite
};
