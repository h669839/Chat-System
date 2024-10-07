const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const { MongoClient, ObjectId } = require('mongodb');
const cors = require('cors');

const app = express();
const PORT = 3000;

// MongoDB setup
const client = new MongoClient('mongodb://localhost:27017');
let db;

async function connectToDB() {
    try {
        await client.connect();
        db = client.db('chat_system'); // Name of your database
        console.log('Connected to MongoDB');
    } catch (err) {
        console.error(err);
    }
}

connectToDB();

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());

// Utility functions to manage JSON files for users and groups
function readJSONFile(filename) {
    const filePath = path.join(__dirname, 'data', filename);
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
}

function writeJSONFile(filename, data) {
    const filePath = path.join(__dirname, 'data', filename);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

// Role-based access control middleware
function checkRole(allowedRoles) {
    return (req, res, next) => {
        const { username } = req.body;
        const users = readJSONFile('users.json');
        const user = users.find(u => u.username === username);

        if (!user) {
            return res.status(403).json({ ok: false, message: 'User not found' });
        }

        const hasRole = allowedRoles.some(role => user.roles.includes(role));
        if (!hasRole) {
            return res.status(403).json({ ok: false, message: 'Access denied' });
        }

        next();
    };
}

// ------------------- User Routes (JSON-based) -------------------

// Get all users
app.get('/users', (req, res) => {
    const users = readJSONFile('users.json');
    res.json(users);
});

// Create a new user (Only Super Admin)
app.post('/users', checkRole(['Super Admin']), (req, res) => {
    const users = readJSONFile('users.json');
    const newUser = req.body;

    // Ensure the username is unique
    const existingUser = users.find(u => u.username === newUser.username);
    if (existingUser) {
        return res.status(400).json({ ok: false, message: 'Username already exists' });
    }

    users.push(newUser);
    writeJSONFile('users.json', users);

    res.status(201).json({ ok: true, user: newUser });
});

// Delete a user (Only Super Admin)
app.delete('/users/:id', checkRole(['Super Admin']), (req, res) => {
    const users = readJSONFile('users.json');
    const userId = req.params.id;

    const updatedUsers = users.filter(user => user.id !== userId);
    if (updatedUsers.length === users.length) {
        return res.status(404).json({ ok: false, message: 'User not found' });
    }

    writeJSONFile('users.json', updatedUsers);
    res.json({ ok: true, message: 'User deleted' });
});

// ------------------- Group Routes (JSON-based) -------------------

// Get all groups
app.get('/groups', (req, res) => {
    const groups = readJSONFile('groups.json');
    res.json(groups);
});

// Create a new group (Only Super Admin)
app.post('/groups', checkRole(['Super Admin']), (req, res) => {
    const groups = readJSONFile('groups.json');
    const newGroup = req.body;

    // Ensure groupId is unique
    const existingGroup = groups.find(g => g.groupId === newGroup.groupId);
    if (existingGroup) {
        return res.status(400).json({ ok: false, message: 'Group ID already exists' });
    }

    groups.push(newGroup);
    writeJSONFile('groups.json', groups);

    res.status(201).json({ ok: true, group: newGroup });
});

// Delete a group (Only Super Admin)
app.delete('/groups/:groupId', checkRole(['Super Admin']), (req, res) => {
    const groups = readJSONFile('groups.json');
    const groupId = req.params.groupId;

    const updatedGroups = groups.filter(group => group.groupId !== groupId);
    if (updatedGroups.length === groups.length) {
        return res.status(404).json({ ok: false, message: 'Group not found' });
    }

    writeJSONFile('groups.json', updatedGroups);
    res.json({ ok: true, message: 'Group deleted' });
});

// ------------------- Channel and Messages Routes (MongoDB-based) -------------------

// Create a new channel for a group
app.post('/groups/:groupId/channels', checkRole(['Group Admin', 'Super Admin']), async (req, res) => {
    const { groupId } = req.params;
    const { channelName } = req.body;

    try {
        const groups = readJSONFile('groups.json');
        const group = groups.find(group => group.groupId === groupId);

        if (!group) {
            return res.status(404).json({ ok: false, message: 'Group not found' });
        }

        const newChannel = {
            channelName,
            groupId,
            users: [],
            messages: []
        };

        const result = await db.collection('channels').insertOne(newChannel);

        // Add the new channel to the group's channels in the JSON file
        group.channels.push(result.insertedId.toString());
        writeJSONFile('groups.json', groups);

        res.status(201).json({ ok: true, channel: result.ops[0] });
    } catch (err) {
        res.status(500).json({ ok: false, message: err.message });
    }
});

// Add a message to a channel
app.post('/channels/:channelId/messages', async (req, res) => {
    const { channelId } = req.params;
    const { sender, text } = req.body;

    try {
        const message = { sender, text, timestamp: new Date() };

        // Add the message to the channel's messages array in MongoDB
        await db.collection('channels').updateOne(
            { _id: new ObjectId(channelId) },
            { $push: { messages: message } }
        );

        res.status(201).json({ ok: true, message });
    } catch (err) {
        res.status(500).json({ ok: false, message: err.message });
    }
});

// Get messages for a specific channel
app.get('/channels/:channelId/messages', async (req, res) => {
    const { channelId } = req.params;

    try {
        const channel = await db.collection('channels').findOne({ _id: new ObjectId(channelId) });

        if (!channel) {
            return res.status(404).json({ ok: false, message: 'Channel not found' });
        }

        res.json({ ok: true, messages: channel.messages });
    } catch (err) {
        res.status(500).json({ ok: false, message: err.message });
    }
});

// ------------------- Server Initialization -------------------

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
