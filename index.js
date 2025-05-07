require('dotenv').config()
const fs = require('fs');
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
var {database} = require('./databaseconnection');

const userCollection = database.db(mongodb_database).collection('users');


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
  var email = req.body.email;
  var password = req.body.password;

const schema = Joi.object(
  {
    email: Joi.string().max(20).required(),
    password: Joi.string().max(20).required()
  });

const validationResult = schema.validate({email, password});
if (validationResult.error != null) {
   console.log(validationResult.error);
   
   res.redirect("/signup");
   return;
 }

  var hashedPassword = await bcrypt.hash(password, saltRounds);

await userCollection.insertOne({email: email, password: hashedPassword});
console.log("Inserted user");

  var html = `
  successfully created user!!!!
      <form action="/login">
      <input type="submit" value="login" />
  </form>
  `;
  res.send(html);
});

// Login route
app.post('/loggingin', async (req,res) => {
  var email = req.body.email;
  var password = req.body.password;

const schema = Joi.string().max(20).required();
const validationResult = schema.validate(email);
if (validationResult.error != null) {
   console.log(validationResult.error);
     var html = `
      Invalid email/password combination
      <a href="/login"> try again </a>
     `;
     res.send(html);
   return;
}

const result = await userCollection.find({email: email}).project({email: 1, password: 1, _id: 1}).toArray();

console.log(result);
if (result.length != 1) {
      var html = `
      User not found
      <a href="/login"> try again </a>
     `;
     res.send(html);
  return;
}
if (await bcrypt.compare(password, result[0].password)) {
  console.log("correct password");
  req.session.authenticated = true;
  req.session.email = email;
  req.session.cookie.maxAge = expireTime;

  res.redirect('/main');
  return;
}
else {
      var html = `
      Invalid password
      <a href="/login"> try again </a>
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
