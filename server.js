const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const port = 5000;
const path = require("path");
const bcrypt = require("bcrypt");
const multer = require("multer");
const sqlite3 = require("sqlite3").verbose();
// const db = new sqlite3.Database("./staylib.db");
const db = new sqlite3.Database(path.join(__dirname, "staylib.db"));

// middleware for storing images
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix);
  },
});
const upload = multer({ storage: storage });

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");

// Static files configuration
app.use(express.static(path.join(__dirname, "views")));
app.use("/js", express.static(path.join(__dirname, "public/js")));
app.use(
  "/css",
  express.static(path.join(__dirname, "node_modules/bootstrap/dist/css"))
);
app.use(
  "/js",
  express.static(path.join(__dirname, "node_modules/bootstrap/dist/js"))
);
app.use(
  express.static(
    path.join(__dirname, "node_modules/@fortawesome/fontawesome-free")
  )
);
app.set("views", path.join(__dirname, "views"));
app.use("/css", express.static(path.join(__dirname, "public/css")));
app.use("/images", express.static(path.join(__dirname, "public/images")));

// Routes
app.get("/adminDashboard", (req, res) => {
  res.render("adminDashboard");
});

app.get("/userDashboard", (req, res) => {
  res.render("userDashboard");
});

app.get("/bookingInfo", (req, res) => {
  res.render("bookingInfo");
});

app.get("/payment", (req, res) => {
  res.render("payment");
});

// Adding Accomodation Route
app.get("/accomodationlist", (req, res) => {
  res.render("accomodationlist");
});
// Fecting Accomodation Route
app.get("/fectingdashboard", (req, res) => {
  res.render("fectingdashboard");
});
//Database Tables
db.serialize(() => {
  db.run(
    "CREATE TABLE IF NOT EXISTS accommodations (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, location TEXT, price REAL, description TEXT, images TEXT)"
  );
});

// Adding Accommodation Route
app.post("/add-accommodation", upload.array("images"), (req, res) => {
  const { name, location, price, description } = req.body;
  const images = req.files.map((file) => file.path).join(",");

  db.run(
    `INSERT INTO accommodations (name, location, price, description, images) VALUES (?, ?, ?, ?, ?)`,
    [name, location, price, description, images],
    function (err) {
      if (err) {
        console.error("Accommodation Insert Error: ", err.message);
        return res
          .status(500)
          .json({ success: false, message: "Server Error" });
      }
      res.json({ success: true, message: "Accommodation added successfully!" });
    }
  );
});

// Fetching Accommodations Route
app.get("/accommodations", (req, res) => {
  db.all("SELECT * FROM accommodations", [], (err, rows) => {
    if (err) {
      console.error("Fetch Accommodations Error: ", err.message);
      return res.status(500).send("Server Error");
    }
    res.json(rows);

    console.log(rows);
  });
});

// Create users table if not exists
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
    )`
  );
});

// Home page
app.get("/", (req, res) => {
  res.render("index", { title: "Home || Page" });
});

app.get("/home", (req, res) => {
  res.render("index", { title: "Home || Page" });
});

// About page
app.get("/about", (req, res) => {
  res.render("about", { title: "About || Page" });
});

// Explore page
app.get("/explore", (req, res) => {
  res.render("index", { title: "Explore || Page" });
});

// Sign-up routes
app.get("/signup", (req, res) => {
  res.render("signup", { title: "SignUp || Page" });
});

app.post("/signup", upload.single("photo"), async (req, res) => {
  const hashedPassword = await bcrypt.hash(req.body.password, 10);

  let userInfo = {
    fullname: req.body.fullname,
    email: req.body.email,
    phonenumber: req.body.phonenumber,
    username: req.body.username,
    role: req.body.role,
    photo: req.file ? req.file.path : null,
    password: hashedPassword,
  };

  db.run(
    `INSERT INTO user (full_name,email,user_name,phone_number,role,password,profile_picture) VALUES (?,?,?,?,?,?,?)`,
    [
      userInfo.fullname,
      userInfo.email,
      userInfo.username,
      userInfo.phonenumber,
      userInfo.role,
      userInfo.password,
      userInfo.photo,
    ],
    function (err) {
      if (err) {
        console.log("User Table Insert Error: ", err.message);
        return res.status(500).send("Server Error");
      }
      console.log("User Data:", userInfo);
      res.redirect("/login");
    }
  );
});

// Confirmation page
app.get("/confirmation", (req, res) => {
  res.render("view_dashboard", { title: "View User Dashboard" });
});

// Forget password page
app.get("/forget_password", (req, res) => {
  res.render("forget_password", { title: "Forget Password || Page" });
});

// Dashboard
app.get("/dashboard", (req, res) => {
  res.render("dashboard", { title: "User Dashboard || Page" });
});

// Login page
app.get("/login", (req, res) => {
  res.render("login", { title: "Login || Page" });
});

//Login post route
app.post("/login", (req, res) => {
  const { email, password } = req.body;

  db.get("SELECT * FROM user WHERE email = ?", [email], (err, row) => {
    if (err) {
      console.error(err.message);
      res.send("Error checking email");
    } else if (!row) {
      res.render("login-error-message");
    } else {
      const match = bcrypt.compareSync(password, row.Password);
      if (match) {
        res.render("home");
      } else {
        res.render("Wrong_password");
      }
    }
  });
});

// Start server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
