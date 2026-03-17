// backend/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const db = require('./config/db');
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true
    }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Log environment
console.log('🚀 Server starting...');
console.log('📊 Database:', process.env.DB_NAME);
console.log('🌍 Environment:', process.env.NODE_ENV || 'development');

// Socket.io connection handling
const userSockets = new Map();

io.on('connection', (socket) => {
    console.log('🔌 New client connected:', socket.id);
    
    socket.on('authenticate', (userId) => {
        const userKey = String(userId);
        console.log(`🔐 User ${userKey} authenticated on socket ${socket.id}`);
        userSockets.set(userKey, socket.id);
        
        // Send any pending notifications
        sendPendingNotifications(userKey);
    });
    
    socket.on('disconnect', () => {
        console.log('❌ Client disconnected:', socket.id);
        // Remove from map
        for (let [userId, socketId] of userSockets.entries()) {
            if (socketId === socket.id) {
                userSockets.delete(userId);
                break;
            }
        }
    });
});

// Function to send real-time notification
const sendRealtimeNotification = (userId, notification) => {
    const socketId = userSockets.get(String(userId));
    if (socketId) {
        io.to(socketId).emit('notification', notification);
        console.log(`📨 Real-time notification sent to user ${String(userId)}`);
        return true;
    }
    return false;
};

// Function to send pending notifications
const sendPendingNotifications = async (userId) => {
    try {
        const Notification = require('./models/Notification');
        const userKey = String(userId);
        const unreadCount = await Notification.getUnreadCount(userKey);
        
        if (unreadCount > 0) {
            const notifications = await Notification.getUserNotifications(userKey, 5, 0);
            sendRealtimeNotification(userKey, {
                type: 'pending',
                count: unreadCount,
                notifications: notifications
            });
        }
    } catch (error) {
        console.error('Error sending pending notifications:', error);
    }
};

// Make io accessible to routes
app.set('io', io);
app.set('userSockets', userSockets);
app.set('sendRealtimeNotification', sendRealtimeNotification);

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/expenses', require('./routes/expenses'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/goals', require('./routes/goals'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/notifications', require('./routes/notifications'));

// Test database connection
db.getConnection()
    .then(() => console.log('✅ Database connected successfully'))
    .catch(err => console.error('❌ Database connection failed:', err));

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
});


// Export server utilities for other modules (especially for real-time notifications)
module.exports = {
    app,
    server,
    io,
    userSockets,
    sendRealtimeNotification,
    sendPendingNotifications
};