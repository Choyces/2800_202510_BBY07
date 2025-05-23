const express = require('express');
const router = express.Router();
const { ObjectId } = require('mongodb');
const { db } = require('../databaseconnection');
const posts = db.collection('posts'); 
const users = db.collection('users');
const path = require('path');
const { v2: cloudinary } = require('cloudinary');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

cloudinary.config({
  cloud_name:    process.env.CLOUDINARY_CLOUD_NAME,
  api_key:       process.env.CLOUDINARY_API_KEY,
  api_secret:    process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder:    'my-app-uploads',                          
    public_id: (req, file) => Date.now() + path.extname(file.originalname),
    format:    async (req, file) => file.mimetype.split('/')[1] 
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

      const photoUrl = req.file ? req.file.path : null;

      const now = new Date();
      const newPost = {
        author: new ObjectId(userId),
        title,
        text: description,
        photoUrl,             
        comments: [],
        stats: {
          views: 0,
          commentCount: 0,
          likeCount: 0
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

// GET /post/liked to fetch all posts the current user has liked
router.get('/post/liked', async (req, res) => {
  const userId = req.session.userId;
  if (!userId) {
    return res.status(401).json({ error: 'Please log in first' });
  }

  try {
    const user = await users.findOne({ _id: new ObjectId(userId) });
    const likedPosts = user.likes || [];
    const likedPostsData = await posts.find({ _id: { $in: likedPosts } })
      .project({ _id: 1 }) 
      .toArray();

    res.json(likedPostsData); 
  } catch (err) {
    console.error("Error fetching liked posts:", err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /like/:postID for liking and unliking

router.post('/like/:postID', async (req, res) => {
  const userId = req.session.userId;
  const { postID } = req.params;

  console.log("Incoming like request:");
  console.log("Session userId:", userId);
  console.log("Post ID:", postID);

  if (!userId) {
    console.log("Unauthorized: No user session");
    return res.status(401).json({ error: 'Please log in first' });
  }

  try {
    const user = await users.findOne({ _id: new ObjectId(userId) });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const likedPosts = user.likes || [];
    const alreadyLiked = likedPosts.some(id => id.toString() === postID);

    if (alreadyLiked) {
    const updatedLikes = likedPosts.filter(id => new ObjectId(id).toString() !== postID);
      await users.updateOne(
        { _id: new ObjectId(userId) },
        { $set: { likes: updatedLikes } }
      );
      return res.json({ success: true, liked: false });

    } else {
      likedPosts.push(new ObjectId(postID));
      await users.updateOne(
        { _id: new ObjectId(userId) },
        { $set: { likes: likedPosts } }
      );

      return res.json({ success: true, liked: true });
    }
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
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

router.get('/api/posts/search', async (req, res) => {
  const { q } = req.query;
  if (!q) {
    return res.json([]); 
  }

  try {
    const postsArray = await posts.find({
      title: { $regex: q, $options: 'i' } 
    })
    .project({ author: 1, title: 1, text: 1, photoUrl: 1, createdAt: 1 })
    .toArray();
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
  } catch (err) {
    console.error("Search error:", err);
    res.status(500).json({ error: "Server error" });
  }
});
//delete route
router.delete('/posts/:id', async (req, res) => {
  const postId = req.params.id;

  if (!ObjectId.isValid(postId)) {
    return res.status(400).send('Invalid post ID');
  }

  try {
    const result = await posts.deleteOne({ _id: new ObjectId(postId) });
    if (result.deletedCount === 0) {
      return res.status(404).send('Post not found');
    }
    res.status(200).send('Post deleted');
  } catch (err) {
    console.error('Error deleting post:', err);
    res.status(500).send('Server error');
  }
});

module.exports = router;
