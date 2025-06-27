 #!/usr/bin/env python3
"""
Simple USB Camera Test Script
Tests if the USB camera is accessible and working
"""

import cv2
import sys
import time

def test_camera(camera_index=0):
    """Test if camera is accessible"""
    print(f"Testing camera {camera_index}...")
    
    try:
        # Initialize camera
        cap = cv2.VideoCapture(camera_index)
        
        if not cap.isOpened():
            print(f"❌ Camera {camera_index} could not be opened")
            return False
        
        # Get camera properties
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        fps = int(cap.get(cv2.CAP_PROP_FPS))
        
        print(f"✅ Camera {camera_index} opened successfully")
        print(f"   Resolution: {width}x{height}")
        print(f"   FPS: {fps}")
        
        # Try to read a frame
        ret, frame = cap.read()
        if ret:
            print("✅ Successfully captured a frame")
            print(f"   Frame shape: {frame.shape}")
        else:
            print("❌ Could not capture a frame")
            cap.release()
            return False
        
        # Test multiple frames
        print("📹 Testing frame capture (5 frames)...")
        for i in range(5):
            ret, frame = cap.read()
            if ret:
                print(f"   Frame {i+1}: OK")
            else:
                print(f"   Frame {i+1}: Failed")
                cap.release()
                return False
            time.sleep(0.1)
        
        cap.release()
        print("✅ Camera test completed successfully!")
        return True
        
    except Exception as e:
        print(f"❌ Error testing camera: {e}")
        return False

def list_cameras():
    """List available cameras"""
    print("🔍 Scanning for available cameras...")
    available_cameras = []
    
    for i in range(10):  # Check first 10 camera indices
        cap = cv2.VideoCapture(i)
        if cap.isOpened():
            available_cameras.append(i)
            cap.release()
    
    if available_cameras:
        print(f"📷 Found {len(available_cameras)} camera(s): {available_cameras}")
    else:
        print("❌ No cameras found")
    
    return available_cameras

def main():
    print("🎥 USB Camera Test Script")
    print("=" * 40)
    
    # List available cameras
    cameras = list_cameras()
    
    if not cameras:
        print("\n💡 Troubleshooting tips:")
        print("   1. Make sure your USB camera is connected")
        print("   2. Check if camera drivers are installed")
        print("   3. Try running: lsusb | grep -i camera")
        print("   4. Check /dev/video* devices: ls /dev/video*")
        sys.exit(1)
    
    print("\n🧪 Testing cameras...")
    for camera_index in cameras:
        print(f"\n--- Camera {camera_index} ---")
        test_camera(camera_index)
    
    print("\n🎉 Camera testing completed!")
    print("\nTo start the CCTV server:")
    print("  python server/camera_server.py --camera 0")

if __name__ == "__main__":
    main()