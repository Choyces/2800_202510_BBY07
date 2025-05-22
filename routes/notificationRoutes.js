const express       = require('express');
const router        = express.Router();
const path          = require('path');
const { ObjectId }  = require('mongodb');
const { db }        = require('../databaseconnection');
const notifications = db.collection('notifications');

function truncate(str, maxLen) {
  if (typeof str !== 'string') return '';
  return str.length > maxLen ? str.slice(0, maxLen) + '…' : str;
}

router.get('/notifications', async (req, res, next) => {
  if (!req.session.userId) {
    return res.redirect('/login');
  }
  try {
    const userId = new ObjectId(req.session.userId);
    const list = await notifications
      .find({ recipient: userId })
      .sort({ createdAt: -1 })
      .toArray();
    const now = new Date();
    const MS_PER_DAY = 1000*60*60*24;
    const notificationsWithDisplay = list.map(n => {
      const dt = (n.createdAt instanceof Date) ? n.createdAt : new Date(n.createdAt);
      const diffDays = Math.floor((now - dt) / MS_PER_DAY);
      let displayTime;

      if (diffDays === 0) {
        displayTime = dt.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit'
        });
      } 
      else if (diffDays <= 2) {
        displayTime = dt.toLocaleDateString('en-US', {
          weekday: 'long'
        });
      } 
      else {
        displayTime = dt.toLocaleDateString('en-US', {
          month: '2-digit',
          day: '2-digit',
          year: 'numeric'
        });
      }
      return { ...n, displayTime };
    });
    const formatted = notificationsWithDisplay.map(n => ({
      ...n,
      truncatedTitle: truncate(n.postTitle, 20),
      truncatedComment: n.type === 'comment' ? truncate(n.commentText || '', 40): ''
    }));
    const senderIds = [...new Set(formatted.map(n => n.sender.toString()))].map(id => new ObjectId(id));
    const senders = await db
      .collection('users')
      .find({ _id: { $in: senderIds } })
      .project({ avatarUrl: 1 })
      .toArray();
    const avatarMap = {};
    senders.forEach(u => {
      avatarMap[u._id.toString()] = u.avatarUrl || '/img/default-avatar.png';
    });
    const withAvatars = formatted.map(n => ({...n, senderAvatar: avatarMap[n.sender.toString()]}));
    res.render('notifications', { 
      notifications: withAvatars,
      currentUsername: req.session.username  
    });
  } catch (err) {
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
