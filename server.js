// Required Modules
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const path = require("path");
const bcrypt = require("bcrypt");
const multer = require("multer");
const sqlite3 = require("sqlite3").verbose();
const session = require("express-session");
const flash = require("connect-flash");
const http = require("http"); // Required for using socket.io with Express
const socketIo = require("socket.io");
const server = http.createServer(app); // Create an HTTP server
const io = socketIo(server);
const nodemailer = require("nodemailer");
// const searchFilter = require("./router/searchFilter");
// app.use('/home', searchFilter)

// Initialize App

const port = 5000;
const db = new sqlite3.Database("staylib.db");

// Listen for client connections on Socket.io
io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);

  // Listen for 'sendMessage' event from the client
  socket.on("sendMessage", (messageData) => {
    console.log("Message received:", messageData);

    // Save message to database (replace with your actual query)
    // const query = `INSERT INTO messages (message, sender, timestamp) VALUES (?, ?, ?)`;
    const query = `INSERT INTO messages (message, created_at) VALUES (?, ?)`;
    db.run(
      query,
      // [messageData.text, messageData.sender, messageData.timestamp],
      [messageData.text, messageData.timestamp],
      (err) => {
        if (err) {
          console.error("Error saving message:", err);
        } else {
          // Broadcast message to all connected clients
          io.emit("receiveMessage", messageData);
        }
      }
    );
  });
  // Handle client disconnect
  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

// Set up the transporter for sending emails
const transporter = nodemailer.createTransport({
  service: "gmail", // You can use other services like SendGrid, etc.
  auth: {
    user: "your-email@gmail.com", // Your email
    pass: "your-email-password", // Your email password or app-specific password
  },
});

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

//Middleware to pass flash messages to all views
app.use((req, res, next) => {
  res.locals.success_msg = req.flash("success_msg");
  res.locals.error_msg = req.flash("error_msg");
  next();
});

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

