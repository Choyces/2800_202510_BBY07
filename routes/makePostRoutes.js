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


module.exports = router;
