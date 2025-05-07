const express  = require('express');
const router   = express.Router();
const { ObjectId } = require('mongodb');
const { db }   = require('../databaseconnection');
const posts   = db.collection('posts'); 
const users      = db.collection('users');
const path    = require('path');

router.get('/makepost', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'text', 'makepost.html'));
});

router.post('/makepost', async (req, res) => {
  try {

    const userId = req.session.userId;
    if (!userId) return res.redirect('/login');

    const { title, description, photoUrl } = req.body;
    if (!title || !description) {
      return res.redirect('/makepost');
    }

    const now = new Date();
    const newPost = {
      author: new ObjectId(req.session.userId),             
      title,                                   
      text:      description,                  
      photoUrl:  photoUrl || null,
      comments: [],            
      stats: {
        commentCount: 0,                      
        likeCount:    0                        
      },
      createdAt: now,                          
      updatedAt: now
    };

    const insertResult = await posts.insertOne(newPost);
    const postId = insertResult.insertedId;

    await users.updateOne(
      { _id: new ObjectId(userId) },
      { $push: { posts: postId } }
    );
    res.redirect('/main');
  }
  catch (err) {
    console.error("Error inserting post:", err);
    res.status(500).send("Server error");
  }
});

module.exports = router;
