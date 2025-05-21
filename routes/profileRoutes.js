const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

const { db } = require('../databaseconnection');
const { ObjectId } = require('mongodb');

const userCollection = db.collection('users');
const postCollection = db.collection('posts');

const readHTML = (filename) => {
  return fs.readFileSync(path.join(__dirname, '..', 'text', filename), 'utf8');
};

// ---------- Static HTML Routes ----------

// GET /profile
router.get('/profile', (req, res) => {
  res.send(readHTML('profile.html'));
});

// GET /editProfile
router.get('/editProfile', (req, res) => {
  res.send(readHTML('editProfile.html'));
});

// GET /followers
router.get('/followers', (req, res) => {
  res.send(readHTML('followers.html'));
});

// GET /following
router.get('/following', (req, res) => {
  res.send(readHTML('following.html'));
});


// code is giving me fat errors - Justin
// GET /post/:id (Serve post detail page)
// router.get('/post/:id', async (req, res) => {
//   try {
//     const post = await postCollection.findOne({ _id: new ObjectId(req.params.id) });
//     if (!post) return res.status(404).send('Post not found');
//     res.send(readHTML('postDetail.html'));
//   } catch (err) {
//     console.error('Error loading post page:', err);
//     res.status(500).send('Server error');
//   }
// });

// ---------- API Routes ----------

// GET /profile/data (User profile data + posts)
router.get('/profile/data', async (req, res) => {
  if (!req.session.authenticated) {
    return res.status(401).json({ error: 'Please log in first' });
  }

  try {
    const user = await userCollection.findOne(
      { _id: new ObjectId(req.session.userId) },
      { projection: { name: 1, email: 1, location: 1, bio: 1, avatarUrl: 1 } }
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const posts = await postCollection.find({ author: new ObjectId(req.session.userId) }).toArray();
    res.json({ user, posts });
  } catch (err) {
    console.error('Failed to fetch user profile:', err);
    res.status(500).json({ error: 'Server error' });
  }
});


// POST /profile/update (Update profile info)
router.post('/profile/update', async (req, res) => {
  if (!req.session.authenticated) {
    return res.status(401).send('Please log in first');
  }

  const { name, location, about, profileImage } = req.body;

  if (!name || !location || !about) {
    return res.status(400).send('Missing profile fields');
  }

  let avatarUrl = null;

  try {
    // Save Base64 image if provided
    if (profileImage && profileImage.startsWith('data:image/')) {
      const base64Data = profileImage.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');
      const fileName = `avatar_${Date.now()}.png`;
      const filePath = path.join(__dirname, '..', 'public', 'uploads', fileName);

      fs.writeFileSync(filePath, buffer);
      avatarUrl = `/uploads/${fileName}`;
    }

    const updateFields = {
      name,
      location,
      bio: about,
      ...(avatarUrl && { avatarUrl }),
    };

    const result = await userCollection.updateOne(
      { _id: new ObjectId(req.session.userId) },
      { $set: updateFields }
    );

    res.status(200).send('Profile updated');
  } catch (err) {
    console.error('Error in /profile/update:', err);
    res.status(500).send('Server error');
  }
});

// // Route edit post page
// router.get('/post/:id/edit',(req,res) =>{
//   res.send(readHTML('postEdit.html'));
// })
// // Route post detail page
// router.get('/post/:id', (req, res) => {
//   res.send(readHTML('postDetail.html')); 
// });


// GET /api/post/:id (Fetch single post)
router.get('/api/post/:id', async (req, res) => {
  try {
    const post = await postCollection.findOne({ _id: new ObjectId(req.params.id) });
    if (!post) return res.status(404).json({ error: 'Not found' });
    res.json(post);
  } catch (err) {
    console.error('Error fetching post:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/api/post/:id', async (req, res) => {
  try {
    const { title, text } = req.body;
    await postCollection.updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { title, text } }
    );
    res.status(200).send('Updated');
  } catch (err) {
    console.error('Error updating post:', err);
    res.status(500).send('Server error');
  }
});

// DELETE /api/post/:id (Delete post)
router.delete('/api/post/:id', async (req, res) => {
  try {
    const result = await postCollection.deleteOne({ _id: new ObjectId(req.params.id) });
    res.status(200).send('Deleted');
  } catch (err) {
    console.error('Error deleting post:', err);
    res.status(500).send('Server error');
  }
});

module.exports = router;
