const express = require('express');
const cors = require('cors');
const app = express();
const port = 3000;

app.use(cors());
app.use(express.json()); // To handle JSON payloads

// Placeholder user data
let users = [
    { username: 'super', password: '123', id: '1', roles: ['Super Admin', 'User'], groups: ['1'], ok: true},
    { username: 'gAdmin', password: '456', id: '2', roles: ['Group Admin', 'User'], groups: ['2'], ok: true },
    { username: 'user1', password: '789', id: '3', roles: ['User'], groups: ['1', '2'], ok: true },
    { username: 'user2', password: '987', id: '4', roles: ['User'], groups: ['1'], ok: true },
    { username: 'user3', password: '654', id: '5', roles: ['User'], groups: [], ok: true }
];

// Placeholder group, channel and messages data
let groups = [
    { groupId: '1', name: 'Group 1', admins: ['super'], channels: ['1'] },
    { groupId: '2', name: 'Group 2', admins: ['gAdmin'], channels: ['2'] }
];
let channels = [
    { channelId: '1', channelName: 'General', groupId: '1', users: ['super', 'user1'] },
    { channelId: '2', channelName: 'Random', groupId: '2', users: ['gAdmin', 'user1'] }
];
let messages = [
    { channelId: '1', messages: [{ sender: 'user1', text: 'Hello from user1!' }] },
    { channelId: '2', messages: [{ sender: 'user2', text: 'Hello from user2!' }] }
];

let interestRequests = []; // Store interest requests

// Basic route to check if the server is running
app.get('/', (req, res) => {
    res.send('Chat system backend is running');
});

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

// Get all users (for Admin use)
app.get('/users', (req, res) => {
    res.json(users);
  });

// Get all groups (for Admin use)
app.get('/groups', (req,res) => {
    res.json(groups);
});

// Get all channels (for Admin use)
app.get('/channels', (req,res) => {
    res.json(channels);
});
// Route to create a new user (Super Admin only)
app.post('/users', (req, res) => {
    const { username, email, role } = req.body;
    const existingUser = users.find(u => u.username === username);

    if (existingUser) {
        res.json({ ok: false, message: 'Username already exists' });
    } else {
        const newUser = {
            id: (users.length + 1).toString(),
            username,
            email,
            password: 'default_password', // Initial password, which could be changed later
            roles: [role],
            groups: []
        };
        users.push(newUser);
        res.json({ ok: true, user: newUser });
    }
});

// Route to delete a user (Super Admin only)
app.delete('/users/:id', (req, res) => {
    const userId = req.params.id;
    const userIndex = users.findIndex(u => u.id === userId);

    if (userIndex !== -1) {
        const deletedUser = users.splice(userIndex, 1);
        res.json({ ok: true, user: deletedUser });
    } else {
        res.json({ ok: false, message: 'User not found' });
    }
});

// Route to promote a user to Super Admin (Super Admin only)
app.post('/users/:id/promote', (req, res) => {
    const userId = req.params.id;
    const { role } = req.body;

    const user = users.find(u => u.id === userId);
    if (!user) {
        return res.status(404).json({ ok: false, message: 'User not found' });
    }

    if (!user.roles.includes(role)) {
        user.roles.push(role);
        res.json({ ok: true, user });
    } else {
        res.status(400).json({ ok: false, message: 'User already has this role' });
    }
});

// Route to demote a user to Super Admin (Super Admin only)
app.post('/users/:id/demote', (req, res) => {
    const userId = req.params.id;
    const { role } = req.body;

    const user = users.find(u => u.id === userId);
    if (!user) {
        return res.status(404).json({ ok: false, message: 'User not found' });
    }

    user.roles = user.roles.filter(r => r !== role);
    res.json({ ok: true, user });
});


// Route to promote a user to a Group Admin (Super Admin only)
app.post('/groups/:groupId/promote', (req, res) => {
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

    if (!group.admins.includes(username)) {
        group.admins.push(username);
        user.groups.push(groupId); // Ensure the user is a member of the group if not already

        if (!user.roles.includes('Group Admin')) {
            user.roles.push('Group Admin');
        }

        res.json({ ok: true, group, user });
    } else {
        res.status(400).json({ ok: false, message: 'User is already an admin for this group' });
    }
});

