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

//get EVERY posts data and stuff
router.get('/post/data', async (req, res) => {

  // I see no reason to make the website login only to use - Justin
  // if (!req.session.authenticated) {
  //   return res.status(401).json({ error: 'Please log in first' });
  // }

  try {
  const postsArray = await posts.find().project({author: 1, title: 1, text: 1, photoUrl: 1, comments: 1, createdAt: 1}).toArray();
    // this is gptd code to convert userid to username 
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

//get EVERY liked post by current logged in user
router.get('/post/liked', async (req, res) => {
  const userId = req.session.userId;
  if (!userId) {
    return res.status(401).json({ error: 'Please log in first' });
  }
  try {
  const postsArray = await posts.find().project({author: 1, title: 1, text: 1, photoUrl: 1, comments: 1, createdAt: 1}).toArray();
    // this is gptd code to convert userid to username 
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

router.post('/like/:postID', async (req, res) => {
  const userId = req.session.userId;
  const postId = req.params.postID;

  if (!userId) {
    return res.status(401).json({ success: false, message: 'Not logged in' });
  }
  const result = await posts.find({liked: userId}).project({}).toArray();
  if (result.length == 0) {
    try {
      // add to user's likes
      await users.updateOne(
        { _id: new ObjectId(userId) },
        { $addToSet: { likes: new ObjectId(postId) } })
      // add user to post's liked list
      await posts.updateOne(
        { _id: new ObjectId(postId) },
        { $addToSet: { liked: new ObjectId(userId) } }
      );
      // increment like count
      await posts.updateOne(
        { _id: new ObjectId(postId) },
        { $inc: { "stats.likes": 1 } }
      );

      // Create Like notification
      const postDoc = await posts.findOne({ _id: new ObjectId(postId) });
      await db.collection('notifications').insertOne({
        recipient:   postDoc.author,          
        sender:      new ObjectId(userId),    
        senderUsername: req.session.username,
        postId:      new ObjectId(postId),
        postTitle:   postDoc.title,
        type:        'like',
        read:        false,
        createdAt:   new Date()
      });

      return res.json({ success: true });
    } catch (err) {
      console.error("Error liking post:", err);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  }
  else {
    try {
      // remove from user's likes
      await users.updateOne(
        { _id: new ObjectId(userId) },
        { $pull: { likes: new ObjectId(postId) } }
      );
      // remove user from post's liked list
      await posts.updateOne(
        { _id: new ObjectId(postId) },
        { $pull: { liked: new ObjectId(userId) } }
      );
      // decrement like count
      await posts.updateOne(
        { _id: new ObjectId(postId) },
        { $inc: { "stats.likes": -1 } }
      );

      return res.json({ success: true });
    } catch (err) {
      console.error("Error unliking post:", err);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  }
});

router.post('/createComment/:postID', async (req, res) => {
  const userId = req.session.userId;
  const postId = req.params.postID;
  const comment = req.body.comment;

  if (!userId) {
    res.redirect('/login');
    return;
  }
  try {
    const commentData = {
      text: comment,
      userId: new ObjectId(userId),
      createdAt: new Date()
    };

    await posts.updateOne(
      { _id: new ObjectId(postId) },
      { $push: { comments: commentData } }
    );

    // Create comment notification
    const postDoc = await posts.findOne({ _id: new ObjectId(postId) });
    await db.collection('notifications').insertOne({
      recipient: postDoc.author,
      sender: new ObjectId(userId),
      senderUsername: req.session.username,
      postId: new ObjectId(postId),
      postTitle: postDoc.title,
      commentText: commentData.text,
      type: 'comment',
      read: false,
      createdAt: new Date()
    });

    console.log("commentData", commentData);
    console.log("comment added");

    return res.json({ success: true });
  } catch (err) {
    console.error("Error posting comment:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

// global catch for users' posts
router.get('/:username/post/:postID', async (req, res) => {
  const username = req.params.username;
  const postID = req.params.postID;

    const findUser = await users.find({username: username}).project({username: 1}).toArray();
    const postData = await posts.find({_id: new ObjectId(postID)}).project({
      author: 1, 
      title: 1, 
      text: 1, 
      photoUrl: 1, 
      comments: 1, 
      stats: 1,
      createdAt: 1}).toArray();
    if (findUser.length > 0 && postData.length > 0){

      const authorIds = [...new Set(postData.map(post => post.author))];
      const authors = await users.find({ _id: { $in: authorIds } })
        .project({ username: 1 })
        .toArray();
      const authorMap = {};
      authors.forEach(user => {
        authorMap[user._id.toString()] = user.username;
      });
      const postDataWithAuthor = postData.map(post => ({
        ...post,
        authorUsername: authorMap[post.author.toString()] || "Unknown"
      }));

      // comment code
      const comments = postDataWithAuthor[0].comments || [];
      const commentUserIds = [...new Set(comments.map(c => c.userId.toString()))];
      const commentUsers = await users.find({ _id: { $in: commentUserIds.map(id => new ObjectId(id)) } })
      .project({ username: 1 })
      .toArray();

      const commentUserMap = {};
      commentUsers.forEach(user => {
        commentUserMap[user._id.toString()] = user.username;
      });
        
        // increment view count
        await posts.updateOne(
          { _id: new ObjectId(postID) },
          { $inc: { "stats.views": 1 } }
        );
        
        //add this -qian
        const currentUserId = req.session.userId;
        const isAuthor = currentUserId && postDataWithAuthor[0].author.toString() === currentUserId;

        res.render("insidePost", {
          postID: postID.toString(),
          title: postDataWithAuthor[0].title,
          text: postDataWithAuthor[0].text,
          photoUrl: postDataWithAuthor[0].photoUrl,
          comments: postDataWithAuthor[0].comments,
          stats: postDataWithAuthor[0].stats,
          createdAt: postDataWithAuthor[0].createdAt,
          authorUsername: authorMap[postDataWithAuthor[0].author.toString()] || "Unknown",
          commentUserMap: commentUserMap,
          isAuthor: isAuthor
        });
      }
    else {
      res.render("404");
    }
});
  
module.exports = router;
