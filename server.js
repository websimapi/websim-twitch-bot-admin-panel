require('dotenv').config();
const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const tmi = require('tmi.js');

// Serve static files
app.use(express.static(__dirname));

// Twitch bot configuration
const twitchClient = new tmi.Client({
  options: { debug: true },
  identity: {
    username: process.env.BOT_USERNAME,
    password: process.env.OAUTH_TOKEN
  },
  channels: [process.env.CHANNEL_NAME]
});

// Connect to Twitch
twitchClient.connect().catch(console.error);

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log('Admin panel connected');
  
  // Send initial status
  socket.emit('botStatus', twitchClient.readyState() === 'OPEN' ? 'Connected' : 'Disconnected');
  socket.emit('channelUpdate', process.env.CHANNEL_NAME);
});

// Twitch bot events
twitchClient.on('connected', () => {
  io.emit('botStatus', 'Connected');
  io.emit('logMessage', 'Bot connected to Twitch');
});

twitchClient.on('disconnected', () => {
  io.emit('botStatus', 'Disconnected');
  io.emit('logMessage', 'Bot disconnected from Twitch');
});

twitchClient.on('message', (channel, tags, message, self) => {
  if (self) return; // Ignore messages from the bot
  
  io.emit('logMessage', `${tags['display-name']}: ${message}`);
  
  // Add your bot commands here
  if (message.toLowerCase() === '!hello') {
    twitchClient.say(channel, `Hello @${tags['display-name']}!`);
    io.emit('logMessage', `Bot responded to ${tags['display-name']}'s hello command`);
  }
});

// Start server
const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});