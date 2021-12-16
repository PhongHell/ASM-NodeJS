const express = require("express");
const bodyParser = require("body-parser");
const multer = require("multer");

const mongoose = require("mongoose");

const session = require("express-session");
const mongoDbSession = require("connect-mongodb-session")(session);

const csrf = require('csurf');

const flash = require('connect-flash');

const path = require("path");

// staff model
const Staff = require("./models/staff");

// Controllers
const errorsController = require("./controllers/errors");

// Create app
const app = express();

app.set("view engine", "ejs");

const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'images');
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/jpeg" ||
    file.mimetype === "image/jfif"
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

app.use(bodyParser.urlencoded({ extended: false }));
app.use(
  multer({ storage: fileStorage, fileFilter: fileFilter }).single("image")
);

app.use(express.static(path.join(__dirname, "public")));
app.use('/images', express.static(path.join(__dirname, "images")));

const MONGO_URI =
  "mongodb+srv://ThanhPhong:23lOQy6qMnphokd2@cluster0.n29hy.mongodb.net/ASM2";
const store = new mongoDbSession({
  uri: MONGO_URI,
  collection: "sessions",
});

app.use(
  session({
    secret: "whatever",
    resave: false,
    saveUninitialized: false,
    store: store,
  })
);

app.use(csrf());

// add isLoggedIn && csrfToken to render
app.use((req, res, next) => {
  res.locals.isAuthenticated = req.session.isLoggedIn;
  res.locals.csrfToken = req.csrfToken();
  next()
})

app.use(flash()); 

// Routes
const adminRoutes = require("./routes/admin");
const authRoutes = require("./routes/auth");

// Store staff in request
app.use((req, res, next) => {
  if (!req.session.staff) {
    return next();
  };
  
  Staff.findById(req.session.staff._id)
    .then((staff) => {
      if (!staff) {
        next();
      }

      req.staff = staff;
      const  manager = req.staff.manager;
      next();
    })
    .catch((err) => {
      console.log(err);
    });
});

app.use(adminRoutes);
app.use(authRoutes);

app.get("/500", errorsController.get500);
app.use("/", errorsController.get404);

app.use((error, req, res, next) => {
  res.render("500", {
    docTitle: "Error occurred",
    path: null,
    isAuthenticated: req.isLoggedIn,
    isManager: false,
  });
});

mongoose
  .connect(
    MONGO_URI
  )
  .then((results) => {
    // console.log(results);
    app.listen(process.env.PORT || 3000);
  })
  .catch((err) => {
    console.log(err);
  });
