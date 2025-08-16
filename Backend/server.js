// server.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const { configureCloudinary, testCloudinaryConnection } = require('./config/cloudinary');

dotenv.config();

// ----- DB -----
connectDB();

// ----- Cloudinary -----
if (configureCloudinary()) {
  testCloudinaryConnection().then(isConnected => {
    if (isConnected) console.log('🚀 Cloudinary ready for image uploads');
    else console.warn('⚠️ Cloudinary connection failed - image uploads may not work');
  });
} else {
  console.warn('⚠️ Cloudinary not configured - image uploads will not work');
}

const app = express();

// ----- Middleware -----
const corsOptions = {
  origin: ["http://127.0.0.1:5500", "http://localhost:5500"], // your frontend origins
  credentials: true,
};
app.use(cors(corsOptions));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// request log
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path} - ${new Date().toISOString()}`);
  next();
});

// ----- Routes -----
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/food', require('./routes/foodRoutes'));
app.use('/api/chat', require('./routes/chatRoutes')); // ok to keep even if unused

app.get('/api/health', (req, res) => {
  res.json({
    message: 'Wasteless API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Wasteless API',
    version: '1.0.0',
    endpoints: { users: '/api/users', food: '/api/food', chat: '/api/chat', health: '/api/health' }
  });
});

// ----- Errors -----
app.use((err, req, res, next) => {
  console.error('Error:', err);

  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(val => val.message);
    return res.status(400).json({ message: messages.join(', ') });
  }
  if (err.name === 'CastError') {
    return res.status(400).json({ message: 'Invalid ID format' });
  }
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json({ message: `${field} already exists` });
  }
  res.status(500).json({ message: 'Server error' });
});

// 404
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// ===== Socket.IO on the SAME server =====
const http = require('http');
const { Server } = require('socket.io');
const httpServer = http.createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: ["http://127.0.0.1:5500", "http://localhost:5500"],
    credentials: true
  }
});

// Ephemeral in-memory rooms (NO DB)
const rooms = new Map(); // roomId -> { messages: [{userId, text, ts}], last }
const MAX_MESSAGES = 50;
const ROOM_TTL_MS = 60 * 60 * 1000;

function getRoom(roomId) {
  let r = rooms.get(roomId);
  if (!r) { r = { messages: [], last: Date.now() }; rooms.set(roomId, r); }
  r.last = Date.now();
  return r;
}

setInterval(() => {
  const now = Date.now();
  for (const [id, r] of rooms.entries()) {
    if (now - r.last > ROOM_TTL_MS) rooms.delete(id);
  }
}, 5 * 60 * 1000);

io.on('connection', (socket) => {
  console.log('🧲 socket connected', socket.id);

  socket.on('join', ({ roomId, userId, name }) => {
    if (!roomId) return;
    socket.join(roomId);
    const room = getRoom(roomId);
    socket.emit('history', room.messages);
  });

  socket.on('message', ({ roomId, userId, text }) => {
    if (!roomId || !text) return;
    const room = getRoom(roomId);
    const msg = { userId, text: String(text).slice(0,1000), ts: Date.now() };
    room.messages.push(msg);
    if (room.messages.length > MAX_MESSAGES) room.messages.shift();
    socket.emit('message', msg);
    socket.to(roomId).emit('message', msg);
  });

  socket.on('disconnect', () => {
    console.log('🔌 socket disconnected', socket.id);
  });
});

// ===== Start ONE server (do NOT use app.listen) =====
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`API URL: http://localhost:${PORT}`);
});

// ----- Process guards -----
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  process.exit(1);
});
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});
