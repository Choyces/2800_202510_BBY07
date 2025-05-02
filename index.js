require('dotenv').config()
console.log(process.env.MONGODB_USER);
const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://${process.env.MONGODB_USER}:${process.env.MONGODB_PASSWORD}@cluster0.ztyzxn3.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
console.log("URI:", uri);

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    await client.close();
  }
}
run().catch(console.dir);
console.log("URI:", uri);


// REQUIRES
const express = require("express");
const app = express();
app.use(express.json());
const fs = require("fs");

// just like a simple web server like Apache web server
// we are mapping file system paths to the app's virtual paths
app.use("/js", express.static("./scripts"));
app.use("/css", express.static("./styles"));
app.use("/img", express.static("./image"));

app.get("/", function(req, res) {
    //console.log(process.env);
    // retrieve and send an HTML document from the file system
    let doc = fs.readFileSync("./index.html", "utf8");
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
