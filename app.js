require("dotenv").config();
require("express-async-errors");

const express = require("express");
const session = require("express-session");
const MongoDBStore = require("connect-mongodb-session")(session);

const passport = require("passport");
const passportInit = require("./passport/passportInit");

const app = express();

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));

// ===== Mongo session store =====
const url = process.env.MONGO_URI;

const store = new MongoDBStore({
  uri: url,
  collection: "mySessions",
});

store.on("error", function (error) {
  console.log(error);
});

const sessionParms = {
  secret: process.env.SESSION_SECRET,
  resave: true,
  saveUninitialized: true,
  store: store,
  cookie: { secure: false, sameSite: "strict" },
};

if (app.get("env") === "production") {
  app.set("trust proxy", 1);
  sessionParms.cookie.secure = true;
}

app.use(session(sessionParms));

// ===== Passport =====
passportInit();
app.use(passport.initialize());
app.use(passport.session());

// ===== Flash + locals middleware =====
app.use(require("connect-flash")());
app.use(require("./middleware/storeLocals"));

// ===== Routes =====
app.get("/", (req, res) => {
  res.render("index");
});

app.use("/sessions", require("./routes/sessionRoutes"));

// ✅ FINAL ASSIGNMENT CHANGE: secretWord router + auth middleware
const secretWordRouter = require("./routes/secretWord");
const auth = require("./middleware/auth");
app.use("/secretWord", auth, secretWordRouter);

// ===== 404 + error handler =====
app.use((req, res) => {
  res.status(404).send(`That page (${req.url}) was not found.`);
});

app.use((err, req, res, next) => {
  console.log(err);
  res.status(500).send(err.message);
});

const port = process.env.PORT || 3000;

const start = async () => {
  try {
    await require("./db/connect")(process.env.MONGO_URI);

    app.listen(port, () =>
      console.log(`Server is listening on port ${port}...`)
    );
  } catch (error) {
    console.log(error);
  }
};

start();