const socket = io('ws://localhost:3000');
const botStatus = document.getElementById('botStatus');
const channelName = document.getElementById('channelName');
const logContainer = document.getElementById('logContainer');
const downloadBtn = document.querySelector('.download-btn');

downloadBtn.addEventListener('click', async (e) => {
  e.preventDefault();
  try {
    const response = await fetch('/download');
    if (!response.ok) throw new Error('Download failed');
    
    // Create blob from response and trigger download
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'twitch-bot.zip';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Download error:', error);
    alert('Download failed. Please try again.');
  }
});

socket.on('connect', () => {
  console.log('Connected to WebSocket server');
});

socket.on('botStatus', (status) => {
  botStatus.textContent = status;
  botStatus.className = status.toLowerCase();
});

socket.on('channelUpdate', (channel) => {
  channelName.textContent = channel;
});

socket.on('logMessage', (message) => {
  const logEntry = document.createElement('div');
  logEntry.className = 'log-entry';
  logEntry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
  logContainer.appendChild(logEntry);
  logContainer.scrollTop = logContainer.scrollHeight;
});

socket.on('disconnect', () => {
  botStatus.textContent = 'Disconnected';
  botStatus.className = 'disconnected';
  channelName.textContent = '-';
});