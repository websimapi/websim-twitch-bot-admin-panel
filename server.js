require('dotenv').config();
const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const tmi = require('tmi.js');
const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

// Serve static files
app.use(express.static(__dirname));

// Download endpoint with improved error handling
app.get('/download', (req, res) => {
  try {
    const output = fs.createWriteStream(path.join(__dirname, 'twitch-bot.zip'));
    const archive = archiver('zip', {
      zlib: { level: 9 }
    });

    output.on('close', function() {
      const zipPath = path.join(__dirname, 'twitch-bot.zip');
      res.download(zipPath, 'twitch-bot.zip', (err) => {
        if (err) {
          console.error('Download error:', err);
          res.status(500).send('Download failed');
        }
        // Clean up: delete the zip file after download
        fs.unlink(zipPath, (err) => {
          if (err) console.error('Error deleting zip:', err);
        });
      });
    });

    archive.on('error', function(err) {
      console.error('Archive error:', err);
      res.status(500).send('Archive creation failed');
    });

    archive.pipe(output);

    // Add files to the zip
    const filesToZip = [
      { name: 'package.json', path: './package.json' },
      { name: 'server.js', path: './server.js' },
      { name: 'client.js', path: './client.js' },
      { name: 'styles.css', path: './styles.css' },
      { name: 'index.html', path: './index.html' },
      { name: 'README.md', path: './README.md' },
      { name: '.env.example', path: './.env.example' }
    ];

    filesToZip.forEach(file => {
      if (fs.existsSync(file.path)) {
        archive.file(file.path, { name: file.name });
      }
    });

    archive.finalize();

  } catch (error) {
    console.error('Server error:', error);
    res.status(500).send('Server error occurred');
  }
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