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
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
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

function adminAuthenticated(req, res, next) {
  if (req.session.userInfo && req.session.userInfo.role === "Admin") {
    return next(); // User is authenticated, proceed to the next middleware/route
  } else {
    // alert("Kindly login before proceding");
    res.redirect("/login"); // User is not authenticated, redirect to login page
  }
}

let userInfo = {};
let currentUser = {};

const currentuser = (req) => {
  currentUser = req.session.userInfo;
};

console.log("User Infomation:", userInfo);
console.log("Login User Info:", currentUser);
// Database Table Creation
db.serialize(() => {
  db.run(
    `CREATE TABLE IF NOT EXISTS accommodations (
      id INTEGER PRIMARY KEY AUTOINCREMENT, 
      name VARCHAR(255), 
      location VARCHAR(255), 
      price INT, 
      description VARCHAR(255), 
      images TEXT,
      bedrooms INT,
      bathrooms INT,
      kitchen BOOLEAN,
      living_room BOOLEAN,
      dinning_room BOOLEAN,
      availability BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      user_id INT,
      FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
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
const homeProperty = (res) => {
  db.all(
    `SELECT accommodations.*, user.user_name, user.full_name, user.email, user.phone_number, user.profile_picture FROM accommodations 
     JOIN user ON accommodations.user_id = user.id`,
    [],
    (err, accommodations) => {
      if (err) {
        console.error(err.message);
        return res.redirect("/home");
      }

      // Parse the JSON images before rendering
      accommodations.forEach((accommodation) => {
        accommodation.images = JSON.parse(accommodation.images);
      });
      console.log("sample", accommodations);
      res.render("index", {
        title: "Home || Page",
        accommodations,
      });
    }
  );
};
// Home, About, Explore, and Dashboards

app.get("/home", (req, res) => {
  homeProperty(res);
});
app.get("/", (req, res) => {
  homeProperty(res);
});
app.get("/about", (req, res) => {
  res.render("about", { title: "About" });
});
app.get("/property-detail/:id", (req, res) => {
  const propertyId = req.params.id;

  db.get(
    `SELECT accommodations.*, user.user_name, user.full_name, user.email, user.phone_number, user.profile_picture
     FROM accommodations
     JOIN user ON accommodations.user_id = user.id
     WHERE accommodations.id = ?`,
    [propertyId],
    (err, accommodation) => {
      if (err) {
        return res.status(500).send("Error retrieving accommodation details");
      }

      if (!accommodation) {
        return res.status(404).send("Accommod5ation not found");
      }

      // Parse the JSON images before rendering
      accommodation.images = JSON.parse(accommodation.images);

      console.log(accommodation);

      // Render the accommodation detail page
      res.render("propertydetail", {
        title: "Property Detail",
        property: accommodation, // Passing the single property object
      });
    }
  );
});

// res.render("propertydetail", { title: "Property Detail" });
app.get("/explore", (req, res) => {
  db.all(`SELECT * FROM accommodations`, [], (err, accommodations) => {
    if (err) {
      console.error(err.message);
      return res.redirect("/home");
    }

    // Parse the JSON images before rendering
    accommodations.forEach((accommodation) => {
      accommodation.images = JSON.parse(accommodation.images);
    });
    res.render("explore", {
      title: "Explore || Page",
      accommodations,
    });
  });
});
app.get("/admin-dashboard", adminAuthenticated, (req, res) => {
  currentuser(req);
  db.all(`SELECT * FROM user`, [], (err, users) => {
    if (err) {
      console.error(err.message);
      return res.redirect("/admin-dashboard");
    }
    db.all(`SELECT * FROM accommodations`, [], (err, accommodations) => {
      if (err) {
        console.error(err.message);
        return res.redirect("/admin-dashboard");
      }
      res.render("adminDashboard", {
        users: users,
        accommodations: accommodations,
        currentUser: currentUser,
      });
    });
  });
});
app.get("/manage-user", adminAuthenticated, (req, res) => {
  currentuser(req);
  db.all(`SELECT * FROM user`, [], (err, users) => {
    if (err) {
      console.error(err.message);
      return res.redirect("/admin-dashboard");
    }
    res.render("adminManageUser", { users: users, currentUser: currentUser });
  });
});
app.get("/manage-accommodation", adminAuthenticated, (req, res) => {
  currentuser(req);
  db.all(`SELECT * FROM accommodations`, [], (err, accommodations) => {
    if (err) {
      console.error(err.message);
      return res.redirect("/manage-accommodation");
    }
    res.render("adminManageAccommodations", {
      accommodations: accommodations,
      currentUser: currentUser,
    });
  });
});
app.get("/add-user", adminAuthenticated, (req, res) => {
  db.all(`SELECT * FROM roles`, [], (err, roles) => {
    if (err) {
      console.error(err.message);
      return res.redirect("/manage-accommodation");
    }
    console.log(roles);
    res.render("add-user", { title: "Add User || Page", roles: roles });
  });
});
app.post("/add-user", upload.single("photo"), async (req, res) => {
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
        res.redirect("/manage-user");
      }
    }
  );
});
// Accommodation Routes
app.get("/admin-add-accommodation", adminAuthenticated, (req, res) =>
  res.render("admin-add-accommodation")
);
app.post(
  "/admin-add-accommodation",
  isAuthenticated,
  upload.array("images"),
  (req, res) => {
    const {
      name,
      location,
      price,
      description,
      bedrooms,
      bathrooms,
      kitchen,
      living_room,
      dinning_room,
    } = req.body;
    const images = JSON.stringify(req.files.map((file) => file.path)); // Store as JSON array
    const userId = req.session.userInfo.id;
    db.run(
      `INSERT INTO accommodations (name, location, price, description, images, bedrooms, bathrooms, kitchen, living_room, dinning_room, user_id) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        location,
        price,
        description,
        images,
        bedrooms,
        bathrooms,
        kitchen,
        living_room,
        dinning_room,
        userId,
      ],
      (err) => {
        if (err)
          return res
            .status(500)
            .json({ success: false, message: "Server Error" });
        // res.json({
        //   success: true,
        //   message: "Accommodation added successfully!",
        // });
        res.redirect("/manage-accommodation");
      }
    );
  }
);

