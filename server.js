require('dotenv').config();
const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const tmi = require('tmi.js');
const archiver = require('archiver');
const path = require('path');

// Serve static files
app.use(express.static(__dirname));

// Download endpoint
app.get('/download', (req, res) => {
  const archive = archiver('zip', {
    zlib: { level: 9 } // Maximum compression
  });

  res.attachment('twitch-bot.zip');
  archive.pipe(res);

  // Add project files to the zip
  const filesToZip = [
    'package.json',
    'server.js',
    'client.js',
    'styles.css',
    'index.html',
    'README.md',
    '.env.example' // We'll include this instead of .env
  ];

  filesToZip.forEach(file => {
    archive.file(file, { name: file });
  });

  archive.finalize();
});

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