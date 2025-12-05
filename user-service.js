import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

const { MONGO_URL } = process.env;

// Connect once — reuse connection
if (!global.mongooseConn) {
  global.mongooseConn = mongoose.connect(MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
}

const Schema = mongoose.Schema;

// USER SCHEMA
const userSchema = new Schema({
  userName: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  email: { type: String }
  // favourites stored as array of work/book IDs
  ,
  favourites: [String]
});

let User = mongoose.models.User || mongoose.model("User", userSchema);

// REGISTER USER
async function registerUser(user) {
  if (!user.userName || !user.password) {
    throw new Error("userName and password are required.");
  }

  await global.mongooseConn;

  // Check for existing user
  const existing = await User.findOne({ userName: user.userName });
  if (existing) throw new Error("Username already taken.");

  // Hash password
  const hashedPassword = await bcrypt.hash(user.password, 10);

  const newUser = new User({
    userName: user.userName,
    password: hashedPassword,
    email: user.email || null,
    favourites: []
  });

  await newUser.save();

  // Return only safe data
  return {
    userName: newUser.userName,
    email: newUser.email
  };
}

// LOGIN USER
async function checkUser(user) {
  if (!user.userName || !user.password) {
    throw new Error("userName and password are required.");
  }

  await global.mongooseConn;

  const existingUser = await User.findOne({ userName: user.userName });
  if (!existingUser) throw new Error("Invalid username or password.");

  const match = await bcrypt.compare(user.password, existingUser.password);
  if (!match) throw new Error("Invalid username or password.");

  return {
    userName: existingUser.userName,
    email: existingUser.email
  };
}

// GET FAVOURITES
async function getFavourites(userName) {
  await global.mongooseConn;

  const user = await User.findOne({ userName });
  if (!user) throw new Error("User not found");

  return user.favourites;
}

// ADD FAVOURITE
async function addFavourite(userName, itemId) {
  await global.mongooseConn;

  const user = await User.findOne({ userName });
  if (!user) throw new Error("User not found");

  if (!user.favourites.includes(itemId)) {
    user.favourites.push(itemId);
    await user.save();
  }

  return user.favourites;
}

// REMOVE FAVOURITE
async function removeFavourite(userName, itemId) {
  await global.mongooseConn;

  const user = await User.findOne({ userName });
  if (!user) throw new Error("User not found");

  user.favourites = user.favourites.filter(id => id !== itemId);
  await user.save();

  return user.favourites;
}

export default {
  registerUser,
  checkUser,
  getFavourites,
  addFavourite,
  removeFavourite,
};
