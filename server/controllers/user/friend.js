/**
 * @swagger
 * /api/users/search:
 *   get:
 *     summary: Search for users by username or email
 *     tags: [User]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query (username or email)
 *     responses:
 *       200:
 *         description: List of users matching search criteria
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Not authenticated
 *
 * /api/users/friends:
 *   get:
 *     summary: Get user's friends
 *     tags: [User]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: List of user's friends
 *       401:
 *         description: Not authenticated
 *
 * /api/users/friends/requests:
 *   get:
 *     summary: Get user's friend requests
 *     tags: [User]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: List of user's friend requests
 *       401:
 *         description: Not authenticated
 *
 *   post:
 *     summary: Send a friend request
 *     tags: [User]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               usernameOrEmail:
 *                 type: string
 *                 description: Username or email of user to send request to
 *     responses:
 *       200:
 *         description: Friend request sent successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: User not found
 *       409:
 *         description: Friend request already exists
 *
 * /api/users/friends/requests/{requestId}:
 *   put:
 *     summary: Accept or reject a friend request
 *     tags: [User]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: requestId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the friend request
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [accepted, rejected]
 *                 description: New status of the friend request
 *     responses:
 *       200:
 *         description: Friend request updated successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized to update this request
 *       404:
 *         description: Friend request not found
 */
const User = require('../../models/User');
const Friend = require('../../models/Friend');
const Chat = require('../../models/Chat');
const logger = require('../../util/logger');
const mongoose = require('mongoose');

// Search for users by username or email
const searchUsers = async (req, res) => {
  try {
    const { q } = req.query;
    const userId = req.user.userId;

    if (!q || q.length < 3) {
      return res.status(400).json({
        message: 'Search query must be at least 3 characters',
        error: true
      });
    }

    // Search for users matching the query (excluding the current user)
    const users = await User.find({
      $and: [
        { _id: { $ne: userId } },
        {
          $or: [
            { username: { $regex: q, $options: 'i' } },
            { email: { $regex: q, $options: 'i' } }
          ]
        }
      ]
    }).select('_id username email avatarUrl');

    res.json(users);
  } catch (error) {
    logger(error.message, 5);
    res.status(500).json({ message: 'Server error', error: true });
  }
};

// Get list of user's friends
const getFriends = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Find all accepted friend relationships where the user is either the requester or recipient
    const friends = await Friend.find({
      $or: [
        { requester: userId, status: 'accepted' },
        { recipient: userId, status: 'accepted' }
      ]
    }).populate('requester recipient', '_id username email avatarUrl');

    // Transform the data to return just the friend objects
    const friendsList = friends.map(friend => {
      return friend.requester._id.toString() === userId 
        ? friend.recipient 
        : friend.requester;
    });

    res.json(friendsList);
  } catch (error) {
    logger(error.message, 5);
    res.status(500).json({ message: 'Server error', error: true });
  }
};

// Get friend requests (both sent and received)
const getFriendRequests = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Find all pending friend requests where the user is either the requester or recipient
    const requests = await Friend.find({
      $or: [
        { requester: userId, status: 'pending' },
        { recipient: userId, status: 'pending' }
      ]
    }).populate('requester recipient', '_id username email avatarUrl');

    // Separate sent and received requests
    const sentRequests = requests.filter(req => 
      req.requester._id.toString() === userId
    );
    
    const receivedRequests = requests.filter(req => 
      req.recipient._id.toString() === userId
    );

    res.json({
      sent: sentRequests,
      received: receivedRequests
    });
  } catch (error) {
    logger(error.message, 5);
    res.status(500).json({ message: 'Server error', error: true });
  }
};

