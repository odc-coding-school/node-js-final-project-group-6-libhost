const express = require('express');
const app = express();
const bodyparser = require('body-parser');
const port = 5000;
const path = require('path');
const bcrypt = require('bcrypt');
const multer = require('multer');
const upload = multer();

// Middleware
app.use(bodyparser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');

// Static Files
app.set('views', path.join(__dirname, 'views'));
app.use('/css', express.static(path.join(__dirname, 'public/css')));
app.use('/images', express.static(path.join(__dirname, 'public/images')));

// Routes
// AdminDashboard Route
app.get('/adminDashboard', (req, res) => {
    res.render('adminDashboard');
});

//UserDashboard Route
app.get('/userDashboard', (req, res) => {
    res.render('userDashboard');
})

// Booking Info
app.get('/bookingInfo', (req, res) => {
    res.render('bookingInfo');
})

// Payment Route
app.get('/payment', (req, res) => {
    res.render('payment');
})



// set views directory

app.set('view engine','ejs');

app.use(express.static(path.join(__dirname,'views')));

// static files

// external css files

app.use('/css',express.static(path.join(__dirname,'public/css')));

// external js files

app.use('/js',express.static(path.join(__dirname,'public/js')));

// images

app.use('/images',express.static(path.join(__dirname,'public/images')));


// bootstrap

app.use('/css',express.static(path.join(__dirname,'node_modules/bootstrap/dist/css')));


app.use('/js',express.static(path.join(__dirname,'node_modules/bootstrap/dist/js')));


// fontawesome 4

app.use(express.static(path.join(__dirname,'node_modules/@fortawesome/fontawesome-free')));


// home page

app.get('/home',(req,res) => {
    
    res.render('index',{
        title: "Home||Page"
    })
    
});

// about page

app.get('/about',(req,res) => {
    
    res.render('about',{
        title: "About||Page"
    })
    
});

// explore

app.get('/explore',(req,res) => {
    
    res.render('index',{
        title: "Explore||Page"
    })
    
});

// signup

app.get('/signup',(req,res) => {
    
    res.render('index',{
        title: "SignUp||Page"
    })
    
});


// verification


app.get('/confrimation',(req,res) => {
   
    res.render('view_dashboard', {title: "view user_DashBoard"})
    
});


// forget password

app.get('/forget_password',(req, res) => {
    
    res.render('forget_password',{title: "forget password || Page"})
})


// dashboard

app.get('/dashboard',(req,res) => {
   
    res.render('dashboard', {title: "user-DashBoard || Page"})
    
});

// login

app.get('/login',(req,res) => {
    
    res.render('login',{
        title: "Login||Page"})
    
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
