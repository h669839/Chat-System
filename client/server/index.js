const express = require('express');
const app = express();
const cors = require('cors');
const fs = require('fs');
const http = require('http').Server(app);
const { MongoClient } = require('mongodb');
const port = 3000;
const io = require('socket.io')(http, {
  cors: {
    origin: "http://localhost:4200",  // Allow connections from your Angular app (adjust port if needed)
    methods: ["GET", "POST"],
  },
});

// MongoDB Setup
const client = new MongoClient('mongodb://localhost:27017');
let db, channelsCollection;
const sockets = require('./socket.js');
const server = require('./listen.js');

async function connectToDB() {
  try {
    await client.connect();
    db = client.db('chat_system'); // Name of your database
    channelsCollection = db.collection('channels'); // Name of your collection
    sockets.connect(io, port, channelsCollection);
    server.listen(http, port);
    console.log('Connected to MongoDB');
  } catch (err) {
    console.error(err);
  }
}

connectToDB();

app.use(cors());
app.use(express.json()); // To handle JSON payloads



// Load users and groups from JSON files
function readUsersFromFile() {
  const userData = fs.readFileSync('users.json');
  return JSON.parse(userData);
}

function readGroupsFromFile() {
  const groupsData = fs.readFileSync('groups.json');
  return JSON.parse(groupsData);
}

function writeJSONFile(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

const groups = readGroupsFromFile();
const users = readUsersFromFile();

// Basic route to check if the server is running
app.get('/', (req, res) => {
  res.send('Chat system backend is running');
});

// --- USER ROUTES ---

// Login route
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username && u.password === password);

  if (user) {
    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } else {
    res.status(401).json({ ok: false, message: 'Invalid credentials' });
  }
});

// Route to create a new user
app.post('/users', (req, res) => {
  const { username, email, role } = req.body;
  const existingUser = users.find(u => u.username === username);

  if (existingUser) {
    return res.json({ ok: false, message: 'Username already exists' });
  }

  const newUser = {
    id: (users.length + 1).toString(),
    username,
    email,
    password: 'default_password', // Initial password
    roles: [role],
    groups: []
  };

  users.push(newUser);
  writeJSONFile('./users.json', users); // Write new user to users.json

  res.json({ ok: true, user: newUser });
});

// Route to delete a user
app.delete('/users/:id', (req, res) => {
  const userId = req.params.id;
  const userIndex = users.findIndex(u => u.id === userId);

  if (userIndex !== -1) {
    const deletedUser = users.splice(userIndex, 1);
    writeJSONFile('./users.json', users); // Write updated users to users.json
    res.json({ ok: true, user: deletedUser });
  } else {
    res.json({ ok: false, message: 'User not found' });
  }
});

// --- GROUP ROUTES ---
// Route to return groups the user(s) are a part of
app.get('/groups', (req, res) => {
  const { username } = req.query;

  // Log the username to check if it is being passed correctly
  console.log('Received username:', username);

  // Find the user from the users array
  const user = users.find(u => u.username === username);

  // Log the found user or the failure
  if (!user) {
    console.log('User not found:', username);
    return res.status(404).json({ ok: false, message: 'User not found' });
  }

  // Log the user's roles
  console.log('User found:', user);
  
  // If the user is a Super Admin, return all groups
  if (user.roles.includes('Super Admin')) {
    console.log('Super Admin, returning all groups');
    return res.json(groups);
  } else {
    // Otherwise, return only groups that the user belongs to
    const userGroups = groups.filter(group => user.groups.includes(group.groupId));
    console.log('Returning user groups:', userGroups);
    return res.json(userGroups);
  }
});

// Route to create a new group
app.post('/group', (req, res) => {
  const { name, admin } = req.body;

  const newGroup = {
    groupId: (groups.length + 1).toString(),
    name,
    admins: [admin],
    channels: []
  };

  groups.push(newGroup);
  writeJSONFile('./groups.json', groups); // Write new group to groups.json

  res.json({ ok: true, group: newGroup });
});

// Add a user to a group (Super Admins can add to any group)
app.post('/groups/:groupId/users', (req, res) => {
  const { groupId } = req.params;
  const { username } = req.body;
  
  const group = groups.find(g => g.groupId === groupId);
  if (!group) {
    return res.status(404).json({ ok: false, message: 'Group not found' });
  }

  const user = users.find(u => u.username === username);
  if (!user) {
    return res.status(404).json({ ok: false, message: 'User not found' });
  }

  // Allow Super Admins to add users to any group
  const adminUser = users.find(u => u.username === req.body.admin && (u.roles.includes('Group Admin') || u.roles.includes('Super Admin')));
  if (!adminUser) {
    return res.status(403).json({ ok: false, message: 'Only Group Admins or Super Admins can add users to a group.' });
  }

  if (!user.groups.includes(groupId)) {
    user.groups.push(groupId);
    writeJSONFile('./users.json', users); // Update users.json
    res.json({ ok: true, message: `User ${username} added to the group.` });
  } else {
    res.status(400).json({ ok: false, message: 'User already in the group' });
  }
});


// Route to remove a user from a group
app.delete('/groups/:groupId/users/:username', (req, res) => {
  const { groupId, username } = req.params;
  
  const user = users.find(u => u.username === username);
  if (!user) {
    return res.status(404).json({ ok: false, message: 'User not found' });
  }

  user.groups = user.groups.filter(gId => gId !== groupId);
  writeJSONFile('./users.json', users); // Update users.json
  res.json({ ok: true, message: `User ${username} removed from the group.` });
});

// --- CHANNEL ROUTES (MongoDB) ---

