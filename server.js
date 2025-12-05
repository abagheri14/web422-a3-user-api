const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const passport = require("passport");
const jwt = require("jsonwebtoken");
const userService = require("./user-service.js");

dotenv.config();

const app = express();
const HTTP_PORT = process.env.PORT || 8080;

// --- CORS Configuration (Allows Vercel domains) ---
const allowedOrigins = [
  "http://localhost:3000",
  "https://web422-a2-books-app.vercel.app", 
];

const corsOptions = {
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } 
        else if (origin.includes('web422-a2-books') && origin.endsWith('.vercel.app')) {
            callback(null, true);
        }
        else {
            console.error('CORS blocked origin:', origin);
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
};

app.use(express.json());
app.use(cors(corsOptions)); 
app.use(passport.initialize());

// Initialize passport JWT strategy
require("./auth/passport.js")(passport);

// POST /api/user/register
app.post("/api/user/register", (req, res) => {
  userService
    .registerUser(req.body)
    .then((msg) => {
      res.json({ message: msg }); 
    })
    .catch((msg) => {
      res.status(422).json({ message: msg });
    });
});

// POST /api/user/login
app.post("/api/user/login", (req, res) => {
  userService
    .checkUser(req.body)
    .then((user) => {
      const payload = {
        _id: user._id,
        userName: user.userName
      };

      const token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: "2h"
      });

      res.json({ message: "login successful", token });
    })
    .catch((msg) => {
      res.status(422).json({ message: msg });
    });
});

// PROTECTED routes: favourites
// GET /api/user/favourites
app.get(
  "/api/user/favourites",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    userService
      .getFavourites(req.user._id)
      .then((data) => {
        res.json(data);
      })
      .catch((msg) => {
        res.status(422).json({ message: msg });
      });
  }
);

// PUT /api/user/favourites/:id (add favourite)
app.put(
  "/api/user/favourites/:id",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    userService
      .addFavourite(req.user._id, req.params.id)
      .then((data) => {
        res.json(data);
      })
      .catch((msg) => {
        res.status(422).json({ message: msg });
      });
  }
);

// DELETE /api/user/favourites/:id
app.delete(
  "/api/user/favourites/:id",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    userService
      .removeFavourite(req.user._id, req.params.id)
      .then((data) => {
        res.json(data);
      })
      .catch((msg) => {
        res.status(422).json({ message: msg });
      });
  }
);

// --- Startup for local DEV + export for Vercel --- //

userService
  .connect()
  .then(() => {
    if (require.main === module) {
      app.listen(HTTP_PORT, () => {
        console.log("API listening on: " + HTTP_PORT);
      });
    }
  })
  .catch((err) => {
    console.log("unable to start the server: " + err);
    process.exit();
  });

module.exports = app;