function guestAuthenticated(req, res, next) {
  if (req.session.userInfo && req.session.userInfo.role === "Guest") {
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
      status TEXT CHECK( status IN ('pending', 'approved', 'denied') ) DEFAULT 'pending',
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
      max_guests VARCHAR(250), 
      FOREIGN KEY (guest_id) REFERENCES user(id) ON DELETE CASCADE,
      FOREIGN KEY (accommodation_id) REFERENCES accommodations(id) ON DELETE CASCADE
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      booking_id INTEGER,
      guest_id INTEGER,
      host_id INTEGER,
      accommodation_id INTEGER,
      payment_method VARCHAR(50),
      accommodation_cost DECIMAL(10, 2),
      service_fee DECIMAL(10, 2),
      total_payment DECIMAL(10, 2),
      status VARCHAR(50),
      payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      transaction_id VARCHAR(100),
      FOREIGN KEY (booking_id) REFERENCES bookings(id)
      FOREIGN KEY (guest_id) REFERENCES user(id) ON DELETE CASCADE,
      FOREIGN KEY (accommodation_id) REFERENCES accommodations(id)
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS conversations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guest_id INTEGER,
    host_id INTEGER,
    last_message TEXT,
    last_message_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`);
  db.run(`
  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    conversation_id INTEGER,
    sender_id INTEGER,
    receiver_id INTEGER,
    message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`);
});

// Routes

// Route for fetching filtered accommodations
app.get("/home", (req, res) => {
  const { name, city, minPrice, maxPrice, bedrooms } = req.query;

  let query = `SELECT accommodations.*, user.user_name, user.full_name, user.email, user.phone_number, user.profile_picture 
               FROM accommodations 
               JOIN user ON accommodations.user_id = user.id 
               WHERE 1=1`; // 1=1 is used as a placeholder for easier query building

  let queryParams = [];

  if (name) {
    query += ` AND accommodations.name LIKE ?`;
    queryParams.push(`%${name}%`);
  }

  if (city) {
    query += ` AND accommodations.city LIKE ?`;
    queryParams.push(`%${city}%`);
  }

  if (minPrice) {
    query += ` AND accommodations.price >= ?`;
    queryParams.push(minPrice);
  }

  if (maxPrice) {
    query += ` AND accommodations.price <= ?`;
    queryParams.push(maxPrice);
  }

  if (bedrooms) {
    query += ` AND accommodations.bedrooms = ?`;
    queryParams.push(bedrooms);
  }

  db.all(query, queryParams, (err, accommodations) => {
    if (err) {
      console.error(err.message);
      return res.status(500).json({ error: "Failed to fetch accommodations" });
    }

    // Parse the JSON images for each accommodation
    accommodations.forEach((accommodation) => {
      accommodation.images = JSON.parse(accommodation.images);
    });

    // If it's an AJAX request, respond with JSON
    if (req.xhr) {
      return res.json({ accommodations });
    }

    // Otherwise, render the page
    res.render("index", {
      title: "Home || Page",
      accommodations,
      user: req.session.userInfo,
    });
  });
});

// Route for displaying the home page with search and filter functionality
// app.get('/home', (req, res) => {
//   homeProperty(req, res);
// });

// const homeProperty = (res, req) => {
//   currentUser = req.session.userInfo;
//   db.all(
//     `SELECT accommodations.*, user.user_name, user.full_name, user.email, user.phone_number, user.profile_picture FROM accommodations
//      JOIN user ON accommodations.user_id = user.id`,
//     [],
//     (err, accommodations) => {
//       if (err) {
//         console.error(err.message);
//         return res.redirect("/home");
//       }

//       // Parse the JSON images before rendering
//       accommodations.forEach((accommodation) => {
//         accommodation.images = JSON.parse(accommodation.images);
//       });
//       console.log("sample", accommodations);
//       res.render("index", {
//         title: "Home || Page",
//         accommodations,
//         user: currentUser,
//       });
//     }
//   );
// };
// //

// // Route for displaying home page with search and filter functionality
// app.get('/home', (req, res) => {
//   homeProperty(res, req);
// })

// Root route redirecting to home
app.get("/", (req, res) => {
  const { name, city, minPrice, maxPrice, bedrooms } = req.query;

  let query = `SELECT accommodations.*, user.user_name, user.full_name, user.email, user.phone_number, user.profile_picture 
               FROM accommodations 
               JOIN user ON accommodations.user_id = user.id 
               WHERE 1=1`; // 1=1 is used as a placeholder for easier query building

  let queryParams = [];

  if (name) {
    query += ` AND accommodations.name LIKE ?`;
    queryParams.push(`%${name}%`);
  }

  if (city) {
    query += ` AND accommodations.city LIKE ?`;
    queryParams.push(`%${city}%`);
  }

  if (minPrice) {
    query += ` AND accommodations.price >= ?`;
    queryParams.push(minPrice);
  }

  if (maxPrice) {
    query += ` AND accommodations.price <= ?`;
    queryParams.push(maxPrice);
  }

  if (bedrooms) {
    query += ` AND accommodations.bedrooms = ?`;
    queryParams.push(bedrooms);
  }

  db.all(query, queryParams, (err, accommodations) => {
    if (err) {
      console.error(err.message);
      return res.status(500).json({ error: "Failed to fetch accommodations" });
    }

    // Parse the JSON images for each accommodation
    accommodations.forEach((accommodation) => {
      accommodation.images = JSON.parse(accommodation.images);
    });

    // If it's an AJAX request, respond with JSON
    if (req.xhr) {
      return res.json({ accommodations });
    }

    // Otherwise, render the page
    res.render("index", {
      title: "Home || Page",
      accommodations,
      user: req.session.userInfo,
    });
  });
});

// About page route
app.get("/about", (req, res) => {
  const currentUser = req.session.userInfo;
  res.render("about", { title: "About", user: currentUser });
});

app.get("/property-detail/:id", (req, res) => {
  currentUser = req.session.userInfo;
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
        user: currentUser,
      });
    }
  );
});

app.get("/bookings", guestAuthenticated, (req, res) => {
  const currentUser = req.session.userInfo;

  db.all(
    `SELECT bookings.*, user.full_name, user.email, user.phone_number, accommodations.name AS accommodation_name
     FROM bookings
     JOIN user ON bookings.host_id = user.id
     JOIN accommodations ON bookings.accommodation_id = accommodations.id
     WHERE bookings.guest_id = ?`,
    [currentUser.id],
    (err, bookings) => {
      if (err) {
        return res.status(500).send("Error fetching guest bookings");
      }
      console.log(bookings);

      res.render("bookingPage", {
        bookings: bookings,
        user: currentUser,
      });
    }
  );
});

