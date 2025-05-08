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

