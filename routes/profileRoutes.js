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
        { projection: { hashedPassword: 0 } } 
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
  
  // Handle profile update
  router.post('/profile/update', async (req, res) => {
    try {
      // Check authentication
      if (!req.session.authenticated) {
        console.log("User not authenticated");
        return res.status(401).send("Please log in first");
      }
  
      console.log("Session userId:", req.session.userId);
      console.log("Request body:", req.body);
  
      // Extract form fields
      const { name, location, about } = req.body;
  
      // Validate input
      if (!name || !location || !about) {
        return res.status(400).send("Missing profile fields");
      }
  
      // Attempt MongoDB update
      const result = await userCollection.updateOne(
        { _id: new ObjectId(req.session.userId) },
        { $set: { name, location, bio: about } }
      );
  
      console.log("Mongo update result:", result);
  
      res.status(200).send("Profile updated");
    } catch (err) {
      console.error("Error in /profile/update:", err);
      res.status(500).send("Server error");
    }
  });
  
  
  
module.exports = router;