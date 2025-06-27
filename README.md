 # CCTV Camera System with React Native App

A complete CCTV streaming solution using USB cameras with a Python backend server and React Native mobile app for live viewing.

## 🎯 Features

### Server Features
- **USB Camera Support**: Works with most USB cameras
- **Live Streaming**: Real-time video streaming over HTTP
- **Web Interface**: Built-in web interface for camera control
- **REST API**: RESTful API for camera management
- **Auto-Discovery**: Automatic network IP detection for mobile apps
- **Configurable**: Adjustable resolution, FPS, and quality settings

### Mobile App Features
- **Cross-Platform**: Works on both Android and iOS
- **Live Stream Viewing**: Real-time video streaming
- **Camera Controls**: Start/stop camera remotely
- **Connection Management**: Save and manage server connections
- **Fullscreen Mode**: Immersive viewing experience
- **Settings**: Customizable app preferences
- **Modern UI**: Clean and intuitive interface

## 🛠️ Prerequisites

### For the Server
- **Python 3.7+** with pip
- **USB Camera** connected to your computer
- **Linux/macOS/Windows** (tested on Linux)

### For the Mobile App
- **Node.js 16+** with npm
- **Expo CLI** (will be installed automatically)
- **Expo Go app** on your mobile device (download from app store)

## 🚀 Quick Setup

### 1. Automatic Setup (Recommended)
```bash
# Clone or download the project
git clone <repository-url>
cd rpi-cctv

# Run the setup script
chmod +x setup.sh
./setup.sh
```

### 2. Manual Setup

#### Server Setup
```bash
# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

#### Mobile App Setup
```bash
cd mobile-app
npm install
npm install -g expo-cli  # Install Expo CLI globally
```

## 🎮 Usage

### Starting the Server
```bash
# Option 1: Use the launcher script
./start_server.sh

# Option 2: Manual start
source venv/bin/activate
cd server
python camera_server.py
```

The server will start on `http://0.0.0.0:5000` by default.

### Starting the Mobile App
```bash
# Option 1: Use the launcher script
./start_mobile_app.sh

# Option 2: Manual start
cd mobile-app
npm start
# or
expo start
```

### Connecting Mobile App to Server

1. **Start both server and mobile app**
2. **Get your computer's IP address** (shown in server logs)
3. **Open Expo Go app** on your phone
4. **Scan the QR code** shown in the terminal/browser
5. **Enter server URL** in the app (e.g., `192.168.1.100:5000`)
6. **Test connection** and start streaming!

## 📱 Mobile App Usage

### Home Screen
- Enter your server URL (IP address and port)
- Test connection to ensure server is reachable
- View camera status and control streaming
- Start/stop camera remotely

### Stream Screen
- View live camera feed
- Toggle fullscreen mode
- Refresh stream if needed
- Take snapshots (feature placeholder)

### Settings Screen
- Configure connection preferences
- Adjust stream quality settings
- Set auto-connect options
- Manage app preferences

## 🔧 Configuration

### Server Configuration
```bash
# Basic usage
python camera_server.py

# Custom configuration
python camera_server.py --camera 0 --width 1280 --height 720 --fps 30 --port 5000
```

### Available Server Options
- `--camera`: Camera index (default: 0)
- `--width`: Video width (default: 640)
- `--height`: Video height (default: 480)
- `--fps`: Frames per second (default: 30)
- `--host`: Host to bind to (default: 0.0.0.0)
- `--port`: Port to bind to (default: 5000)

### Mobile App Configuration
Configure the app through the Settings screen:
- **Server URL**: Your streaming server address
- **Auto Connect**: Automatically connect on app launch
- **Stream Quality**: Low/Medium/High quality settings
- **Refresh Interval**: How often to refresh the stream
- **Keep Screen On**: Prevent screen from turning off during streaming

## 🌐 Network Setup

### Same Network Requirements
- Both your computer (server) and mobile device must be on the same network
- Ensure your firewall allows connections on the server port (default: 5000)
- Use your computer's local IP address (not 127.0.0.1 or localhost)

### Finding Your IP Address
```bash
# Linux/macOS
ifconfig | grep "inet " | grep -v 127.0.0.1

# Windows
ipconfig | findstr "IPv4"

# Or check the server startup logs - IP is displayed automatically
```

## 🛠️ Troubleshooting

### Common Issues

#### Camera Not Working
```bash
# Check if camera is detected
ls /dev/video*

# Test camera with v4l2 (Linux)
v4l2-ctl --list-devices

# Check USB devices
lsusb | grep -i camera
```

#### Connection Issues
- Verify both devices are on the same network
- Check firewall settings
- Ensure the server is running and accessible
- Try using the computer's IP address instead of hostname

#### Mobile App Issues
- Clear app cache in Expo Go
- Restart the Expo development server
- Check that all dependencies are installed
- Ensure React Native and Expo CLI are up to date

#### Stream Quality Issues
- Adjust camera resolution and FPS settings
- Check network bandwidth
- Reduce stream quality in mobile app settings
- Ensure USB camera supports the configured resolution

## 🔌 API Endpoints

The server provides the following REST API endpoints:

### Camera Control
- `GET /api/camera/status` - Get camera status
- `POST /api/camera/start` - Start camera streaming
- `POST /api/camera/stop` - Stop camera streaming
- `GET /api/stream_url` - Get streaming URL for mobile apps

### Streaming
- `GET /video_feed` - Live video stream (MJPEG)
- `GET /` - Web interface

## 📁 Project Structure

```
rpi-cctv/
├── server/
│   ├── camera_server.py      # Main streaming server
│   └── templates/
│       └── index.html        # Web interface
├── mobile-app/
│   ├── App.js               # Main React Native app
│   ├── package.json         # Dependencies
│   ├── app.json            # Expo configuration
│   └── src/
│       └── screens/
│           ├── HomeScreen.js    # Connection and controls
│           ├── StreamScreen.js  # Live video viewing
│           └── SettingsScreen.js # App settings
├── requirements.txt         # Python dependencies
├── setup.sh                # Automated setup script
├── start_server.sh         # Server launcher
├── start_mobile_app.sh     # Mobile app launcher
└── README.md              # This file
```

## 🔒 Security Considerations

- The server runs on your local network only
- No authentication is implemented (suitable for local network use)
- Consider adding authentication for production use
- Firewall rules should restrict access to local network only

## 🤝 Contributing

Feel free to submit issues, feature requests, or pull requests to improve this CCTV system.

## 📄 License

This project is open source and available under the MIT License.

## 📞 Support

If you encounter any issues:
1. Check the troubleshooting section above
2. Verify your network configuration
3. Ensure all prerequisites are installed
4. Check server and mobile app logs for error messages

---

**Happy Streaming!** 🎥📱