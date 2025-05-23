const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

const { db } = require('../databaseconnection');
const { ObjectId } = require('mongodb');
const { v2: cloudinary }   = require('cloudinary');

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
      { projection: { name: 1, email: 1, location: 1, bio: 1, avatarUrl: 1, username: 1 } }
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

// follow
router.post('/follow/:targetUserId', async (req, res) => {
  const currentUserId = req.session.userId;
  const { targetUserId } = req.params;
  if (!currentUserId) {
    return res.status(401).json({ error: 'Please log in first' });
  }
  if (currentUserId === targetUserId) {
    return res.status(400).json({ error: "You can't follow yourself" });
  }

  try {
    const currentUser = await userCollection.findOne({ _id: new ObjectId(currentUserId) });
    const targetUser = await userCollection.findOne({ _id: new ObjectId(targetUserId) });

    if (!currentUser || !targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    const currentFollowing = currentUser.following || [];
    const targetFollowers = targetUser.followers || [];


    const alreadyFollowing = currentFollowing.some(id => id.toString() === targetUserId);

    if (alreadyFollowing) {
      const updatedFollowing = currentFollowing.filter(id => id.toString() !== targetUserId);
      const updatedFollowers = targetFollowers.filter(id => id.toString() !== currentUserId);


      await userCollection.updateOne(
        { _id: new ObjectId(currentUserId) },
        { $set: { following: updatedFollowing } }
      );
      await userCollection.updateOne(
        { _id: new ObjectId(targetUserId) },
        { $set: { followers: updatedFollowers } }
      );

      return res.json({ success: true, following: false });
    } else {
      currentFollowing.push(new ObjectId(targetUserId));
      targetFollowers.push(new ObjectId(currentUserId));

      await userCollection.updateOne(
        { _id: new ObjectId(currentUserId) },
        { $set: { following: currentFollowing } }
      );
      await userCollection.updateOne(
        { _id: new ObjectId(targetUserId) },
        { $set: { followers: targetFollowers } }
      );

      return res.json({ success: true, following: true });
    }

  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
});


// GET /post/:id (Serve post detail page)
router.get('/yourposts/:id', async (req, res) => {
  try {
    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).send('Invalid ID');
    }

    const post = await postCollection.findOne({ _id: new ObjectId(req.params.id) });
    if (!post) return res.status(404).send('Post not found');
    const currentUserId = req.session.userId || null;

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
    if (profileImage && profileImage.startsWith('data:image/')) {
      const uploadResult = await cloudinary.uploader.upload(profileImage, {
        folder:    'user-avatars',               
        public_id: `avatar_${Date.now()}`        
      });
      avatarUrl = uploadResult.secure_url;      
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