// Send a friend request
const sendFriendRequest = async (req, res) => {
  try {
    const { usernameOrEmail } = req.body;
    const requesterId = req.user.userId;

    if (!usernameOrEmail) {
      return res.status(400).json({
        message: 'Username or email is required',
        error: true
      });
    }

    // Find the recipient user
    const recipient = await User.findOne({
      $or: [
        { username: usernameOrEmail },
        { email: usernameOrEmail }
      ]
    });

    if (!recipient) {
      return res.status(404).json({
        message: 'User not found',
        error: true
      });
    }

    // Cannot send friend request to yourself
    if (recipient._id.toString() === requesterId) {
      return res.status(400).json({
        message: 'Cannot send friend request to yourself',
        error: true
      });
    }

    // Check if a friend request already exists
    const existingRequest = await Friend.findOne({
      $or: [
        { requester: requesterId, recipient: recipient._id },
        { requester: recipient._id, recipient: requesterId }
      ]
    });

    if (existingRequest) {
      if (existingRequest.status === 'accepted') {
        return res.status(409).json({
          message: 'Already friends with this user',
          error: true
        });
      } else if (existingRequest.status === 'pending') {
        if (existingRequest.requester.toString() === requesterId) {
          return res.status(409).json({
            message: 'Friend request already sent',
            error: true
          });
        } else {
          return res.status(409).json({
            message: 'This user has already sent you a friend request',
            error: true,
            incomingRequest: true,
            requestId: existingRequest._id
          });
        }
      } else if (existingRequest.status === 'rejected') {
        // Update the rejected request to pending if it was previously rejected
        existingRequest.status = 'pending';
        existingRequest.requester = requesterId;
        existingRequest.recipient = recipient._id;
        await existingRequest.save();
        
        return res.status(200).json({
          message: 'Friend request sent',
          error: false,
          request: existingRequest
        });
      }
    }

    // Create a new friend request
    const friendRequest = new Friend({
      requester: requesterId,
      recipient: recipient._id,
      status: 'pending'
    });

    await friendRequest.save();
    
    // Emit socket event if socket handler is available
    const socketHandler = req.app.get('socketHandler');
    if (socketHandler && socketHandler.emitFriendRequest) {
      socketHandler.emitFriendRequest(friendRequest);
    }

    return res.status(201).json({
      message: 'Friend request sent',
      error: false,
      request: await Friend.findById(friendRequest._id)
        .populate('requester recipient', '_id username email avatarUrl')
    });
  } catch (error) {
    logger(error.message, 5);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(409).json({
        message: 'Friend request already exists',
        error: true
      });
    }
    
    res.status(500).json({ message: 'Server error', error: true });
  }
};

// Accept or reject a friend request
const updateFriendRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { status } = req.body;
    const userId = req.user.userId;

    if (!status || !['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({
        message: 'Invalid status',
        error: true
      });
    }

    // Find the friend request
    const friendRequest = await Friend.findById(requestId)
      .populate('requester recipient', '_id username email avatarUrl');

    if (!friendRequest) {
      return res.status(404).json({
        message: 'Friend request not found',
        error: true
      });
    }

    // Check if the user is the recipient of the request
    if (friendRequest.recipient._id.toString() !== userId) {
      return res.status(403).json({
        message: 'Not authorized to update this request',
        error: true
      });
    }

    // Update the request status
    friendRequest.status = status;
    await friendRequest.save();
    
    // Emit socket event if socket handler is available
    const socketHandler = req.app.get('socketHandler');
    if (socketHandler && socketHandler.emitFriendRequestUpdate) {
      socketHandler.emitFriendRequestUpdate(friendRequest);
    }

    // If accepted, create a private chat between the users if one doesn't exist
    if (status === 'accepted') {
      const existingChat = await Chat.findOne({
        type: 'private',
        participants: { 
          $all: [friendRequest.requester._id, friendRequest.recipient._id],
          $size: 2
        }
      });

      if (!existingChat) {
        const newChat = new Chat({
          participants: [friendRequest.requester._id, friendRequest.recipient._id],
          type: 'private',
          createdBy: friendRequest.recipient._id
        });

        await newChat.save();
      }
    }

    return res.status(200).json({
      message: `Friend request ${status}`,
      error: false,
      request: friendRequest
    });
  } catch (error) {
    logger(error.message, 5);
    res.status(500).json({ message: 'Server error', error: true });
  }
};

module.exports = {
  searchUsers,
  getFriends,
  getFriendRequests,
  sendFriendRequest,
  updateFriendRequest
};