// Route to create a new channel for a specific group
app.post('/channels', async (req, res) => {
  const { groupId, channelName } = req.body;

  // Fetch groups from groups.json to check if the group exists
  const group = groups.find(g => g.groupId === groupId);

  if (!group) {
    return res.status(404).json({ ok: false, message: 'Group not found' });
  }

  // Count the number of channels
  channelsCollection.countDocuments({}, (err, count) => {
    if (err) {
      return res.status(500).json({ ok: false, message: 'Failed to count channels' });
    }

    // Calculate the new channelId based on count
    const newChannelId = count + 1;

  // Create the new channel object
  const newChannel = {
    channelId: newChannelId,
    channelName,
    groupId,
    users: [],
    messages:[],
  };
    // Insert the new channel into MongoDB
    channelsCollection.insertOne(newChannel, (err, result) => {
      if (err) {
        return res.status(500).json({ ok: false, message: 'Failed to create channel' });
      }
    // Update groups.json to add the channel to the group (depends on how you manage groups.json)
    group.channels.push(newChannelId);
    writeJSONFile('./groups.json', groups);
    res.json({ ok: true, channel: result.ops[0] });
    });
  });
});

// Route to get channels for a group
app.get('/groups/:groupId/channels', async (req, res) => {
  const { groupId } = req.params;

  if (!channelsCollection) {
    return res.status(500).json({ ok: false, message: 'Channels collection is not initialized.' });
  }
  
  const group = groups.find(g => g.groupId === groupId);
  if (!group) {
    return res.status(404).json({ ok: false, message: 'Group not found.' });
  }

  const channelIds = group.channels;
  if (!channelIds || channelIds.length === 0) {
    return res.status(404).json({ ok: false, message: 'No channels found in this group.' });
  }
  console.log("Channel Id's: " + channelIds);

  try {
    // Query the channels collection in MongoDB using the channelIds
    const channels = await channelsCollection.find({ channelId: { $in: channelIds } }).toArray();
    
    // If no channels are found
    if (!channels || channels.length === 0) {
      return res.status(404).json({ ok: false, message: 'No channels found for this group' });
    }

    // Return the found channels
    return res.json({ ok: true, channels });
  } catch (err) {
    console.error("Error retrieving channels:", err);
    return res.status(500).json({ ok: false, message: 'Failed to retrieve channels' });
  }
});

// Add a user to the channel
app.post('/groups/:groupId/channels/:channelId/users', (req, res) => {
  const { groupId, channelId } = req.params;
  const { username } = req.body;

  channelsCollection.findOne({ channelId: parseInt(channelId), groupId }, (err, channel) => {
    if (err || !channel) {
      return res.status(404).json({ ok: false, message: 'Channel not found' });
    }

    if (!channel.users.includes(username)) {
      channel.users.push(username);
      channelsCollection.updateOne({ channelId: parseInt(channelId) }, { $set: { users: channel.users } }, (err) => {
        if (err) {
          return res.status(500).json({ ok: false, message: 'Failed to update channel' });
        }
        res.json({ ok: true, channel });
      });
    } else {
      res.status(400).json({ ok: false, message: 'User already in channel' });
    }
  });
});

// Remove a user from a channel
app.delete('/groups/:groupId/channels/:channelId/users/:username', (req, res) => {
  const { groupId, channelId, username } = req.params;

  channelsCollection.findOne({ channelId: parseInt(channelId), groupId }, (err, channel) => {
    if (err || !channel) {
      return res.status(404).json({ ok: false, message: 'Channel not found' });
    }

    channel.users = channel.users.filter(user => user !== username);
    channelsCollection.updateOne({ channelId: parseInt(channelId) }, { $set: { users: channel.users } }, (err) => {
      if (err) {
        return res.status(500).json({ ok: false, message: 'Failed to update channel' });
      }
      res.json({ ok: true, channel });
    });
  });
});

// Post a new message to a channel
app.post('/channels/:channelId/messages', (req, res) => {
  const { channelId } = req.params;
  const { sender, text } = req.body;
  
  const newMessage = {
    sender,
    text,
    timestamp: new Date().toISOString()
  };

  channelsCollection.updateOne(
    { channelId: parseInt(channelId)},
    { $push: { messages: newMessage } }, // Push the new message to the messages array
    (err) => {
      if (err) {
        return res.status(500).json({ ok: false, message: 'Failed to send message' });
      }
      res.json({ ok: true, message: newMessage });
    }
  );
});

// Get messages for a specific channel
app.get('/channels/:channelId/messages', async (req, res) => {
  const { channelId } = req.params;

  try {
    const channel = await channelsCollection.findOne({ channelId: parseInt(channelId) });

    if (!channel) {
      return res.status(404).json({ ok: false, message: 'Channel not found' });
    }

    res.json({ ok: true, messages: channel.messages || [] });
  } catch (error) {
    console.error('Failed to load messages:', error);
    res.status(500).json({ ok: false, message: 'Failed to load messages' });
  }
});

// Delete a channel by `channelId`
app.delete('/groups/:groupId/channels/:channelId', (req, res) => {
  const { groupId, channelId } = req.params;

  channelsCollection.deleteOne({ channelId: parseInt(channelId), groupId }, (err, result) => {
    if (err || result.deletedCount === 0) {
      return res.status(404).json({ ok: false, message: 'Channel not found' });
    }

    // Update groups.json to remove the channel from the group's channels array
    const groups = readGroupsFromFile();
    const group = groups.find(g => g.groupId === groupId);
    if (group) {
      group.channels = group.channels.filter(c => c !== parseInt(channelId));
      writeJSONFile('./groups.json', groups);
    }

    res.json({ ok: true });
  });
});
