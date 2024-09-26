// Required Modules
const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const bcrypt = require("bcrypt");
const multer = require("multer");
const sqlite3 = require("sqlite3").verbose();
const session = require("express-session");
const flash = require("connect-flash");

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

// Flash middleware
app.use(flash());

// Middleware to pass flash messages to all views
// app.use((req, res, next) => {
//   res.locals.success_msg = req.flash("success_msg");
//   res.locals.error_msg = req.flash("error_msg");
//   next();
// });

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
    return next();
  } else {
    req.flash("info", "Flash is back!");
    res.redirect("/login");
  }
}

function hostAuthenticated(req, res, next) {
  if (req.session.userInfo && req.session.userInfo.role === "Host") {
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
  // Create accommodations table
  db.run(`
    CREATE TABLE IF NOT EXISTS accommodations (
      id INTEGER PRIMARY KEY AUTOINCREMENT, 
      name VARCHAR(255),
      city VARCHAR(255),
      address VARCHAR(255), 
      price DECIMAL(10, 2), 
      description VARCHAR(255), 
      images TEXT,
      bedrooms INT,
      bathrooms INT,
      kitchen BOOLEAN,
      living_room BOOLEAN,
      dinning_room BOOLEAN,
      wifi BOOLEAN,
      parking BOOLEAN,
      balcony BOOLEAN,
      gym BOOLEAN,
      swimming_pool BOOLEAN,
      max_guests INT,
      amenities TEXT,
      check_in_date DATE,
      check_out_date DATE,
      availability BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      user_id INT,
      FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
    )
  `);

  // Create user table
  db.run(`
    CREATE TABLE IF NOT EXISTS user (
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
  `);

  // Create roles table
  db.run(`
    CREATE TABLE IF NOT EXISTS roles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      role_name VARCHAR(250),
      description VARCHAR(250)
    )
  `);

  // Create bookings table
  db.run(`
    CREATE TABLE IF NOT EXISTS bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      guest_id INTEGER,
      host_id INTEGER,
      accommodation_id INTEGER,
      check_in_date DATE,
      check_out_date DATE,
      total_price DECIMAL(10, 2),
      payment_status TEXT CHECK( payment_status IN ('pending', 'completed', 'failed') ) DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      
      FOREIGN KEY (guest_id) REFERENCES user(id) ON DELETE CASCADE,
      FOREIGN KEY (accommodation_id) REFERENCES accommodations(id) ON DELETE CASCADE
    )
  `);
});

// Routes
const homeProperty = (res, req) => {
  currentUser = req.session.userInfo;
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
        user: currentUser,
      });
    }
  );
};
// Home, About, Explore, and Dashboards

app.get("/home", (req, res) => {
  homeProperty(res, req);
});
app.get("/", (req, res) => {
  homeProperty(res, req);
});
app.get("/about", (req, res) => {
  currentUser = req.session.userInfo;
  res.render("about", { title: "About", user: currentUser });
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
      // console.log("clicked", accommodation.images);
      // Render the accommodation detail page
      res.render("propertydetail", {
        title: "Property Detail",
        property: accommodation, // Passing the single property object
      });
    }
  );
});

app.post("/booking/:id", (req, res) => {
  const propertyId = req.params.id;
  console.log("Proper ID", propertyId);

  // Retrieve the property/accommodation details
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
        return res.status(404).send("Accommodation not found");
      }

      // Parse the JSON images before rendering
      if (accommodation.images) {
        accommodation.images = JSON.parse(accommodation.images);
      }

      console.log("Clicked:", accommodation.images);
      // Example of where you might use `currentUser` (needs to be defined elsewhere)
      console.log("Current user:", currentUser);

      // Gather the booking info from the form submission
      const bookingInfo = {
        check_in_date: req.body.checkInDate,
        check_out_date: req.body.checkOutDate,
        number_of_guest: req.body.numGuests,
        accommodation_id: propertyId,
        user_id: currentUser.id, // Assuming `currentUser` contains the logged-in user information
      };
      console.log("Booking Info:", bookingInfo);

      // Save booking to database (example with SQL insert)
      const insertBookingQuery = `
        INSERT INTO bookings (check_in_date, check_out_date, number_of_guest, accommodation_id, user_id)
        VALUES (?, ?, ?, ?, ?)
      `;
      db.run(
        insertBookingQuery,
        [
          bookingInfo.check_in_date,
          bookingInfo.check_out_date,
          bookingInfo.number_of_guest,
          bookingInfo.accommodation_id,
          bookingInfo.user_id,
        ],
        (insertErr) => {
          if (insertErr) {
            return res.status(500).send("Error saving booking information");
          }
          // Once the booking is saved, you can render a confirmation page or redirect the user
          res.render("bookingConfirmation", {
            title: "Booking Confirmation",
            property: accommodation,
            bookingInfo: bookingInfo,
          });
        }
      );
    }
  );
});

