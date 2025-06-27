import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StatusBar,
  Dimensions,
  BackHandler,
} from 'react-native';
import { WebView } from 'react-native-webview';

const { width, height } = Dimensions.get('window');

export default function StreamScreen({ route, navigation }) {
  const { serverUrl } = route.params;
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [streamStatus, setStreamStatus] = useState('connecting');
  const webViewRef = useRef(null);
  const statusCheckInterval = useRef(null);

  useEffect(() => {
    // Check stream status periodically
    checkStreamStatus();
    statusCheckInterval.current = setInterval(checkStreamStatus, 5000);

    // Handle back button for fullscreen
    const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBackPress);

    return () => {
      if (statusCheckInterval.current) {
        clearInterval(statusCheckInterval.current);
      }
      backHandler.remove();
    };
  }, []);

  const handleBackPress = () => {
    if (isFullscreen) {
      setIsFullscreen(false);
      return true;
    }
    return false;
  };

  const checkStreamStatus = async () => {
    try {
      const response = await fetch(`${serverUrl}/api/camera/status`);
      if (response.ok) {
        const data = await response.json();
        if (data.is_streaming) {
          setStreamStatus('connected');
          setError(null);
        } else {
          setStreamStatus('disconnected');
          setError('Camera is not streaming');
        }
      } else {
        setStreamStatus('error');
        setError('Server connection failed');
      }
    } catch (err) {
      setStreamStatus('error');
      setError('Network error');
    }
  };

  const refreshStream = () => {
    setIsLoading(true);
    setStreamStatus('connecting');
    if (webViewRef.current) {
      webViewRef.current.reload();
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const takeSnapshot = () => {
    Alert.alert(
      'Snapshot',
      'Snapshot feature would be implemented here. This would capture the current frame and save it to the device.',
      [{ text: 'OK' }]
    );
  };

  const getStreamHtml = () => {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <style>
            body {
                margin: 0;
                padding: 0;
                background-color: #000;
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100vh;
                overflow: hidden;
            }
            img {
                max-width: 100%;
                max-height: 100%;
                object-fit: contain;
                border: none;
            }
            .loading {
                color: white;
                font-family: Arial, sans-serif;
                text-align: center;
            }
            .error {
                color: #ff4444;
                font-family: Arial, sans-serif;
                text-align: center;
                padding: 20px;
            }
        </style>
    </head>
    <body>
        <img id="stream" src="${serverUrl}/video_feed" alt="Live Stream" 
             onload="document.getElementById('loading').style.display='none';"
             onerror="showError()">
        <div id="loading" class="loading">Loading live stream...</div>
        
        <script>
            function showError() {
                document.getElementById('loading').innerHTML = 
                    '<div class="error">Failed to load stream<br>Check camera connection</div>';
            }
            
            // Refresh stream every 30 seconds to prevent timeout
            setInterval(function() {
                var img = document.getElementById('stream');
                var src = img.src;
                img.src = '';
                img.src = src + '?' + new Date().getTime();
            }, 30000);
        </script>
    </body>
    </html>
    `;
  };

  const getStatusColor = () => {
    switch (streamStatus) {
      case 'connected': return '#4CAF50';
      case 'connecting': return '#FF9800';
      case 'disconnected': return '#F44336';
      case 'error': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  const getStatusText = () => {
    switch (streamStatus) {
      case 'connected': return 'Live';
      case 'connecting': return 'Connecting';
      case 'disconnected': return 'Offline';
      case 'error': return 'Error';
      default: return 'Unknown';
    }
  };

  return (
    <View style={[styles.container, isFullscreen && styles.fullscreenContainer]}>
      <StatusBar 
        barStyle="light-content" 
        backgroundColor="#000" 
        hidden={isFullscreen}
      />
      
      {!isFullscreen && (
        <View style={styles.header}>
          <View style={[styles.statusIndicator, { backgroundColor: getStatusColor() }]}>
            <Text style={styles.statusText}>{getStatusText()}</Text>
          </View>
          <Text style={styles.serverText}>{serverUrl}</Text>
        </View>
      )}

      <View style={[styles.streamContainer, isFullscreen && styles.fullscreenStream]}>
        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={refreshStream}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <WebView
            ref={webViewRef}
            source={{ html: getStreamHtml() }}
            style={styles.webview}
            onLoadStart={() => setIsLoading(true)}
            onLoadEnd={() => setIsLoading(false)}
            onError={() => {
              setError('Failed to load stream');
              setIsLoading(false);
            }}
            allowsInlineMediaPlayback={true}
            mediaPlaybackRequiresUserAction={false}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={false}
            scalesPageToFit={true}
            scrollEnabled={false}
            bounces={false}
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
          />
        )}
        
        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={styles.loadingText}>Loading stream...</Text>
          </View>
        )}
      </View>

      {!isFullscreen && (
        <View style={styles.controls}>
          <TouchableOpacity style={styles.controlButton} onPress={refreshStream}>
            <Text style={styles.controlButtonText}>Refresh</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.controlButton} onPress={toggleFullscreen}>
            <Text style={styles.controlButtonText}>Fullscreen</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.controlButton} onPress={takeSnapshot}>
            <Text style={styles.controlButtonText}>Snapshot</Text>
          </TouchableOpacity>
        </View>
      )}

      {isFullscreen && (
        <TouchableOpacity 
          style={styles.fullscreenExit}
          onPress={toggleFullscreen}
        >
          <Text style={styles.fullscreenExitText}>Exit Fullscreen</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  fullscreenContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  header: {
    backgroundColor: '#1976D2',
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusIndicator: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  serverText: {
    color: '#fff',
    fontSize: 12,
    opacity: 0.8,
    flex: 1,
    textAlign: 'right',
    marginLeft: 10,
  },
  streamContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  fullscreenStream: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  webview: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 10,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  controls: {
    flexDirection: 'row',
    backgroundColor: '#1976D2',
    paddingVertical: 10,
    paddingHorizontal: 15,
    justifyContent: 'space-around',
  },
  controlButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
    minWidth: 80,
    alignItems: 'center',
  },
  controlButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  fullscreenExit: {
    position: 'absolute',
    top: 40,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
  },
  fullscreenExitText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
});