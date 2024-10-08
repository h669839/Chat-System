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

// Route to get all the users
app.get('/users', (req,res) => {
  res.json(users);
})

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
    password: 'password', // Initial password
    roles: [role],
    groups: [],
    ok: true,
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

  const adminUser = users.find(u => u.username === admin);
  if (!adminUser) {
    return res.status(404).json({ ok: false, message: 'Admin not found' });
  }

  // Find all Super Admins
  const superAdmins = users
    .filter(user => user.roles.includes('Super Admin'))
    .map(user => user.username); // Get the usernames of all Super Admins

  const newGroup = {
    groupId: (groups.length + 1).toString(),
    name,
    admins: [admin, ...superAdmins],
    channels: []
  };

  groups.push(newGroup);

   // Add the newly created group to the admin's groups array if not already present
   if (!adminUser.groups.includes(newGroup.groupId)) {
    adminUser.groups.push(newGroup.groupId);
  }

  // Write changes to groups.json and users.json
  writeJSONFile('./groups.json', groups);
  writeJSONFile('./users.json', users);

  res.json({ ok: true, group: newGroup });
});

// Add a user to a group (Super Admins or Group Admins can add users to their group)
app.post('/groups/:groupId/users', (req, res) => {
  const { groupId } = req.params;
  const { username, admin } = req.body; // Expecting the admin (the person who is trying to add the user)

  const group = groups.find(g => g.groupId === groupId);
  if (!group) {
    return res.status(404).json({ ok: false, message: 'Group not found' });
  }

  const user = users.find(u => u.username === username);
  if (!user) {
    return res.status(404).json({ ok: false, message: 'User not found' });
  }

  // Check if the user performing the action is a Super Admin or Group Admin
  const adminUser = users.find(u => u.username === admin && (u.roles.includes('Group Admin') || u.roles.includes('Super Admin')));
  if (!adminUser) {
    return res.status(403).json({ ok: false, message: 'Only Group Admins or Super Admins can add users to a group.' });
  }

  // Check if the user is already in the group
  if (!user.groups.includes(groupId)) {
    user.groups.push(groupId);
    writeJSONFile('./users.json', users); // Update users.json with the new group added for the user
    return res.json({ ok: true, message: `User ${username} added to the group successfully.` });
  } else {
    return res.status(400).json({ ok: false, message: 'User is already in the group.' });
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

  // Log the incoming data
  console.log('Creating channel for group:', groupId, 'with name:', channelName);

  // Fetch groups from groups.json to check if the group exists
  const group = groups.find(g => g.groupId === groupId);

  if (!group) {
    return res.status(404).json({ ok: false, message: 'Group not found' });
  }

  try {
    // Create a new channelId based on the number of channels already in the database
    const newChannelId = (await channelsCollection.countDocuments()) + 1;

    const newChannel = {
      channelId: newChannelId,
      channelName,
      groupId,
      users: [], // Initialize with no users
      messages: [] // Initialize with no messages
    };

    // Insert the new channel into the channels collection
    await channelsCollection.insertOne(newChannel);

    // Add the channelId to the group's channel list
    group.channels.push(newChannelId);
    writeJSONFile('./groups.json', groups); // Update groups.json with the new channel

    res.json({ ok: true, channel: newChannel });
  } catch (error) {
    console.error('Error while creating channel:', error);
    res.status(500).json({ ok: false, message: 'Failed to create the channel.' });
  };
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
    // No channels found, but this is not an error – return an empty array
    return res.json({ ok: true, channels: [] });
  }

  try {
    // Query the channels collection in MongoDB using the channelIds
    const channels = await channelsCollection.find({ channelId: { $in: channelIds } }).toArray();
    
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