// Route to demote a user to a Group Admin (Super Admin only)
app.post('/groups/:groupId/demote', (req, res) => {
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

    group.admins = group.admins.filter(admin => admin !== username);

    // Remove the Group Admin role if the user is not an admin of any other groups
    const isStillGroupAdmin = groups.some(g => g.admins.includes(username));
    if (!isStillGroupAdmin) {
        user.roles = user.roles.filter(role => role !== 'Group Admin');
    }

    res.json({ ok: true, group, user });
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
    res.json({ ok: true, group: newGroup });
});

// Route to add a user to a group
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

    if (!user.groups.includes(groupId)) {
        user.groups.push(groupId);
        res.json({ ok: true, user, group });
    } else {
        res.status(400).json({ ok: false, message: 'User already in the group' });
    }
});

// Route to remove a user from a group
app.delete('/groups/:groupId/users/:username', (req, res) => {
    const { groupId, username } = req.params;

    const group = groups.find(g => g.groupId === groupId);
    if (!group) {
        return res.status(404).json({ ok: false, message: 'Group not found' });
    }

    const user = users.find(u => u.username === username);
    if (!user) {
        return res.status(404).json({ ok: false, message: 'User not found' });
    }

    user.groups = user.groups.filter(gId => gId !== groupId);
    res.json({ ok: true, group });
});

// Route to create a new channel within a group
app.post('/channels', (req, res) => {
    const { groupId, channelName } = req.body;
    const group = groups.find(g => g.groupId === groupId);

    if (group) {
        const newChannel = {
            channelId: (channels.length + 1).toString(),
            channelName,
            groupId,
            users: []
        };
        channels.push(newChannel);
        group.channels.push(channelName);
        res.json({ ok: true, channel: newChannel, group });
    } else {
        res.json({ ok: false, message: 'Group not found' });
    }
});

// Route to add a user to a channel
app.post('/groups/:groupId/channels/:channelId/users', (req, res) => {
    const { groupId, channelId } = req.params;
    const { username } = req.body;

    const group = groups.find(g => g.groupId === groupId);
    if (!group) {
        return res.status(404).json({ ok: false, message: 'Group not found' });
    }

    const channel = channels.find(c => c.channelId === channelId);
    if (!channel || channel.groupId !== groupId) {
        return res.status(404).json({ ok: false, message: 'Channel not found' });
    }

    const user = users.find(u => u.username === username);
    if (!user) {
        return res.status(404).json({ ok: false, message: 'User not found' });
    }

    if (!channel.users.includes(username)) {
        channel.users.push(username);
        res.json({ ok: true, channel, user});
    } else {
        res.status(400).json({ ok: false, message: 'User already in the channel' });
    }
});

// Route to remove a user from a channel
app.delete('/groups/:groupId/channels/:channelId/users/:username', (req, res) => {
    const { groupId, channelId, username } = req.params;

    const group = groups.find(g => g.groupId === groupId);
    if (!group) {
        return res.status(404).json({ ok: false, message: 'Group not found' });
    }

    const channel = channels.find(c => c.channelId === channelId);
    if (!channel || channel.groupId !== groupId) {
        return res.status(404).json({ ok: false, message: 'Channel not found' });
    }

    channel.users = channel.users.filter(u => u !== username);
    res.json({ ok: true, channel });
});

// Route to delete a group (Super Admin only)
app.delete('/groups/:groupId', (req, res) => {
    const { groupId } = req.params;

    const groupIndex = groups.findIndex(g => g.groupId === groupId);
    if (groupIndex === -1) {
        return res.status(404).json({ ok: false, message: 'Group not found' });
    }

    groups.splice(groupIndex, 1);
    res.json({ ok: true,  message: 'Group deleted successfully' });
});

