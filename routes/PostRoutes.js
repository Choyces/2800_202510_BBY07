const express  = require('express');
const router   = express.Router();
const { ObjectId } = require('mongodb');
const { db }   = require('../databaseconnection');
const posts   = db.collection('posts'); 
const users      = db.collection('users');
const path    = require('path');
const multer = require('multer');

const storage = multer.diskStorage({
  destination: (req, file, cb) =>
    cb(null, path.join(__dirname, '..', 'public', 'uploads')),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + ext);
  }
});
const upload = multer({ storage });


router.get('/makepost', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'text', 'makepost.html'));
});

router.post('/makepost', upload.single('photo'),     
  async (req, res) => {
    try {
      const userId = req.session.userId;
      if (!userId) return res.redirect('/login');

      const { title, description } = req.body;
      if (!title || !description) {
        return res.redirect('/makepost');
      }

      const photoUrl = req.file ? `/uploads/${req.file.filename}` : null;

      const now = new Date();
      const newPost = {
        author:   new ObjectId(userId),
        title,
        text:     description,
        photoUrl,             
        comments: [],
        stats: {
          views: 0,
          commentCount: 0,
          likeCount:    0
        },
        createdAt: now,
        updatedAt: now
      };

      const insertResult = await posts.insertOne(newPost);
      await users.updateOne(
        { _id: new ObjectId(userId) },
        { $push: { posts: insertResult.insertedId } }
      );
      res.redirect('/main');
    } catch (err) {
      console.error(err);
      res.status(500).send('Server error');
    }
  }
);

//get post data and stuff
router.get('/post/data', async (req, res) => {
  // I see no reason to make the website login only to use - Justin
  // if (!req.session.authenticated) {
  //   return res.status(401).json({ error: 'Please log in first' });
  // }

  try {
  const postsArray = await posts.find().project({author: 1, title: 1, text: 1, photoUrl: 1, comments: 1, createdAt: 1}).toArray();
    // this is gptd code xd
    const authorIds = [...new Set(postsArray.map(post => post.author))];
    const authors = await users.find({ _id: { $in: authorIds } })
      .project({ username: 1 })
      .toArray();
      const authorMap = {};
      authors.forEach(user => {
      authorMap[user._id.toString()] = user.username;
    });
    const postData = postsArray.map(post => ({
      ...post,
      authorUsername: authorMap[post.author.toString()] || "Unknown"
    }));

    res.json(postData);
    }
    catch (err) {
    console.error("error with post data:", err);
    res.status(500).json({ error: 'Server error' });
  }
});

// global catch for users' posts
router.get('/:username/post/:postID', async (req, res) => {
  const username = req.params.username;
  const postID = req.params.postID;

    const findUser = await users.find({username: username}).project({username: 1}).toArray();
    if (findUser.length > 0){
      const findPost = await posts.find({_id: postID}).project({title: 1}).toArray();
      res.render("insidePost", {username: username, postID: postID});
    }  
    // if no such user exists
    else { 
      res.render("404");
   }
});
  
module.exports = router;
