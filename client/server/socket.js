module.exports = {
    connect: function(io, port, channelsCollection) {
        io.on('connection', (socket) => {
            console.log('user connection on port '- port + ' : ' + socket.id0);

            // Handle the 'newMessage' event
            socket.on('newMessage', async (message) => {
                console.log(`Message received in channel ${message.channelId}:`, message);
              
                // Find the channel and store the message
                try {
                  const channelId = message.channelId;
              
                  const channel = await channelsCollection.findOne({ channelId: parseInt(channelId) });
                  if (!channel) {
                    console.error('Channel not found:', channelId);
                    return;
                  }
              
                  // Add the message to the channel's messages array
                  const newMessage = {
                    text: message.text,
                    sender: message.sender,
                    timestamp: new Date().toISOString()
                  };
              
                  await channelsCollection.updateOne(
                    { channelId: parseInt(channelId) },
                    { $push: { messages: newMessage } }  // Push the new message to the messages array
                  );
              
                  // Emit the message to all users in the channel
                  io.to(channelId).emit('message', newMessage);
                } catch (error) {
                  console.error('Failed to store message:', error);
                }
              });

        // Handle users joining channels
        socket.on('joinChannel', (channelId, username) => {
            socket.join(channelId);
            console.log(`${username} joined channel ${channelId}`);
            io.to(channelId).emit('message', {
                text: `${username} has joined the channel.`,
                sender: 'System',
                timestamp: new Date().toISOString()
            });
        });

        // Handle users leaving channels
        socket.on('leaveChannel', (channelId, username) => {
            socket.leave(channelId);
            console.log(`${username} left channel ${channelId}`);
            io.to(channelId).emit('message', {
                text: `${username} has left the channel.`,
                sender: 'System',
                timestamp: new Date().toISOString()
            });
        });

        socket.on('disconnect', () => {
            console.log('User disconnected:', socket.id);
        });
        });
    }
}