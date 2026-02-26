require("dotenv").config();
require("express-async-errors");

const express = require("express");
const session = require("express-session");
const MongoDBStore = require("connect-mongodb-session")(session);

const cookieParser = require("cookie-parser");
const csrf = require("host-csrf");

const passport = require("passport");
const passportInit = require("./passport/passportInit");

const connectDB = require("./db/connect");

const app = express();

app.set("view engine", "ejs");

// ===== Body parser (MUST be before CSRF) =====
app.use(express.urlencoded({ extended: true }));

// ===== Cookie parser (MUST be before CSRF) =====
app.use(cookieParser(process.env.SESSION_SECRET));

// ===== CSRF middleware (MUST be before routes) =====
app.use(csrf.csrf());

// ✅ IMPORTANT: Create token + cookie and expose to EJS as _csrf (MUST be before routes)
app.use((req, res, next) => {
  csrf.getToken(req, res); // sets cookie if missing + sets res.locals._csrf
  next();
});

// ===== Sessions (Mongo store) =====
const store = new MongoDBStore({
  uri: process.env.MONGO_URI,
  collection: "mySessions",
});

store.on("error", (error) => console.log("MongoDBStore error:", error));

const sessionParms = {
  secret: process.env.SESSION_SECRET,
  resave: true,
  saveUninitialized: true,
  store,
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

// ===== Flash + locals =====
app.use(require("connect-flash")());
app.use(require("./middleware/storeLocals"));

// ===== Routes =====
app.get("/", (req, res) => res.render("index"));

app.use("/sessions", require("./routes/sessionRoutes"));

const auth = require("./middleware/auth");
app.use("/secretWord", auth, require("./routes/secretWord"));

// ===== Errors =====
app.use((err, req, res, next) => {
  // If the attacker app hits you, you will land here. That is expected.
  if (err && err.name === "CSRFError") {
    return res.status(403).send("CSRF validation failed.");
  }
  console.log(err);
  res.status(500).send(err.message);
});

const port = process.env.PORT || 3000;

const start = async () => {
  try {
    await connectDB(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");
    app.listen(port, () => console.log(`Server is listening on port ${port}...`));
  } catch (error) {
    console.log("❌ Startup error:", error.message);
    process.exit(1);
  }
};

start();