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
    const {value: convo} = await db
      .collection('conversations')
      .findOneAndUpdate(
        {_id: convoId},
        {$addToSet: { deletedBy: me}},
        {returnDocument: 'after'}
      );
    if (!convo) return res.json({success: true});
    if (convo.deletedBy.length >= convo.participants.length) {
      await Promise.all([
        db.collection('conversations').deleteOne({_id: convoId}),
        db.collection('messages').deleteMany({conversation: convoId})
      ]);
    }
    return res.json({success: true});
  } catch (err) {
    console.error('💥 DELETE /conversations/:id', err);
    return res.status(500).json({error: 'Could not delete conversation'});
  }
});

module.exports = router;