app.get("/guest-dashboard", isAuthenticated, (req, res) =>
  res.render("userDashboard", {
    title: "User Dashboard",
    userInfo: userInfo,
  })
);
app.get("/host-dashboard", isAuthenticated, (req, res) => {
  // currentUser = req.session.userInfo;
  currentuser(req);
  db.all(
    `SELECT * FROM accommodations WHERE user_id= ?`,
    [currentUser.id],
    (err, accommodations) => {
      if (err) {
        console.error(err.message);
        return res.redirect("/host-manage-property");
      }

      res.render("hostDashboard", {
        currentUser: currentUser,
        accommodations,
      });
    }
  );
});
app.get("/host-manage-property", isAuthenticated, (req, res) => {
  currentuser(req);

  db.all(
    `SELECT * FROM accommodations WHERE user_id= ?`,
    [currentUser.id],
    (err, accommodations) => {
      if (err) {
        console.error(err.message);
        return res.redirect("/host-manage-property");
      }

      // Parse the JSON images before rendering
      accommodations.forEach((accommodation) => {
        accommodation.images = JSON.parse(accommodation.images);
      });
      res.render("hostManageProperty", {
        currentUser: currentUser,
        accommodations,
      });
    }
  );
});

console.log(userInfo);
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
              return res.redirect("/admin-dashboard");
            } else if (userInfo.role == "Host") {
              console.log("User Information Login Route:", userInfo);
              console.log("Login Successfully as Host");
              return res.redirect("/host-dashboard");
            } else {
              console.log("User Information Login Route:", userInfo);
              console.log("Login Successfully as a Guest");
              return res.redirect("/guest-dashboard");
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
    const {
      name,
      location,
      price,
      description,
      bedrooms,
      bathrooms,
      kitchen,
      living_room,
      dinning_room,
    } = req.body;
    const images = JSON.stringify(req.files.map((file) => file.path)); // Store as JSON array
    const userId = req.session.userInfo.id;
    db.run(
      `INSERT INTO accommodations (name, location, price, description, images, bedrooms, bathrooms, kitchen, living_room, dinning_room, user_id) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        location,
        price,
        description,
        images,
        bedrooms,
        bathrooms,
        kitchen,
        living_room,
        dinning_room,
        userId,
      ],
      (err) => {
        if (err)
          return res
            .status(500)
            .json({ success: false, message: "Server Error" });
        // res.json({
        //   success: true,
        //   message: "Accommodation added successfully!",
        // });
        res.redirect("/host-manage-property");
      }
    );
  }
);

app.get("/accommodations", (req, res) => {
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

app.get("/fectingdashboard", (req, res) => {
  res.render("fectingdashboard");
});

// Start Server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
