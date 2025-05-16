const express       = require('express');
const router        = express.Router();
const path          = require('path');
const { ObjectId }  = require('mongodb');
const { db }        = require('../databaseconnection');
const notifications = db.collection('notifications');

router.get('/notifications', (req, res) => {
  if (!req.session.userId) {
    return res.redirect('/login');
  }
  res.sendFile(path.join(__dirname, '..', 'public', 'notifications.html'));
});

router.get('/notifications/data', async (req, res, next) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json([]);
    }
    const userId = new ObjectId(req.session.userId);
    const list = await notifications
      .find({ recipient: userId })
      .sort({ createdAt: -1 })
      .toArray();
    res.json(list);
  }
  catch (err) {
    next(err);
  }
});

router.get('/notifications/count', async (req, res, next) => {
  try {
    if (!req.session.userId) {
      return res.json({ unreadCount: 0 });
    }
    const userId = new ObjectId(req.session.userId);
    const count  = await notifications.countDocuments({
      recipient: userId,
      read:      false
    });
    res.json({ unreadCount: count });
  }
  catch (err) {
    next(err);
  }
});

router.post('/notifications/:id/read', async (req, res, next) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    const nid = new ObjectId(req.params.id);
    await notifications.updateOne(
      { _id: nid, recipient: new ObjectId(req.session.userId) },
      { $set: { read: true } }
    );
    res.json({ success: true });
  }
  catch (err) {
    next(err);
  }
});

router.post('/notifications/readAll', async (req, res, next) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    const userId = new ObjectId(req.session.userId);
    await notifications.updateMany(
      { recipient: userId, read: false },
      { $set: { read: true } }
    );
    res.json({ success: true });
  }
  catch (err) {
    next(err);
  }
});


module.exports = router;
