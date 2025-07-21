import express from 'express';

const app = express();
const PORT = 3333;

app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Simple server is working' });
});

const server = app.listen(PORT, () => {
  console.log(`✅ Simple server running on port ${PORT}`);
  console.log(`🔗 Test: http://localhost:${PORT}/health`);
});

server.on('error', (err) => {
  console.error('❌ Server error:', err);
});

server.on('listening', () => {
  const addr = server.address();
  console.log('🎯 Server actually listening on:', addr);
});