const express = require("express");
const app = express();
const bodyparser = require("body-parser");
const port = 5000;
const path = require("path");
const bcrypt = require("bcrypt");
const multer = require("multer");
const { title } = require("process");
const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("./staylib.db");

// middleware for storing images
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "/tmp/my-uploads");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix);
  },
});
const upload = multer({ storage: storage });

// Middleware
app.use(bodyparser.urlencoded({ extended: true }));
app.set("view engine", "ejs");

// set views directory

app.set("view engine", "ejs");

app.use(express.static(path.join(__dirname, "views")));

// static files
// external js files

app.use("/js", express.static(path.join(__dirname, "public/js")));

// bootstrap

app.use(
  "/css",
  express.static(path.join(__dirname, "node_modules/bootstrap/dist/css"))
);

app.use(
  "/js",
  express.static(path.join(__dirname, "node_modules/bootstrap/dist/js"))
);
// fontawesome 4

app.use(
  express.static(
    path.join(__dirname, "node_modules/@fortawesome/fontawesome-free")
  )
);

// Static Files
app.set("views", path.join(__dirname, "views"));
app.use("/css", express.static(path.join(__dirname, "public/css")));
app.use("/images", express.static(path.join(__dirname, "public/images")));

// Routes
// AdminDashboard Route
app.get("/adminDashboard", (req, res) => {
  res.render("adminDashboard");
});

//UserDashboard Route
app.get("/userDashboard", (req, res) => {
  res.render("userDashboard");
});

// Booking Info
app.get("/bookingInfo", (req, res) => {
  res.render("bookingInfo");
});

// Payment Route
app.get("/payment", (req, res) => {
  res.render("payment");
});

db.serialize(() => {
  db.run(
    `CREATE TABLE IF NOT EXISTS user (
    id INTEGER PRIMARY KEY AUTOINCREMENT, 
    full_name VARCHAR(250),
    email VARCHAR(250),
    user_name VARCHAR(250),
    phone_number VARCHAR(250),
    role VARCHAR(250),
    password VARCHAR(250),
    profile_picture BLOB,
    date_joined TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
    `
  );
});

db.close();

// home page
app.get("/", (req, res) => {
  res.render("index", {
    title: "Home||Page",
  });
});
app.get("/home", (req, res) => {
  res.render("index", {
    title: "Home||Page",
  });
});

// about page
app.get("/about", (req, res) => {
  res.render("about", {
    title: "About||Page",
  });
});

// explore
app.get("/explore", (req, res) => {
  res.render("index", {
    title: "Explore||Page",
  });
});

// signup
app.get("/signup", (req, res) => {
  res.render("signup", {
    title: "SignUp||Page",
  });
});

app.post("/signup", (req, res) => {
  res.render("signup", {
    title: "SignUP||Page",
  });
  console.log("Signed Up");
});

// verification

app.get("/confrimation", (req, res) => {
  res.render("view_dashboard", { title: "view user_DashBoard" });
});

// forget password

app.get("/forget_password", (req, res) => {
  res.render("forget_password", { title: "forget password || Page" });
});

// dashboard

app.get("/dashboard", (req, res) => {
  res.render("dashboard", { title: "user-DashBoard || Page" });
});

// login

app.get("/login", (req, res) => {
  res.render("login", {
    title: "Login||Page",
  });
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
