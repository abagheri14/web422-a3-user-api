const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

let User; // Mongoose Model
let connectPromise = null;

function connect() {
  if (User) return Promise.resolve();

  if (!connectPromise) {
    connectPromise = mongoose
      .connect(process.env.MONGO_URL, {
        useNewUrlParser: true,
        useUnifiedTopology: true
      })
      .then(() => {
        const Schema = mongoose.Schema;

        const userSchema = new Schema({
          userName: { type: String, unique: true },
          email: String,
          password: String,
          favourites: [String]
        });

        // Prevent overwrite crash on Vercel
        User = mongoose.models.User || mongoose.model("User", userSchema);
      });
  }

  return connectPromise;
}

// REGISTER
function registerUser(userData) {
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
          reject("There was an error creating the user: " + err);
        }
      });
  });
}

// LOGIN
function checkUser(loginData) {
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
          bcrypt.compare(loginData.password, user.password).then((result) => {
            if (result) resolve(user);
            else reject("Incorrect password.");
          });
        }
      })
      .catch((err) =>
        reject("There was an error verifying the user: " + err)
      );
  });
}

// USER LOOKUP
function getUserById(id) {
  return User.findById(id).exec();
}

// FAVOURITES
function getFavourites(userId) {
  return User.findById(userId)
    .exec()
    .then((user) => (user ? user.favourites || [] : Promise.reject("User not found.")));
}

function addFavourite(userId, bookId) {
  return User.findById(userId)
    .exec()
    .then((user) => {
      if (!user) throw "User not found.";
      if (!user.favourites.includes(bookId)) user.favourites.push(bookId);
      return user.save();
    })
    .then((user) => user.favourites);
}

function removeFavourite(userId, bookId) {
  return User.findById(userId)
    .exec()
    .then((user) => {
      if (!user) throw "User not found.";
      user.favourites = (user.favourites || []).filter((f) => f !== bookId);
      return user.save();
    })
    .then((user) => user.favourites);
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
