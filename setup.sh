 #!/bin/bash

# CCTV Camera System Setup Script
# This script sets up both the streaming server and React Native mobile app

echo "🎥 CCTV Camera System Setup"
echo "=========================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Python is installed
check_python() {
    print_status "Checking Python installation..."
    if command -v python3 &> /dev/null; then
        PYTHON_VERSION=$(python3 --version 2>&1 | awk '{print $2}')
        print_success "Python $PYTHON_VERSION found"
        return 0
    else
        print_error "Python 3 is not installed. Please install Python 3.7 or higher."
        return 1
    fi
}

# Check if Node.js is installed
check_node() {
    print_status "Checking Node.js installation..."
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version)
        print_success "Node.js $NODE_VERSION found"
        return 0
    else
        print_error "Node.js is not installed. Please install Node.js 16 or higher."
        return 1
    fi
}

# Check if npm is installed
check_npm() {
    print_status "Checking npm installation..."
    if command -v npm &> /dev/null; then
        NPM_VERSION=$(npm --version)
        print_success "npm $NPM_VERSION found"
        return 0
    else
        print_error "npm is not installed. Please install npm."
        return 1
    fi
}

# Install Python dependencies
setup_server() {
    print_status "Setting up Python streaming server..."
    
    # Create virtual environment if it doesn't exist
    if [ ! -d "venv" ]; then
        print_status "Creating Python virtual environment..."
        python3 -m venv venv
    fi
    
    # Activate virtual environment
    print_status "Activating virtual environment..."
    source venv/bin/activate
    
    # Upgrade pip
    print_status "Upgrading pip..."
    pip install --upgrade pip
    
    # Install dependencies
    print_status "Installing Python dependencies..."
    pip install -r requirements.txt
    
    print_success "Server setup completed!"
}

# Install React Native dependencies
setup_mobile_app() {
    print_status "Setting up React Native mobile app..."
    
    cd mobile-app
    
    # Install npm dependencies
    print_status "Installing npm dependencies..."
    npm install
    
    # Install Expo CLI if not already installed
    if ! command -v expo &> /dev/null; then
        print_status "Installing Expo CLI..."
        npm install -g expo-cli
    fi
    
    cd ..
    print_success "Mobile app setup completed!"
}

# Create launcher scripts
create_launchers() {
    print_status "Creating launcher scripts..."
    
    # Server launcher
    cat > start_server.sh << 'EOF'
#!/bin/bash
echo "Starting CCTV Streaming Server..."
source venv/bin/activate
cd server
python camera_server.py --host 0.0.0.0 --port 5000
EOF
    chmod +x start_server.sh
    
    # Mobile app launcher
    cat > start_mobile_app.sh << 'EOF'
#!/bin/bash
echo "Starting React Native Mobile App..."
cd mobile-app
npm start
EOF
    chmod +x start_mobile_app.sh
    
    print_success "Launcher scripts created!"
}

# Check USB camera
check_camera() {
    print_status "Checking for USB cameras..."
    
    if command -v lsusb &> /dev/null; then
        USB_CAMERAS=$(lsusb | grep -i camera | wc -l)
        if [ $USB_CAMERAS -gt 0 ]; then
            print_success "Found $USB_CAMERAS USB camera(s)"
            lsusb | grep -i camera
        else
            print_warning "No USB cameras detected. Please connect your USB camera."
        fi
    else
        print_warning "lsusb command not found. Cannot check for USB cameras."
    fi
    
    # Check video devices
    if [ -d "/dev" ]; then
        VIDEO_DEVICES=$(ls /dev/video* 2>/dev/null | wc -l)
        if [ $VIDEO_DEVICES -gt 0 ]; then
            print_success "Found $VIDEO_DEVICES video device(s):"
            ls -la /dev/video* 2>/dev/null
        else
            print_warning "No video devices found in /dev/"
        fi
    fi
}

# Display network information
show_network_info() {
    print_status "Network Information:"
    
    # Get local IP address
    if command -v ip &> /dev/null; then
        LOCAL_IP=$(ip route get 1 | awk '{print $7; exit}' 2>/dev/null)
    elif command -v ifconfig &> /dev/null; then
        LOCAL_IP=$(ifconfig | grep -Eo 'inet (addr:)?([0-9]*\.){3}[0-9]*' | grep -Eo '([0-9]*\.){3}[0-9]*' | grep -v '127.0.0.1' | head -1)
    else
        LOCAL_IP="Unable to determine"
    fi
    
    echo "  Local IP Address: $LOCAL_IP"
    echo "  Server URL: http://$LOCAL_IP:5000"
    echo "  Use this URL in your mobile app to connect to the server"
}

# Main setup function
main() {
    echo
    print_status "Starting setup process..."
    
    # Check prerequisites
    if ! check_python || ! check_node || ! check_npm; then
        print_error "Prerequisites not met. Please install the required software."
        exit 1
    fi
    
    # Setup components
    setup_server
    setup_mobile_app
    create_launchers
    
    echo
    print_status "Setup completed successfully!"
    echo
    
    # Additional checks and information
    check_camera
    echo
    show_network_info
    
    echo
    print_success "🎉 Setup Complete!"
    echo
    echo "To start the system:"
    echo "1. Start the server: ./start_server.sh"
    echo "2. Start the mobile app: ./start_mobile_app.sh"
    echo "3. Use the Expo Go app on your phone to scan the QR code"
    echo
    echo "Make sure your phone and computer are on the same network!"
}

# Run main function
main "$@"