// Route to delete a channel
app.delete('/groups/:groupId/channels/:channelId', (req, res) => {
    const { groupId, channelId } = req.params;

    const group = groups.find(g => g.groupId === groupId);
    if (!group) {
        return res.status(404).json({ ok: false, message: 'Group not found' });
    }

    const channelIndex = channels.findIndex(c => c.channelId === channelId && c.groupId === groupId);
    if (channelIndex === -1) {
        return res.status(404).json({ ok: false, message: 'Channel not found' });
    }

    channels.splice(channelIndex, 1);
    group.channels = group.channels.filter(cId => cId !== channelId);
    res.json({ ok: true, message: 'Channel deleted successfully' });
});

// Getting messages for a Channel
app.get('/channels/:channelId/messages', (req, res) => {
    const { channelId } = req.params;
    const channelMessages = messages.find(m => m.channelId === channelId);

    if (!channelMessages) {
        return res.status(404).json({ ok: false, message: 'Channel not found or no messages yet.' });
    }

    res.json({ ok: true, messages: channelMessages.messages });
});

//Sending a message to a Channel
app.post('/channels/:channelId/messages', (req, res) => {
    const { channelId } = req.params;
    const { sender, text } = req.body;

    let channelMessages = messages.find(m => m.channelId === channelId);
    if (!channelMessages) {
        channelMessages = { channelId, messages: [] };
        messages.push(channelMessages);
    }

    const newMessage = { sender, text };
    channelMessages.messages.push(newMessage);

    res.json({ ok: true, message: newMessage });
});

// Route to get all users in a specific group
app.get('/groups/:groupId/users', (req, res) => {
    const { groupId } = req.params;

    const group = groups.find(g => g.groupId === groupId);
    if (!group) {
        return res.status(404).json({ ok: false, message: 'Group not found' });
    }

    // Find all users who are members of this group
    const groupUsers = users.filter(u => u.groups.includes(groupId));

    res.json({ ok: true, users: groupUsers });
});

// Route to register interest in a group
app.post('/groups/:groupId/interest', (req, res) => {
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

    // Check if the user has already registered interest
    const existingRequest = interestRequests.find(req => req.groupId === groupId && req.username === username);
    if (existingRequest) {
        return res.status(400).json({ ok: false, message: 'You have already registered interest in this group.' });
    }

    // Register the interest
    interestRequests.push({ groupId, username, status: 'pending' });
    res.json({ ok: true, message: 'Interest registered successfully.' });
});

// Route to get interest requests for a specific group (Group Admin only)
app.get('/groups/:groupId/interest-requests', (req, res) => {
    const { groupId } = req.params;

    const group = groups.find(g => g.groupId === groupId);
    if (!group) {
        return res.status(404).json({ ok: false, message: 'Group not found' });
    }

    const groupRequests = interestRequests.filter(req => req.groupId === groupId && req.status === 'pending');
    res.json({ ok: true, requests: groupRequests });
});

// Route to accept an interest request (Group Admin only)
app.post('/groups/:groupId/interest-requests/:username/accept', (req, res) => {
    const { groupId, username } = req.params;

    const request = interestRequests.find(req => req.groupId === groupId && req.username === username && req.status === 'pending');
    if (!request) {
        return res.status(404).json({ ok: false, message: 'Request not found.' });
    }

    // Accept the request
    request.status = 'accepted';

    const user = users.find(u => u.username === username);
    if (user) {
        user.groups.push(groupId); // Add user to the group
    }

    res.json({ ok: true, message: 'Request accepted.' });
});

// Route to deny an interest request (Group Admin only)
app.post('/groups/:groupId/interest-requests/:username/deny', (req, res) => {
    const { groupId, username } = req.params;

    const request = interestRequests.find(req => req.groupId === groupId && req.username === username && req.status === 'pending');
    if (!request) {
        return res.status(404).json({ ok: false, message: 'Request not found.' });
    }

    // Deny the request
    request.status = 'denied';

    res.json({ ok: true, message: 'Request denied.' });
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
