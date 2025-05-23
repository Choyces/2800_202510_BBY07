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
const postsCollection = db.collection('posts');
const { ObjectId } = require('mongodb');


var mongoStore = MongoStore.create({
	mongoUrl: `mongodb+srv://${mongodb_user}:${mongodb_password}@${mongodb_host}/sessions`,
	crypto: {
		secret: mongodb_session_secret
	}
})


// REQUIRES
const app = express();
app.use(express.json()); 
app.use(express.urlencoded({extended: false}));
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(session({
 secret: 'hi guys this is a secret key',
 resave: true,
 saveUninitialized: true
}));

// serve *everything* in your project root at the web root
app.use(express.static(__dirname));


// just like a simple web server like Apache web server
// we are mapping file system paths to the app's virtual paths
app.use("/js", express.static("./scripts"));
app.use("/css", express.static("./styles"));
app.use("/img", express.static("./image"));
app.use('/text', express.static(path.join(__dirname, 'text'))); 
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));
// app.use('/', require('./routes/profileRoutes'));

app.set('view engine', 'ejs');

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
        var error = req.query.error;
      if (error == "email_in_use") {
        doc = doc.replace("<!--ERROR-->", `<p style="color:red;">Error: Email already in use, please try with another email.</p>`);
    } 
  res.send(doc);
});
app.get("/main", function (req, res) {  
    let doc = fs.readFileSync("./text/main.html", "utf8");
    res.send(doc);
});
app.get("/weather", function(req, res) {
  let doc = fs.readFileSync("./text/weather.html", "utf8");
  res.send(doc);
});
app.get("/test", function (req, res) {
  let doc = fs.readFileSync("./text/test.html", "utf8");
  res.send(doc);
});
app.get("/game", function (req, res) {
  let doc = fs.readFileSync("./text/game.html", "utf8");
  res.send(doc);
});

app.get("/login", function (req, res) {
    let doc = fs.readFileSync("./text/login.html", "utf8");
    res.send(doc);
});app.get("/reels", function (req, res) {
  let doc = fs.readFileSync("./text/reel.html", "utf8");
  res.send(doc);
});
app.get("/search", function (req, res) {
  let doc = fs.readFileSync("./text/search.html", "utf8");
  res.send(doc);
});
app.get("/reel", function (req, res) {
  let doc = fs.readFileSync("./text/reel.html", "utf8");
  res.send(doc);
});


//signup route
app.post('/submitUser', async (req,res) => {
  console.log("creating user");
  try {
    const {
      name,
      username,
      rawemail = req.body.email.toLowerCase(),
      password,
      dob,        
      location
    } = req.body;
    email = rawemail.toLowerCase();
  
    const schema = Joi.object({
      name:   Joi.string().max(50).required(),
      username:    Joi.string().alphanum().min(3).max(30).required(),
      email:       Joi.string().email().required(),
      password:    Joi.string().min(3).max(20).required(),
      dob:         Joi.date().iso().optional(),
      location:    Joi.string().max(100).optional()
    });

    const validationResult = schema.validate({ name, username, email, password, dob, location });
    const result = await userCollection.find({email: email}).project({email: 1}).toArray();

    if (validationResult.error != null) {
      console.log(validationResult.error);
      res.redirect("/signup");
      return;

      //if email is NOT already in registered, sign up
    } else if (result.length == 0) {
      var hashedPassword = await bcrypt.hash(password, saltRounds);
      const newUser = {
        name,
        username,
        email,
        hashedPassword,                
        dob:      dob ? new Date(dob) : undefined,
        location: location || '',
        bio:       '',
        avatarUrl: '/image/default-avatar.png',
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
    } else {
      res.redirect("/signup?error=email_in_use");
    }
}  catch (err) {
    console.error("Error in /submitUser:", err);
    return res.status(500).send("Oops—something went wrong.");
  }
});

// Login route
app.post('/loggingin', async (req,res) => {
  var email = req.body.email.toLowerCase();
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
    return;
  }

  const result = await userCollection.find({email: email}).project({email: 1, username: 1, hashedPassword: 1, _id: 1}).toArray();

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
    req.session.username = result[0].username;
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

app.get('/messages', (req, res) => {
  res.sendFile(path.join(__dirname, 'text', 'messages.html'));
});

app.get('/inside_messages', (req, res) => {
  res.sendFile(path.join(__dirname, 'text', 'inside_messages.html'));
});

app.get("/profile", function (req, res) {
    let doc = fs.readFileSync("./text/profile.html", "utf8");
    res.send(doc);
});

app.get('/profile/data', async (req, res) => {
  if (!req.session.authenticated) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const user = await userCollection.findOne(
      { _id: new ObjectId(req.session.userId) },
      { projection: { name: 1, email: 1, username: 1 } }
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (err) {
    console.error('Error fetching user data:', err);
    res.status(500).json({ error: 'Server error' });
  }
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

// global catch for searching users --global catch for users' posts in postroutes.js
app.get('/:username', async (req, res) => {
  const username = req.params.username;
  try {
    const user = await userCollection.findOne({ username: username });

    if (!user) {
      return res.status(404).render("404");
    }
    const posts = await postsCollection.find({ author: user._id }).toArray();

    // If it's your own profile
    if (username === req.session.username) {
      return res.render("userProfile", {user, posts});
    }

    // Someone else's profile
    return res.render("profile", { user , posts});
  } catch (err) {
    console.error("Error in /:username route:", err);
    return res.status(500).send("Server error occurred.");
  }
  });

// RUN SERVER
let port = 8000;
app.listen(port, function () {
    console.log("Example app listening on port " + port + "!");
});

app.use((req, res, next) => {
  // console.log(`Incoming request: ${req.method} ${req.url}`);
  next();
});