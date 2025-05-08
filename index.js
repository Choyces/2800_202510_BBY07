require('dotenv').config()
const fs = require('fs');
const path = require('path'); 
const Joi = require("joi");
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const MongoStore = require('connect-mongo');
const bcrypt = require('bcrypt');
const saltRounds = 12;
const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://${process.env.MONGODB_USER}:${process.env.MONGODB_PASSWORD}@cluster0.ztyzxn3.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const expireTime = 24 * 60 * 60 * 1000; //expires after 1 day  (hours * minutes * seconds * millis)

//secret stuff
const mongodb_host = process.env.MONGODB_HOST;
const mongodb_user = process.env.MONGODB_USER;
const mongodb_password = process.env.MONGODB_PASSWORD;
const mongodb_database = process.env.MONGODB_DATABASE;
const mongodb_session_secret = process.env.MONGODB_SESSION_SECRET;
const node_session_secret = process.env.NODE_SESSION_SECRET;
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const { client, db } = require('./databaseconnection'); 
const userCollection = db.collection('users');

var mongoStore = MongoStore.create({
	mongoUrl: `mongodb+srv://${mongodb_user}:${mongodb_password}@${mongodb_host}/sessions`,
	crypto: {
		secret: mongodb_session_secret
	}
})

// REQUIRES
const app = express();
app.use(express.urlencoded({extended: false}));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
 secret: 'hi guys this is a secret key',
 resave: true,
 saveUninitialized: true
}));

// just like a simple web server like Apache web server
// we are mapping file system paths to the app's virtual paths
app.use("/js", express.static("./scripts"));
app.use("/css", express.static("./styles"));
app.use("/img", express.static("./image"));
app.use('/text', express.static(path.join(__dirname, '..', 'text'))); 
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

const routesPath = path.join(__dirname, 'routes'); 
fs.readdirSync(routesPath)
  .filter(file => file.endsWith('.js'))
  .forEach(file => {
    const router = require(path.join(routesPath, file)); 
    app.use('/', router);                               
  });

app.get("/", function(req, res) {
    let doc = fs.readFileSync("./index.html", "utf8");
    res.send(doc);
});
app.get("/signup", function(req, res) {
  let doc = fs.readFileSync("./text/signup.html", "utf8");
  res.send(doc);
});
app.get("/main", function (req, res) {
    let doc = fs.readFileSync("./text/main.html", "utf8");
    res.send(doc);
});

app.get("/login", function (req, res) {
    let doc = fs.readFileSync("./text/login.html", "utf8");
    res.send(doc);
});
//signup route
app.post('/submitUser', async (req,res) => {
  console.log("creating user");
  try {
    const {
      name,
      username,
      email,
      password,
      dob,        
      location
    } = req.body;
  
    const schema = Joi.object({
      name:   Joi.string().max(50).required(),
      username:    Joi.string().alphanum().min(3).max(30).required(),
      email:       Joi.string().email().required(),
      password:    Joi.string().min(3).max(20).required(),
      dob:         Joi.date().iso().optional(),
      location:    Joi.string().max(100).optional()
    });
  
    const validationResult = schema.validate({ name, username, email, password, dob, location });
    if (validationResult.error != null) {
      console.log(validationResult.error);
      
      res.redirect("/signup");
      return;
    }
    var hashedPassword = await bcrypt.hash(password, saltRounds);
    const newUser = {
      name,
      username,
      email,
      hashedPassword,                
      dob:      dob ? new Date(dob) : undefined,
      location: location || '',
      bio:       '',
      avatarUrl: '',
      privacySettings: {
        notificationsEnabled: true,
        profilePublic:        true
      },
      posts: [],
      reels: [],
      followers:   [],
      following:   [],
      savedTerms:  [],
      savedPosts:  []
    };
    await userCollection.insertOne(newUser);
    console.log("Inserted user");

    const html = `
    <html>
    <head>
      <title>User Created</title>
      <link rel="stylesheet" href="/css/success.css">
    </head>
    <body>
      <div class="success-container">
        <h1>Account Created Successfully!</h1>
        <p>Your account has been created. <br> You can now log in.</p>
        <form action="/login">
          <button type="submit">Log In</button>
        </form>
      </div>
    </body>
    </html>
    `;
    
    res.send(html);
    
  } 
  catch (err) {
    console.error("Error in /submitUser:", err);
    return res.status(500).send("Oops—something went wrong.");
  }
});