app.get("/host-manage-bookings", hostAuthenticated, (req, res) => {
  const currentUser = req.session.userInfo;

  // SQL query to join the bookings, user, and accommodations tables
  const query = `
    SELECT bookings.*, user.full_name, payments.status, accommodations.name AS accommodation_name
    FROM bookings
    JOIN user ON bookings.guest_id = user.id
    JOIN payments ON  
    JOIN accommodations ON bookings.accommodation_id = accommodations.id
    WHERE bookings.host_id = ?
  `;

  // Execute the query
  db.all(query, [currentUser.id], (err, bookings) => {
    if (err) {
      return res.status(500).send("Error fetching bookings");
    }

    // Log the bookings to verify the data
    console.log(bookings);

    // Render the hostManageBookings page with booking information
    res.render("hostManageBookings", {
      bookings: bookings,
      currentUser: currentUser,
    });
  });
});

app.post("/confirm-booking/:id", (req, res) => {
  const bookingId = req.params.id;

  const updateQuery = `UPDATE bookings SET payment_status = 'completed' WHERE id = ?`;
  db.run(updateQuery, [bookingId], (err) => {
    if (err) {
      // return res.status(500).send("Error confirming booking");
      console.error(err.message);
    }

    // Redirect back to the host dashboard after confirmation
    res.redirect("/host-manage-bookings");
  });
});

app.post("/decline-booking/:id", (req, res) => {
  const bookingId = req.params.id;

  const updateQuery = `UPDATE bookings SET payment_status = 'failed' WHERE id = ?`;
  db.run(updateQuery, [bookingId], (err) => {
    if (err) {
      // return res.status(500).send("Error declining booking");
      console.error(err.message);
    }

    // Redirect back to the host dashboard after declining
    res.redirect("/host-manage-bookings");
  });
});

