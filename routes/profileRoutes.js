const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

// GET /profile
router.get('/profile', (req, res) => {
    const doc = fs.readFileSync(path.join(__dirname, '..', 'text', 'profile.html'), 'utf8');
    res.send(doc);
});

// GET /editProfile
router.get('/editProfile', (req, res) => {
    const doc = fs.readFileSync(path.join(__dirname, '..', 'text', 'editProfile.html'), 'utf8');
    res.send(doc);
});

//GET /followers
router.get('/followers', (req, res) => {
  const doc = fs.readFileSync(path.join(__dirname, '..', 'text', 'followers.html'), 'utf8');
  res.send(doc);
});

//GET /following
router.get('/following', (req, res) => {
  const doc = fs.readFileSync(path.join(__dirname, '..', 'text', 'following.html'), 'utf8');
  res.send(doc);
});


const { db } = require('../databaseconnection');
const { ObjectId } = require('mongodb');

const userCollection = db.collection('users');

// get user info
router.get('/profile/data', async (req, res) => {
    if (!req.session.authenticated) {
      return res.status(401).json({ error: 'Please log in first' });
    }
  
    try {
      const user = await userCollection.findOne(
        { _id: new ObjectId(req.session.userId) },
        {
          projection: {
            name: 1,
            email: 1,
            location: 1,
            bio: 1,
            avatarUrl: 1
          }
        }
      );
  
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
  
      res.json(user);
    } catch (err) {
      console.error("Failed to fetch user profile:", err);
      res.status(500).json({ error: 'Server error' });
    }
  });
  
  router.post('/profile/update', async (req, res) => {
    try {
      if (!req.session.authenticated) {
        console.log("User not authenticated");
        return res.status(401).send("Please log in first");
      }
  
      const { name, location, about, profileImage } = req.body;
  
      // Validate required fields
      if (!name || !location || !about) {
        return res.status(400).send("Missing profile fields");
      }
  
      let avatarUrl = null;
  
      // save Base64 image
      if (profileImage && profileImage.startsWith('data:image/')) {
        const base64Data = profileImage.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');
        const fileName = `avatar_${Date.now()}.png`;
        const filePath = path.join(__dirname, '..', 'public', 'uploads', fileName);
  
        fs.writeFileSync(filePath, buffer);
        avatarUrl = `/uploads/${fileName}`; 
  
        console.log("Saved image to", filePath);
      }
  
      // create the fields to be updated
      const updateFields = {
        name,
        location,
        bio: about,
      };
  
      if (avatarUrl) {
        updateFields.avatarUrl = avatarUrl;
      }
  
      const result = await userCollection.updateOne(
        { _id: new ObjectId(req.session.userId) },
        { $set: updateFields }
      );
  
      console.log("Mongo update result:", result);
  
      res.status(200).send("Profile updated");
    } catch (err) {
      console.error("Error in /profile/update:", err);
      res.status(500).send("Server error");
    }
  });
  
module.exports = router;