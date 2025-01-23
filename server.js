require('dotenv').config();
const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const tmi = require('tmi.js');
const archiver = require('archiver');

// Serve static files
app.use(express.static(__dirname));

// Project file templates
const projectFiles = {
  'package.json': JSON.stringify({
    "name": "twitch-bot",
    "version": "1.0.0",
    "description": "Twitch bot with admin panel",
    "main": "server.js",
    "scripts": {
      "start": "node server.js",
      "dev": "nodemon server.js"
    },
    "dependencies": {
      "dotenv": "^10.0.0",
      "express": "^4.17.1",
      "socket.io": "^4.5.1",
      "tmi.js": "^1.8.5"
    },
    "devDependencies": {
      "nodemon": "^2.0.15"
    }
  }, null, 2),

  'README.md': `# Twitch Bot with Admin Panel

A simple Twitch bot with a web-based admin panel for monitoring bot activity and channel messages.

## Features

- Real-time monitoring of bot connection status
- Live chat message display
- Basic command support (!hello)
- Web-based admin interface
- WebSocket-based real-time updates

## Prerequisites

- Node.js (v12 or higher)
- npm (Node Package Manager)
- A Twitch account for the bot
- Twitch OAuth token

## Setup

1. Clone or download this repository
2. Run \`npm install\` to install dependencies
3. Create a \`.env\` file with your Twitch bot credentials:
   - BOT_USERNAME=your_bot_username
   - OAUTH_TOKEN=oauth:your_oauth_token
   - CHANNEL_NAME=your_channel_name
   - PORT=3000
4. Run \`npm start\` to start the bot
5. Open http://localhost:3000 in your browser to access the admin panel`,

  'server.js': `require('dotenv').config();
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
  
  io.emit('logMessage', \`\${tags['display-name']}: \${message}\`);
  
  // Add your bot commands here
  if (message.toLowerCase() === '!hello') {
    twitchClient.say(channel, \`Hello @\${tags['display-name']}!\`);
    io.emit('logMessage', \`Bot responded to \${tags['display-name']}'s hello command\`);
  }
});

// Download endpoint
app.get('/download', (req, res) => {
  const archive = archiver('zip', {
    zlib: { level: 9 }
  });

  res.attachment('twitch-bot.zip');
  archive.pipe(res);

  // Add files to the archive from our templates
  for (const [filename, content] of Object.entries(projectFiles)) {
    archive.append(content, { name: filename });
  }

  archive.finalize();
});

// Start server
const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
  console.log(\`Server running on port \${PORT}\`);
});