// Route to handle booking submission
app.post("/booking/:id", guestAuthenticated, (req, res) => {
  const propertyId = req.params.id;
  const currentUser = req.session.userInfo;

  if (currentUser) {
    // First, get the accommodation's availability from the accommodation table
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
        // Parse the check-in and check-out dates from the form
        const checkInDate = new Date(req.body.checkInDate);
        const checkOutDate = new Date(req.body.checkOutDate);

        const timeDifference = checkOutDate - checkInDate;
        const days = timeDifference / (1000 * 60 * 60 * 24); // Convert milliseconds to days

        if (days <= 0) {
          return res
            .status(400)
            .send("Check-out date must be after check-in date");
        }
        // Calculate the total price
        const totalPrice = days * accommodation.price;

        const bookingInfo = {
          check_in_date: req.body.checkInDate,
          check_out_date: req.body.checkOutDate,
          number_of_guest: req.body.numGuests,
          accommodation_id: propertyId,
          guest_id: currentUser.id,
          host_id: accommodation.user_id,
          total_price: totalPrice, // Calculated total price
        };

        if (bookingInfo.number_of_guest > accommodation.max_guests) {
          return res
            .status(400)
            .send(
              "Number of guests are  more than the maximum allowed for this accommodation."
            );
        }
        console.log("Booking Info:", bookingInfo);

        // Save booking to the database
        const insertBookingQuery = `
          INSERT INTO bookings (guest_id, host_id, accommodation_id, check_in_date, check_out_date, total_price, max_guests)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        db.run(
          insertBookingQuery,
          [
            bookingInfo.guest_id,
            bookingInfo.host_id,
            bookingInfo.accommodation_id,
            bookingInfo.check_in_date,
            bookingInfo.check_out_date,
            bookingInfo.total_price,
            bookingInfo.number_of_guest,
          ],
          (insertErr) => {
            if (insertErr) {
              return res.status(500).send("Error saving booking information");
            }
            // Once the booking is saved, render a confirmation page
            // res.render("bookingPage", {
            //   title: "Booking Confirmation",
            //   property: accommodation,
            //   bookingInfo: bookingInfo,
            //   user: currentUser,
            // });
            res.redirect("/bookings");
          }
        );
      }
    );
  } else {
    res.redirect("/login");
  }
});

app.get("/payment-confirmation", guestAuthenticated, (req, res) => {
  currentUser = req.session.userInfo;
  res.render("payment-confirmation", {
    title: "View User Dashboard",
    user: currentUser,
  });
});

// Payment and Confirmation Pages
app.get("/payment/:id", guestAuthenticated, (req, res) => {
  bookingId = req.params.id;
  currentUser = req.session.userInfo;

  const query = `
    SELECT bookings.*, user.id, accommodations.name AS accommodation_name
    FROM bookings
    JOIN user ON bookings.guest_id = user.id
    JOIN accommodations ON bookings.accommodation_id = accommodations.id
    WHERE bookings.id = ?
  `;

  // Execute the query
  db.all(query, [bookingId], (err, bookings) => {
    if (err) {
      return res.status(500).send("Error fetching bookings");
    }

    // Log the bookings to verify the data
    console.log("Bookingssss", bookings);

    const service_fee = (bookings[0].total_price * 8) / 100;
    const accommodation_cost = bookings[0].total_price;
    const total_payment = service_fee + accommodation_cost;

    // Render the hostManageBookings page with booking information
    res.render("payment", {
      bookings: bookings,
      user: currentUser,
      service_fee: service_fee,
      accommodation_cost: accommodation_cost,
      total_payment: total_payment,
      bookingId: bookingId,
    });
  });
});

app.post("/payment/:id", (req, res) => {
  const bookingId = req.params.id;
  currentUser = req.session.userInfo;
  console.log(bookingId);

  db.get(
    `SELECT bookings.*, user.id, accommodations.id AS accommodationId
    FROM bookings
    JOIN user ON bookings.guest_id = user.id
    JOIN accommodations ON bookings.accommodation_id = accommodations.id
    WHERE bookings.id = ?`,
    [bookingId],
    (err, bookings) => {
      // Calculate the service fee and total payment
      const service_fee = (bookings.total_price * 8) / 100;
      const accommodation_cost = bookings.total_price;
      const total_payment = service_fee + accommodation_cost;

      db.run(
        `INSERT INTO payments (booking_id, guest_id, host_id, accommodation_id, payment_method, accommodation_cost,service_fee,total_payment, status) 
     VALUES (?,?,?,?,?,?,?,?,?)`,
        [
          bookingId,
          currentUser.id,
          bookings.host_id,
          bookings.accommodation_id,
          "Orange Money",
          accommodation_cost,
          service_fee,
          total_payment,
          "completed",
        ],
        (err) => {
          if (err) return res.status(500).send("Server Error");
          else {
            // res.redirect(`/payment/${bookingId}`);
            res.redirect("/payment-confirmation");
          }
        }
      );
    }
  );
  // res.redirect("/");
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

    // Initialize empty arrays for each status
    const approvedAccommodations = [];
    const pendingAccommodations = [];
    const deniedAccommodations = [];

    // Filter accommodations based on their status
    accommodations.forEach((accommodation) => {
      if (accommodation.status === "approved") {
        approvedAccommodations.push(accommodation);
      } else if (accommodation.status === "pending") {
        pendingAccommodations.push(accommodation);
      } else if (accommodation.status === "denied") {
        deniedAccommodations.push(accommodation);
      }
    });

    // Render the view with the filtered accommodations
    res.render("adminManageAccommodations", {
      currentUser: currentUser,
      approvedAccommodations: approvedAccommodations,
      pendingAccommodations: pendingAccommodations,
      deniedAccommodations: deniedAccommodations,
    });
  });
});

// Route for admin to approve the accommodation
app.post("/approve-accommodation/:id", (req, res) => {
  const accommodationId = req.params.id;
  const status = "approved";

  const updateQuery = `UPDATE accommodations SET status = 'approved' WHERE id = ?`;
  db.run(updateQuery, [accommodationId], (err) => {
    if (err) {
      // return res.status(500).send("Error confirming booking");
      console.error(err.message);
    }
    res.redirect("/manage-accommodation");

    // Redirect back to the host dashboard after confirmation
    // res.redirect("/host-manage-bookings");
  });

  // try {
  //   await db.query("UPDATE accommodations SET status = ? WHERE id = ?", [
  //     status,
  //     accommodationId,
  //   ]);
  //   res.redirect("/admin/accommodations");
  // } catch (err) {
  //   console.error(err);
  //   res.status(500).send("Error approving accommodation");
  // }
});

// Route for admin to deny the accommodation
app.post("/deny-accommodation/:id", async (req, res) => {
  const accommodationId = req.params.id;
  const status = "denied";

  const updateQuery = `UPDATE accommodations SET status = 'denied' WHERE id = ?`;
  db.run(updateQuery, [accommodationId], (err) => {
    if (err) {
      // return res.status(500).send("Error confirming booking");
      console.error(err.message);
    }
    res.redirect("/manage-accommodation");

    // Redirect back to the host dashboard after confirmation
    // res.redirect("/host-manage-bookings");
  });

  // try {
  //   await db.query("UPDATE accommodations SET status = ? WHERE id = ?", [
  //     status,
  //     accommodationId,
  //   ]);
  //   res.redirect("/admin/accommodations");
  // } catch (err) {
  //   console.error(err);
  //   res.status(500).send("Error denying accommodation");
  // }
});

app.get("/add-user", adminAuthenticated, (req, res) => {
  currentUser = req.session.userInfo;
  db.all(`SELECT * FROM roles`, [], (err, roles) => {
    if (err) {
      console.error(err.message);
      return res.redirect("/manage-accommodation");
    }
    console.log(roles);
    res.render("add-user", {
      title: "Add User || Page",
      roles: roles,
      user: currentUser,
    });
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
    } = req.body;
    const images = JSON.stringify(req.files.map((file) => file.path)); // Store as JSON array
    const userId = req.session.userInfo.id;
    db.run(
      `INSERT INTO accommodations (name, city, address, price, description, images, bedrooms, bathrooms, kitchen, living_room, dinning_room, wifi, parking, balcony, gym, swimming_pool, max_guests, user_id) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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

// app.get("/guest-dashboard", isAuthenticated, (req, res) =>
//   res.render("userDashboard", {
//     title: "User Dashboard",
//     userInfo: userInfo,
//   })
// );
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
app.get("/add-accommodation", hostAuthenticated, (req, res) => {
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
  };

  console.log(accommodationInfo);
  const images = JSON.stringify(req.files.map((file) => file.path)); // Store as JSON array
  const userId = req.session.userInfo.id;
  db.run(
    `INSERT INTO accommodations (name, city, address, price, description, images, bedrooms, bathrooms, kitchen, living_room, dinning_room, wifi, parking, balcony, gym, swimming_pool, max_guests, user_id) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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

app.get("/guest-message-overview", guestAuthenticated, (req, res) => {
  currentUser = req.session.userInfo;

  res.render("guest-message-overview.ejs", { user: currentUser });
});

app.get("/guest-message", guestAuthenticated, (req, res) => {
  currentUser = req.session.userInfo;
  const query = "SELECT * FROM messages ORDER BY created_at ASC";
  db.all(query, [], (err, rows) => {
    if (err) {
      console.error(err.message);
      return res.status(500).send("Error loading messages");
    }

    res.render("guest-message.ejs", { messages: rows, user: currentUser });
  });
  // res.render("guest-message.ejs", { user: currentUser });
});

const sendBookingNotification = (hostEmail, bookingDetails) => {
  // Define the email options
  const mailOptions = {
    from: "your-email@gmail.com", // Sender address
    to: hostEmail, // Host's email
    subject: "New Booking Request", // Subject line
    text: `A guest has requested a booking for your property. 
             Details: 
             Property: ${bookingDetails.propertyName}
             Guest Name: ${bookingDetails.guestName}
             Check-in Date: ${bookingDetails.checkInDate}
             Check-out Date: ${bookingDetails.checkOutDate}`,
  };

  // Send the email
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log("Error sending email:", error);
    } else {
      console.log("Email sent successfully:", info.response);
    }
  });
};

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

// Logout route
app.get("/logout", (req, res) => {
  // Destroy the session
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).send("Error logging out");
    }
    // Redirect to the login page or homepage
    res.redirect("/login");
  });
});

// app.get("/accommodations", (req, res) => {
//   db.all("SELECT * FROM accommodations", [], (err, rows) => {
//     if (err) return res.status(500).send("Server Error");
//     res.json(rows);
//   });
// });

// // Route to display the homepage with optional search/filter functionality
app.get("/", (req, res) => {
  const { name, city, address, bedrooms, price } = req.query;
  let query = "SELECT * FROM accommodations WHERE 1=1"; // Base query to fetch all accommodations
  let params = [];

  // Append filters dynamically based on the user input
  if (name) {
    query += " AND name LIKE ?";
    params.push(`%${name}%`);
  }
  if (city) {
    query += " AND city LIKE ?";
    params.push(`%${city}%`);
  }
  if (address) {
    query += " AND address LIKE ?";
    params.push(`%${address}%`);
  }
  if (bedrooms) {
    query += " AND bedrooms = ?";
    params.push(bedrooms);
  }
  if (price) {
    query += " AND price <= ?";
    params.push(price);
  }

  // Execute the query to fetch filtered accommodations from the database
  db.all(query, params, (err, rows) => {
    if (err) {
      console.error(err);
      res.status(500).send("Error querying the database");
    } else {
      // Render the homepage view with the filtered accommodations
      res.render("index", { accommodations: rows });
    }
  });
});

// Search route
app.get("/search", (req, res) => {
  res.render("search", { title: "Search || Page" });
});

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