// Login route
app.post('/loggingin', async (req,res) => {
  var email = req.body.email;
  var password = req.body.password;

const schema = Joi.string().max(20).required();
const validationResult = schema.validate(email);
if (validationResult.error != null) {
  console.log(validationResult.error);

const html = `
<html>
<head>
  <title>Invalid Credentials</title>
  <link rel="stylesheet" href="/css/error.css">
</head>
<body>
  <div class="error-container">
    <h1>Invalid Email/Password</h1>
    <p>The email and password combination you entered is incorrect. Please try again.</p>
    <a href="/login">Try Again</a>
  </div>
</body>
</html>
`;

res.send(html);

     res.send(html);
   return;
}

const result = await userCollection.find({email: email}).project({email: 1, hashedPassword: 1, _id: 1}).toArray();

console.log(result);

if (result.length !== 1) {
  const html = `
    <html>
    <head>
      <title>User Not Found</title>
      <link rel="stylesheet" href="/css/error.css">
    </head>
    <body>
      <div class="error-container">
        <h1>User Not Found</h1>
        <p>The user you are looking for could not be found.</p>
        <a href="/login">Try Again</a>
      </div>
    </body>
    </html>
  `;
  res.send(html);
  return;
}

if (await bcrypt.compare(password, result[0].hashedPassword)) {
  console.log("correct password");
  req.session.authenticated = true;
  req.session.email = email;
  req.session.cookie.maxAge = expireTime;
  req.session.userId        = result[0]._id.toString();
  req.session.cookie.maxAge = expireTime;

  res.redirect('/main');
  return;
}
else {
  const html = `
  <html>
  <head>
    <title>Invalid Password</title>
    <link rel="stylesheet" href="/css/error.css">
  </head>
  <body>
    <div class="error-container">
      <h1>Invalid Password</h1>
      <p>The password you entered is incorrect. Please try again.</p>
      <a href="/login">Try Again</a>
    </div>
  </body>
  </html>
  `;
  
  res.send(html);
  
}
});
app.get('/logout', (req,res) => {
	req.session.destroy();
    var html = `
    You are logged out.
    `;
    res.send(html);
});

app.get("/profile", function (req, res) {
    let doc = fs.readFileSync("./text/profile.html", "utf8");
    res.send(doc);

});

app.get("/about", function (req, res) {

    let doc = fs.readFileSync("./about.html", "utf8");

    // just send the text stream
    res.send(doc);

});

app.get("/lists", function (req, res) {

    let doc = fs.readFileSync("./app/data/lists.js", "utf8");

    // just send the text stream
    res.send(doc);

});

app.get("/date", function (req, res) {

    // set the type of response:
    res.setHeader("Content-Type", "application/json");
    let options = { weekday: "long", year: "numeric", month: "long", day: "numeric" };
    let d = new Date();

    res.send({ currentTime: d.toLocaleDateString("en-US", options) });

});

// for resource not found (i.e., 404)
app.use(function (req, res, next) {
    // this could be a separate file too - but you'd have to make sure that you have the path
    // correct, otherewise, you'd get a 404 on the 404 (actually a 500 on the 404)
    res.status(404).send("<html><head><title>Page not found!</title></head><body><p>Nothing here.</p></body></html>");
});

// RUN SERVER
let port = 8000;
app.listen(port, function () {
    console.log("Example app listening on port " + port + "!");
});
