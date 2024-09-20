// Required Modules
const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const bcrypt = require("bcrypt");
const multer = require("multer");
const sqlite3 = require("sqlite3").verbose();
const session = require("express-session");

// Initialize App
const app = express();
const port = 5000;
const db = new sqlite3.Database(path.join(__dirname, "staylib.db"));

// Session Configuration
app.use(
  session({
    secret: "secret_key_stay_lib",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false },
  })
);

// Middleware Configuration
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Static Files Configuration
app.use(express.static(path.join(__dirname, "views")));
app.use("/css", express.static(path.join(__dirname, "public/css")));
app.use("/images", express.static(path.join(__dirname, "public/images")));
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

// Multer Configuration for File Uploads
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

function isAuthenticated(req, res, next) {
  if (req.session.userInfo) {
    return next(); // User is authenticated, proceed to the next middleware/route
  } else {
    // alert("Kindly login before proceding");
    res.redirect("/login"); // User is not authenticated, redirect to login page
  }
}

let userInfo = {};
let currentUser = {};

// Database Table Creation
db.serialize(() => {
  db.run(
    `CREATE TABLE IF NOT EXISTS accommodations (
      id INTEGER PRIMARY KEY AUTOINCREMENT, 
      name TEXT, 
      location TEXT, 
      price REAL, 
      description TEXT, 
      images TEXT
    )`
  );

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

  db.run(`
    CREATE TABLE IF NOT EXISTS roles(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    role_name VARCHAR(250),
    description VARCHAR(250)
  )`);
});

// Routes

// Home, About, Explore, and Dashboards
app.get("/", (req, res) => res.render("index", { title: "Home || Page" }));
app.get("/home", (req, res) => res.render("index", { title: "Home || Page" }));
app.get("/about", (req, res) =>
  res.render("index", { title: "About || Page" })
);
app.get("/explore", (req, res) =>
  res.render("index", { title: "Explore || Page" })
);
app.get("/adminDashboard", (req, res) => res.render("adminDashboard"));
app.get("/userDashboard", (req, res) => res.render("userDashboard"));
// app.get("/dashboard", (req, res) =>
//   res.render("dashboard", { title: "User Dashboard || Page" })
// );

// Signup
app.get("/signup", (req, res) => {
  db.all(
    `SELECT * FROM roles WHERE role_name="Host" OR role_name="Guest"`,
    [],
    (err, roles) => {
      if (err) {
        console.error(err.message);
        return res.redirect("/signup");
      }
      console.log(roles);
      res.render("signup.ejs", { title: "SignUp || Page", roles: roles });
    }
  );
});
app.post("/signup", upload.single("photo"), async (req, res) => {
  const hashedPassword = await bcrypt.hash(req.body.password, 10);
  const userInfo = {
    fullname: req.body.fullname,
    email: req.body.email,
    phonenumber: req.body.phonenumber,
    username: req.body.username,
    role: req.body.role,
    photo: req.file ? req.file.path : null,
    password: hashedPassword,
  };
  console.log(userInfo);

  db.run(
    `INSERT INTO user (full_name,email,user_name,phone_number,role,password,profile_picture) 
     VALUES (?,?,?,?,?,?,?)`,
    [
      userInfo.fullname,
      userInfo.email,
      userInfo.username,
      userInfo.phonenumber,
      userInfo.role,
      userInfo.password,
      userInfo.photo,
    ],
    (err) => {
      if (err) return res.status(500).send("Server Error");
      else {
        res.redirect("/login");
      }
    }
  );
});

// Login
app.get("/login", (req, res) =>
  res.render("login", { title: "Login || Page" })
);
app.post("/login", (req, res) => {
  const loginInfo = { email: req.body.email, password: req.body.password };
  console.log("Login Information:", loginInfo);

  db.get(
    "SELECT * FROM user WHERE email = ?",
    [loginInfo.email],
    (err, row) => {
      if (err) return res.status(500).send("Server Error");
      if (!row) return res.redirect("/login");
      if (row) {
        bcrypt.compare(loginInfo.password, row.password, (err, result) => {
          if (result) {
            req.session.userInfo = row;
            userInfo = req.session.userInfo;

            if (userInfo.role == "Admin") {
              console.log("User Information Login Route:", userInfo);
              console.log("Login Successfully as an Admin");
              return res.redirect("/adminDashboard");
            } else if (userInfo.role == "Host") {
              console.log("User Information Login Route:", userInfo);
              console.log("Login Successfully as Host");
              return res.redirect("/hostDashboard");
            } else {
              console.log("User Information Login Route:", userInfo);
              console.log("Login Successfully as a Guest");
              return res.redirect("/guestDashboard");
            }
          } else {
            console.log("Wrong Credential");
            res.redirect("/login");
          }
        });
      }
    }
  );
});

// Accommodation Routes
app.get("/add-accomodation", isAuthenticated, (req, res) =>
  res.render("add-accomodation")
);
app.post(
  "/add-accommodation",
  isAuthenticated,
  upload.array("images"),
  (req, res) => {
    const { name, location, price, description } = req.body;
    const images = req.files.map((file) => file.path).join(",");
    db.run(
      `INSERT INTO accommodations (name, location, price, description, images) 
     VALUES (?, ?, ?, ?, ?)`,
      [name, location, price, description, images],
      (err) => {
        if (err)
          return res
            .status(500)
            .json({ success: false, message: "Server Error" });
        res.json({
          success: true,
          message: "Accommodation added successfully!",
        });
      }
    );
  }
);

app.get("/accommodations", isAuthenticated, (req, res) => {
  db.all("SELECT * FROM accommodations", [], (err, rows) => {
    if (err) return res.status(500).send("Server Error");
    res.json(rows);
  });
});

// Search and Filter Accommodations
app.get("/search", (req, res) => {
  const { location, priceMin, priceMax, amenities } = req.query;
  let sql = `SELECT * FROM accommodations WHERE 1 = 1`;
  if (location) sql += ` AND location LIKE '%' || ? || '%'`;
  if (priceMin && priceMax) sql += ` AND price BETWEEN ? AND ?`;
  if (amenities) {
    const amenitiesList = amenities.split(",");
    amenitiesList.forEach((amenity, index) => {
      sql +=
        index === 0
          ? ` AND (amenities LIKE '%' || ? || '%'`
          : ` OR amenities LIKE '%' || ? || '%'`;
    });
    if (amenitiesList.length > 0) sql += ")";
  }
  const params = [];
  if (location) params.push(location);
  if (priceMin && priceMax) params.push(priceMin, priceMax);
  if (amenities) params.push(...amenities.split(","));
  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).send({ error: err.message });
    res.send(rows);
  });
});

// Payment and Confirmation Pages
app.get("/payment", isAuthenticated, (req, res) => res.render("payment"));
app.get("/payment-confirmation", isAuthenticated, (req, res) =>
  res.render("payment-confirmation", isAuthenticated, {
    title: "View User Dashboard",
  })
);

// Forget Password
app.get("/forget_password", (req, res) =>
  res.render("forget_password", { title: "Forget Password || Page" })
);

// Start Server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