// res.render("propertydetail", { title: "Property Detail" });
app.get("/explore", (req, res) => {
  currentUser = req.session.userInfo;
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
      user: currentUser,
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
      city,
      address,
      price,
      description,
      bedrooms,
      bathrooms,
      kitchen,
      living_room,
      dinning_room,
      wifi,
      balcony,
      parking,
      gym,
      swimming_pool,
      max_guests,
      amenities,
      check_in_date,
      check_out_date,
    } = req.body;
    const images = JSON.stringify(req.files.map((file) => file.path)); // Store as JSON array
    const userId = req.session.userInfo.id;
    db.run(
      `INSERT INTO accommodations (name, city, address, price, description, images, bedrooms, bathrooms, kitchen, living_room, dinning_room, wifi, parking, balcony, gym, swimming_pool, max_guests, check_in_date, check_out_date,  user_id) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        city,
        address,
        price,
        description,
        images,
        bedrooms,
        bathrooms,
        kitchen,
        living_room,
        dinning_room,
        wifi,
        balcony,
        parking,
        gym,
        swimming_pool,
        max_guests,
        check_in_date,
        check_out_date,
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
app.get("/host-dashboard", hostAuthenticated, (req, res) => {
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
app.get("/host-manage-property", hostAuthenticated, (req, res) => {
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
// Accommodation Routes
app.get("/add-accommodation", isAuthenticated, (req, res) => {
  console.log("GEee");
  res.render("add-accommodation");
});
app.post("/add-accommodation", upload.array("images"), (req, res) => {
  const accommodationInfo = {
    name: req.body.name,
    city: req.body.city,
    address: req.body.address,
    price: req.body.price,
    description: req.body.description,
    bedrooms: req.body.bedrooms,
    bathrooms: req.body.bathrooms,
    kitchen: req.body.kitchen,
    living_room: req.body.living_room,
    dinning_room: req.body.dinning_room,
    wifi: req.body.wifi,
    balcony: req.body.balcony,
    parking: req.body.parking,
    gym: req.body.gym,
    swimming_pool: req.body.swimming_pool,
    max_guests: req.body.max_guests,
    check_in_date: req.body.check_in_date,
    check_out_date: req.body.check_out_date,
  };

  console.log(accommodationInfo);
  const images = JSON.stringify(req.files.map((file) => file.path)); // Store as JSON array
  const userId = req.session.userInfo.id;
  db.run(
    `INSERT INTO accommodations (name, city, address, price, description, images, bedrooms, bathrooms, kitchen, living_room, dinning_room, wifi, parking, balcony, gym, swimming_pool, max_guests, check_in_date, check_out_date,  user_id) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      accommodationInfo.name,
      accommodationInfo.city,
      accommodationInfo.address,
      accommodationInfo.price,
      accommodationInfo.description,
      images,
      accommodationInfo.bedrooms,
      accommodationInfo.bathrooms,
      accommodationInfo.kitchen,
      accommodationInfo.living_room,
      accommodationInfo.dinning_room,
      accommodationInfo.wifi,
      accommodationInfo.balcony,
      accommodationInfo.parking,
      accommodationInfo.gym,
      accommodationInfo.swimming_pool,
      accommodationInfo.max_guests,
      accommodationInfo.check_in_date,
      accommodationInfo.check_out_date,
      userId,
    ],
    (err) => {
      if (err)
        // return res
        //   .status(500)
        //   .json({ success: false, message: "Server Error" });
        console.error(err.message);
      else {
        // res.json({
        //   success: true,
        //   message: "Accommodation added successfully!",
        // });
        res.redirect("/host-manage-property");
      }
    }
  );
});

console.log(userInfo);
// Signup
app.get("/signup", (req, res) => {
  currentUser = req.session.userInfo;
  db.all(
    `SELECT * FROM roles WHERE role_name="Host" OR role_name="Guest"`,
    [],
    (err, roles) => {
      if (err) {
        console.error(err.message);
        return res.redirect("/signup");
      }
      console.log(roles);
      res.render("signup.ejs", {
        title: "SignUp || Page",
        roles: roles,
        user: currentUser,
      });
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
app.get("/login", (req, res) => {
  currentUser = req.session.userInfo;
  res.render("login", { title: "Login || Page", user: currentUser });
});
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
              return res.redirect("/explore");
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
app.get("/payment", (req, res) => res.render("payment"));
app.get("/payment-confirmation", (req, res) =>
  res.render("payment-confirmation", {
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
