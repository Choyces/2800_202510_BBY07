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


router.get('/userProfile', async (req, res) => {
  if (!req.session.authenticated) {
    return res.redirect('/login'); 
  }

  try {
    const user = await userCollection.findOne(
      { _id: new ObjectId(req.session.userId) },
      { projection: { name: 1, email: 1, location: 1, bio: 1, avatarUrl: 1 } }
    );

    if (!user) {
      return res.status(404).send('User not found');
    }

    const posts = await postCollection.find({ author: new ObjectId(req.session.userId) }).toArray();

    res.render('userProfile', { user, posts }); 
  } catch (err) {
    console.error('Error rendering profile:', err);
    res.status(500).send('Server error');
  }
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

router.get('/post/:id', async (req, res) => {
  try {
    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).send('Invalid ID');
    }

    const post = await postCollection.findOne({ _id: new ObjectId(req.params.id) });
    if (!post) return res.status(404).send('Post not found');
    const currentUserId = req.session.user ? req.session.user._id : null;

    res.render('postDetail', { post:post, currentUserId:currentUserId ? currentUserId.toString() : null  });  
  } catch (err) {
    console.error('Error rendering post:', err);
    res.status(500).send('Server error');
  }
});

router.get('/profile', async (req, res) => {
  if (!req.session.authenticated) return res.redirect('/login');

  const userId = req.session.userId;
  try {
    const user = await userCollection.findOne({ _id: new ObjectId(userId) });
    const userPosts = await postCollection.find({ author: new ObjectId(userId) }).toArray();

    res.render('profile', { user, posts: userPosts });
  } catch (err) {
    console.error(err);
    res.status(500).send('error');
  }
});

//get username
// router.get('/profile/data', async (req, res) => {
//   if (!req.session.authenticated) {
//     return res.status(401).json({ error: 'Not authenticated' });
//   }

//   try {
//     const user = await userCollection.findOne(
//       { _id: new ObjectId(req.session.userId) },
//       { projection: { name: 1, email: 1 } } 
//     );

//     if (!user) {
//       return res.status(404).json({ error: 'User not found' });
//     }

//     res.json({ user });
//   } catch (err) {
//     console.error('Error fetching user data:', err);
//     res.status(500).json({ error: 'Server error' });
//   }
// });


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


router.get('/postEdit/:id/edit', async (req, res) => {
  try {
    const postId = req.params.id;
    if (!ObjectId.isValid(postId)) {
      return res.status(400).send('Invalid ID');
    }

    const post = await postCollection.findOne({ _id: new ObjectId(postId) });
    if (!post) return res.status(404).send('Post not found');

    if (post.author.toString() !== req.session.userId) {
      return res.status(403).send('Forbidden');
    }

    res.render('postEdit', { post });
  } catch (err) {
    console.error('Edit page error:', err);
    res.status(500).send('Server error');
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

router.delete('/api/post/:id', async (req, res) => {
  if (!req.session.authenticated) {
    return res.status(401).send('Unauthorized');
  }

  const postId = req.params.id;

  if (!ObjectId.isValid(postId)) {
    return res.status(400).send('Invalid post ID');
  }

  try {
    const post = await postCollection.findOne({ _id: new ObjectId(postId) });

    if (!post) {
      return res.status(404).send('Post not found');
    }

    if (post.author.toString() !== req.session.userId) {
      return res.status(403).send('Forbidden: You are not the author');
    }

    await postCollection.deleteOne({ _id: new ObjectId(postId) });

    res.status(200).send('Deleted');
  } catch (err) {
    console.error('Error deleting post:', err);
    res.status(500).send('Server error');
  }
});
module.exports = router;
