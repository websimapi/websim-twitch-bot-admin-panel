const socket = io('ws://localhost:3000');
const botStatus = document.getElementById('botStatus');
const channelName = document.getElementById('channelName');
const logContainer = document.getElementById('logContainer');

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