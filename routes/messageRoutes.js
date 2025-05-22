const express = require('express');
const { ObjectId } = require('mongodb');
const { db } = require('../databaseconnection');  
const router = express.Router();

router.post('/conversations', async (req, res) => {
  try {
    const me = new ObjectId(req.session.userId);
    const others = (req.body.participantIds || [])
      .map(id => new ObjectId(id))
      .filter(id => !id.equals(me));

    if (others.length < 1) {
      return res.status(400).json({ error: 'Need at least one other participant' });
    }
    const participants = [ me, ...others ];
    const existing = await db.collection('conversations').findOne({
      participants: { $all: participants, $size: participants.length }
    });
    if (existing) {
      return res.json({ conversationId: existing._id });
    }
    const conv = {
      participants,
      lastMessage: '',
      updatedAt: new Date(),
      deletedBy: [],
    };
    const { insertedId } = await db.collection('conversations').insertOne(conv);
    res.json({ conversationId: insertedId });

  } catch (err) {
    console.error('Failed to create conversation:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});


router.get('/conversations', async (req, res) => {
  const me = new ObjectId(req.session.userId);
  const convs = await db.collection('conversations').aggregate([
    { $match: {participants: me, deletedBy: {$ne: me}}},
    { $addFields: {
        otherIds: {
          $filter: {
            input: '$participants',
            cond: {$ne: ['$$this', me]}
          }
        }
      }
    },
    { $lookup: {
        from: 'users',
        localField: 'otherIds',
        foreignField: '_id',
        as: 'others'
      }
    },
    { $sort: { updatedAt: -1 } }
  ]).toArray();
  res.json(convs);
});

router.post('/conversations/:id/messages', async (req, res) => {
  const convoId  = new ObjectId(req.params.id);
  const senderId = new ObjectId(req.session.userId);
  const { text } = req.body;
  const msg = {
    conversation: convoId,
    sender:       senderId,
    text,
    readBy:       [senderId],
    createdAt:    new Date(),
  };
  await db.collection('messages').insertOne(msg);
  await db.collection('conversations').updateOne(
    { _id: convoId },
    {
      $set: {
        lastMessage: text,
        updatedAt: new Date(),
        deletedBy: []
      }
    }
  );
  res.json({ success: true });
});


router.get('/conversations/:id/messages', async (req, res) => {
  const convoId = new ObjectId(req.params.id);
  const messages = await db.collection('messages')
    .find({ conversation: convoId })
    .sort({ createdAt: 1 })
    .toArray();
  res.json(messages);
});

router.post('/conversations/:id/read', async (req, res) => {
  const convoId = new ObjectId(req.params.id);
  const me = new ObjectId(req.session.userId);
  await db.collection('messages').updateMany(
    { conversation: convoId, readBy: {$ne: me}},
    { $push: {readBy: me}}
  );
  res.json({success: true});
});

router.get('/notifications/messages', async (req, res) => {
  const me = new ObjectId(req.session.userId);
  const myConvs = await db.collection('conversations')
    .find({ participants: me, deletedBy: { $ne: me }})
    .project({ _id: 1 })
    .toArray();
  const convoIds = myConvs.map(c => c._id);
  const pipeline = [
    { $match: { conversation: {$in: convoIds}, readBy: {$ne: me}}},
    { $group: {_id: '$conversation', unreadCount: {$sum: 1 }}}
  ];
  const counts = await db.collection('messages').aggregate(pipeline).toArray();
  res.json(counts);
});

router.get('/users/search', async (req, res) => {
  const term = req.query.term;
  if (!term) return res.json([]);
  const regex = new RegExp(term, 'i');
  const users = await db.collection('users')
    .find({
      $or: [
        {username: regex},
        {email: regex},
        {name: regex}
      ]
    })
    .project({_id:1, username:1, name:1, avatarUrl:1})
    .toArray();
  res.json(users);
});

router.delete('/conversations/:id', async (req, res) => {
  const convoId = new ObjectId(req.params.id);
  const me = new ObjectId(req.session.userId);
  try {
    await db.collection('conversations').updateOne(
      {_id: convoId},
      {$addToSet: {deletedBy: me}}
    );
    const convo = await db.collection('conversations').findOne({_id: convoId});
    if (!convo) return res.json({success: true});
    if (convo.deletedBy.length >= convo.participants.length) {
      await Promise.all([
        db.collection('conversations').deleteOne({_id: convoId}),
        db.collection('messages').deleteMany({conversation: convoId})
      ]);
    }
    return res.json({success: true});
  } catch (err) {
    console.error('DELETE /conversations/:id', err);
    return res.status(500).json({error: 'Could not delete conversation'});
  }
});

router.get('/messages', async (req, res) => {
  try {
    const me = new ObjectId(req.session.userId);
    const convos = await db.collection('conversations').aggregate([
      { $match: { participants: me, deletedBy: { $ne: me } } },
      { $addFields: {
          otherIds: {
            $filter: { input: '$participants', cond: { $ne: ['$$this', me] } }
          }
        }
      },
      { $lookup: {
          from: 'users',
          localField: 'otherIds',
          foreignField: '_id',
          as: 'others'
        }
      },
      { $sort: { updatedAt: -1 } }
    ]).toArray();
    const convoIds = convos.map(c => c._id);
    const counts = await db.collection('messages').aggregate([
      { $match: { conversation: { $in: convoIds }, readBy: { $ne: me } } },
      { $group: { _id: '$conversation', unreadCount: { $sum: 1 } } }
    ]).toArray();
    const unreadMap = counts.reduce((m, c) => {
      m[c._id.toString()] = c.unreadCount;
      return m;
    }, {});
    const conversations = convos.map(conv => {
      const title = conv.others.length === 1
        ? conv.others[0].name
        : conv.others.map(u => u.name).join(', ');
      const updated = conv.updatedAt;
      let ts;
      const now = new Date();
      if (updated.toDateString() === now.toDateString()) {
        let h = updated.getHours(), m = updated.getMinutes();
        const ampm = h >= 12 ? 'pm' : 'am';
        h = h % 12 || 12;
        ts = `${h}:${String(m).padStart(2,'0')} ${ampm}`;
      } else {
        ts = `${String(updated.getMonth()+1).padStart(2,'0')}/` +
             `${String(updated.getDate()).padStart(2,'0')}/` +
             `${updated.getFullYear()}`;
      }
      return {
        _id:     conv._id,
        title,
        lastMsg: conv.lastMessage || '—',
        ts,
        unread:  unreadMap[conv._id.toString()] || 0,
        avatarUrl: conv.others[0].avatarUrl || '/img/default-avatar.png'
      };
    });
    res.render('messages', { conversations });
  } catch (err) {
    console.error('Failed to render /messages:', err);
    res.status(500).send('Server error');
  }
});

router.get('/inside_messages', async (req, res) => {
  const convoId = new ObjectId(req.query.conversationId);
  const convo = await db.collection('conversations').findOne({ _id: convoId });
  const others = await db.collection('users')
    .find({ _id: { $in: convo.participants.filter(id=>!id.equals(req.session.userId)) } })
    .toArray();
  const msgs = await db.collection('messages')
    .find({ conversation: convoId }).sort({ createdAt:1 }).toArray();
  res.render('inside_messages', {
    conversation: { ...convo, others },
    messages: msgs,
    currentUserId: req.session.userId
  });
});


module.exports = router;
