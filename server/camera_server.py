#!/usr/bin/env python3
"""
CCTV Camera Streaming Server
Captures video from USB camera and streams it via HTTP
"""

import cv2
import threading
import time
from flask import Flask, Response, render_template, jsonify
from flask_cors import CORS
import logging
import argparse
import os

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class CameraStreamer:
    def __init__(self, camera_index=0, width=640, height=480, fps=30):
        self.camera_index = camera_index
        self.width = width
        self.height = height
        self.fps = fps
        self.camera = None
        self.frame = None
        self.is_streaming = False
        self.lock = threading.Lock()
        
    def initialize_camera(self):
        """Initialize the USB camera"""
        try:
            self.camera = cv2.VideoCapture(self.camera_index)
            if not self.camera.isOpened():
                raise Exception(f"Cannot open camera {self.camera_index}")
            
            # Set camera properties
            self.camera.set(cv2.CAP_PROP_FRAME_WIDTH, self.width)
            self.camera.set(cv2.CAP_PROP_FRAME_HEIGHT, self.height)
            self.camera.set(cv2.CAP_PROP_FPS, self.fps)
            
            # Verify camera settings
            actual_width = int(self.camera.get(cv2.CAP_PROP_FRAME_WIDTH))
            actual_height = int(self.camera.get(cv2.CAP_PROP_FRAME_HEIGHT))
            actual_fps = int(self.camera.get(cv2.CAP_PROP_FPS))
            
            logger.info(f"Camera initialized: {actual_width}x{actual_height} @ {actual_fps}fps")
            return True
            
        except Exception as e:
            logger.error(f"Failed to initialize camera: {e}")
            return False
    
    def start_streaming(self):
        """Start the camera streaming thread"""
        if not self.initialize_camera():
            return False
        
        self.is_streaming = True
        self.streaming_thread = threading.Thread(target=self._capture_frames)
        self.streaming_thread.daemon = True
        self.streaming_thread.start()
        logger.info("Camera streaming started")
        return True
    
    def stop_streaming(self):
        """Stop the camera streaming"""
        self.is_streaming = False
        if self.camera:
            self.camera.release()
        logger.info("Camera streaming stopped")
    
    def _capture_frames(self):
        """Capture frames from camera in a separate thread"""
        while self.is_streaming:
            ret, frame = self.camera.read()
            if ret:
                with self.lock:
                    self.frame = frame.copy()
            else:
                logger.warning("Failed to read frame from camera")
                time.sleep(0.1)
    
    def get_frame(self):
        """Get the latest frame"""
        with self.lock:
            return self.frame.copy() if self.frame is not None else None
    
    def generate_frames(self):
        """Generate frames for streaming"""
        while self.is_streaming:
            frame = self.get_frame()
            if frame is not None:
                # Encode frame as JPEG
                ret, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 85])
                if ret:
                    frame_bytes = buffer.tobytes()
                    yield (b'--frame\r\n'
                           b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
            time.sleep(1/30)  # 30 FPS

# Flask app setup
app = Flask(__name__)
CORS(app)
camera_streamer = CameraStreamer()

@app.route('/')
def index():
    """Main page with camera feed"""
    return render_template('index.html')

@app.route('/video_feed')
def video_feed():
    """Video streaming route"""
    if not camera_streamer.is_streaming:
        return "Camera not available", 503
    
    return Response(camera_streamer.generate_frames(),
                   mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/api/camera/start', methods=['POST'])
def start_camera():
    """Start camera streaming"""
    if camera_streamer.start_streaming():
        return jsonify({"status": "success", "message": "Camera started"})
    else:
        return jsonify({"status": "error", "message": "Failed to start camera"}), 500

@app.route('/api/camera/stop', methods=['POST'])
def stop_camera():
    """Stop camera streaming"""
    camera_streamer.stop_streaming()
    return jsonify({"status": "success", "message": "Camera stopped"})

@app.route('/api/camera/status')
def camera_status():
    """Get camera status"""
    return jsonify({
        "is_streaming": camera_streamer.is_streaming,
        "width": camera_streamer.width,
        "height": camera_streamer.height,
        "fps": camera_streamer.fps
    })

@app.route('/api/stream_url')
def get_stream_url():
    """Get the streaming URL for mobile apps"""
    # Get the server's IP address
    import socket
    hostname = socket.gethostname()
    local_ip = socket.gethostbyname(hostname)
    
    return jsonify({
        "stream_url": f"http://{local_ip}:5000/video_feed",
        "status_url": f"http://{local_ip}:5000/api/camera/status"
    })

def main():
    parser = argparse.ArgumentParser(description='CCTV Camera Streaming Server')
    parser.add_argument('--camera', type=int, default=0, help='Camera index (default: 0)')
    parser.add_argument('--width', type=int, default=640, help='Frame width (default: 640)')
    parser.add_argument('--height', type=int, default=480, help='Frame height (default: 480)')
    parser.add_argument('--fps', type=int, default=30, help='Frames per second (default: 30)')
    parser.add_argument('--host', default='0.0.0.0', help='Host to bind to (default: 0.0.0.0)')
    parser.add_argument('--port', type=int, default=5000, help='Port to bind to (default: 5000)')
    
    args = parser.parse_args()
    
    # Initialize camera streamer with arguments
    global camera_streamer
    camera_streamer = CameraStreamer(args.camera, args.width, args.height, args.fps)
    
    # Auto-start camera
    if not camera_streamer.start_streaming():
        logger.error("Failed to start camera. Please check if USB camera is connected.")
        return
    
    try:
        app.run(host=args.host, port=args.port, debug=False, threaded=True)
    except KeyboardInterrupt:
        logger.info("Shutting down server...")
    finally:
        camera_streamer.stop_streaming()

if __name__ == '__main__':
    main() 