import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import passport from "passport";
import userService from "./user-service.js";
import "./auth/passport.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(passport.initialize());

const PORT = process.env.PORT || 8080;

// Register Route
app.post("/api/user/register", async (req, res) => {
  try {
    const result = await userService.registerUser(req.body);
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Login Route
app.post("/api/user/login", async (req, res) => {
  try {
    const result = await userService.checkUser(req.body);
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Protected Route Example
app.get(
  "/api/user/favourites",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    try {
      const result = await userService.getFavourites(req.user.userName);
      res.status(200).json(result);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  }
);

app.post(
  "/api/user/favourites",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    try {
      const result = await userService.addFavourite(req.user.userName, req.body.id);
      res.status(200).json(result);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  }
);

app.delete(
  "/api/user/favourites/:id",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    try {
      const result = await userService.removeFavourite(req.user.userName, req.params.id);
      res.status(200).json(result);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  }
);

app.listen(PORT, () => console.log(`User API running on port ${PORT}`));
