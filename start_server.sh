#!/bin/bash
echo "Starting CCTV Streaming Server..."
source venv/bin/activate
cd server
python camera_server.py --host 0.0.0.0 --port 5000
