# 🎥 WebRTC Video Calling Application 🎥

## 📱 Overview

This project is a modern web-based video calling application built with WebRTC technology, React.js, and Socket.IO. It enables real-time peer-to-peer video conferencing directly in your browser without requiring any additional plugins or software installations.

## ✨ Features

- 🔄 Real-time video & audio communication
- 💻 Screen sharing functionality
- 👥 Multiple participant support
- 🎛️ Audio mute/unmute controls
- 📹 Video on/off toggle
- 🔗 Shareable meeting IDs
- 🔒 Peer-to-peer connection (no server storing your video)
- 🎭 Modern, Google Meet-like UI

## 🚀 Technology Stack

- **Frontend:** React.js
- **Real-time Communication:** WebRTC
- **Signaling:** Socket.IO
- **Styling:** CSS

## 📋 Prerequisites

- Node.js (v14 or higher)
- npm or yarn

## 🛠️ Installation & Setup

### Client Setup

```bash
# Navigate to client directory
cd client

# Install dependencies
npm install

# Start the client application
npm start
```

### Server Setup

```bash
# Navigate to server directory
cd server

# Install dependencies
npm install

# Start the server
node index.js
```

## 🌟 How to Use

1. 📝 Enter your email and either generate or paste a meeting ID
2. 🚪 Join the meeting room
3. 🔊 Control your audio with the mute/unmute button
4. 📹 Toggle your camera on/off as needed
5. 💻 Share your screen with other participants
6. 📤 Share the meeting ID with others to invite them to join
7. 🚶‍♂️ Leave meeting when finished

## 🧩 Project Structure

- `/client` - React frontend application
- `/server` - Socket.IO signaling server
- `/client/src/providers` - Context providers for Socket and Peer connections
- `/client/src/pages` - React page components

## 🔧 Key Components

- **Socket Provider:** Manages WebSocket connections for signaling
- **Peer Provider:** Handles WebRTC peer connections
- **Home Page:** Entry point for joining meetings
- **Room Page:** Video conferencing interface

## 📝 License

MIT License

## 👨‍💻 Contributors

- Your contributions are welcome!

## 🙏 Acknowledgements

- The WebRTC project
- Socket.IO team
- React community
