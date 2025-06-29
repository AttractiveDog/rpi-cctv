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
  ScrollView,
  TextInput,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { captureRef } from 'react-native-view-shot';

const { width, height } = Dimensions.get('window');

export default function StreamScreen({ route, navigation }) {
  const { serverUrl } = route.params;
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [streamStatus, setStreamStatus] = useState('connecting');
  const [geminiResponse, setGeminiResponse] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [autoSnapshot, setAutoSnapshot] = useState(false);
  const [geminiApiKey, setGeminiApiKey] = useState('AIzaSyBIsk641CglSE7b6Omt9qsAeuhDQt8krto'); // Replace with your actual API key
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [analysisHistory, setAnalysisHistory] = useState([]);
  
  const webViewRef = useRef(null);
  const streamContainerRef = useRef(null);
  const statusCheckInterval = useRef(null);
  const snapshotInterval = useRef(null);

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
      if (snapshotInterval.current) {
        clearInterval(snapshotInterval.current);
      }
      backHandler.remove();
    };
  }, []);

  useEffect(() => {
    if (autoSnapshot && geminiApiKey && geminiApiKey !== 'YOUR_GEMINI_API_KEY_HERE' && !isFullscreen) {
      startAutoSnapshot();
    } else {
      stopAutoSnapshot();
    }
  }, [autoSnapshot, geminiApiKey, isFullscreen]);

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

  const startAutoSnapshot = () => {
    if (snapshotInterval.current) {
      clearInterval(snapshotInterval.current);
    }
    
    snapshotInterval.current = setInterval(() => {
      if (!isAnalyzing && streamStatus === 'connected') {
        takeSnapshotAndAnalyze();
      }
    }, 5000);
  };

  const stopAutoSnapshot = () => {
    if (snapshotInterval.current) {
      clearInterval(snapshotInterval.current);
      snapshotInterval.current = null;
    }
  };

  const takeSnapshotAndAnalyze = async () => {
    if (!geminiApiKey || geminiApiKey === 'YOUR_GEMINI_API_KEY_HERE') {
      Alert.alert('API Key Required', 'Please set your Gemini API key in the code.');
      return;
    }

    try {
      setIsAnalyzing(true);
      
      // Capture the stream container
      const uri = await captureRef(streamContainerRef.current, {
        format: 'jpg',
        quality: 0.8,
      });

      // Convert to base64
      const base64Image = await convertImageToBase64(uri);
      
      // Send to Gemini API
      const analysis = await analyzeImageWithGemini(base64Image);
      
      const timestamp = new Date().toLocaleTimeString();
      const newAnalysis = {
        id: Date.now(),
        timestamp,
        response: analysis,
      };
      
      setAnalysisHistory(prev => [newAnalysis, ...prev.slice(0, 4)]); // Keep last 5 analyses
      setGeminiResponse(analysis);
      
    } catch (error) {
      console.error('Snapshot analysis failed:', error);
      setGeminiResponse(`Error: ${error.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const convertImageToBase64 = async (uri) => {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = reader.result.split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      throw new Error('Failed to convert image to base64');
    }
  };

  const analyzeImageWithGemini = async (base64Image) => {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [
              {
                text: "This is a snapshot after 5 seconds of a CCTV camera. Tell me any difference or abnormal activity you can observe. Be specific about what you see and any potential security concerns."
              },
              {
                inline_data: {
                  mime_type: "image/jpeg",
                  data: base64Image
                }
              }
            ]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 32,
            topP: 1,
            maxOutputTokens: 1024,
          }
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Gemini API error: ${errorData.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || 'No analysis available';
      
    } catch (error) {
      throw new Error(`Gemini API call failed: ${error.message}`);
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

  const toggleAutoSnapshot = () => {
    if (!geminiApiKey || geminiApiKey === 'YOUR_GEMINI_API_KEY_HERE') {
      Alert.alert('API Key Required', 'Please set your Gemini API key in the code.');
      return;
    }
    setAutoSnapshot(!autoSnapshot);
  };

  const saveApiKey = () => {
    if (geminiApiKey.trim()) {
      setShowApiKeyInput(false);
      Alert.alert('Success', 'API key saved successfully!');
    } else {
      Alert.alert('Error', 'Please enter a valid API key');
    }
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

  if (showApiKeyInput) {
    return null; // API key is now hardcoded, no need for input screen
  }

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
          {isAnalyzing && (
            <View style={styles.analyzingIndicator}>
              <ActivityIndicator size="small" color="#fff" />
              <Text style={styles.analyzingText}>Analyzing...</Text>
            </View>
          )}
        </View>
      )}

      <View style={[styles.streamContainer, isFullscreen && styles.fullscreenStream]} ref={streamContainerRef}>
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
        <>
          <View style={styles.controls}>
            <TouchableOpacity style={styles.controlButton} onPress={refreshStream}>
              <Text style={styles.controlButtonText}>Refresh</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.controlButton} onPress={toggleFullscreen}>
              <Text style={styles.controlButtonText}>Fullscreen</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.controlButton} onPress={takeSnapshotAndAnalyze}>
              <Text style={styles.controlButtonText}>Analyze Now</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.controlButton, autoSnapshot && styles.activeButton]} 
              onPress={toggleAutoSnapshot}
            >
              <Text style={styles.controlButtonText}>
                Auto: {autoSnapshot ? 'ON' : 'OFF'}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.analysisContainer}>
            <Text style={styles.analysisTitle}>AI Analysis</Text>
            {analysisHistory.length > 0 ? (
              analysisHistory.map((analysis) => (
                <View key={analysis.id} style={styles.analysisItem}>
                  <Text style={styles.analysisTimestamp}>{analysis.timestamp}</Text>
                  <Text style={styles.analysisText}>{analysis.response}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.noAnalysisText}>
                No analysis yet. {autoSnapshot ? 'Auto-analysis will start in 5 seconds.' : 'Press "Analyze Now" or enable auto-analysis.'}
              </Text>
            )}
          </ScrollView>
        </>
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
    flex: 1,
  },
  apiKeyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  apiKeyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
    textAlign: 'center',
  },
  apiKeySubtitle: {
    fontSize: 16,
    color: '#ccc',
    marginBottom: 30,
    textAlign: 'center',
  },
  apiKeyInput: {
    width: '100%',
    height: 50,
    backgroundColor: '#333',
    borderRadius: 8,
    paddingHorizontal: 15,
    color: '#fff',
    fontSize: 16,
    marginBottom: 20,
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#1a1a1a',
  },
  statusIndicator: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  serverText: {
    color: '#ccc',
    fontSize: 12,
    flex: 1,
    textAlign: 'center',
  },
  analyzingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  analyzingText: {
    color: '#fff',
    fontSize: 12,
    marginLeft: 5,
  },
  streamContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  fullscreenStream: {
    flex: 1,
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
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    marginTop: 10,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#ff4444',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    backgroundColor: '#1a1a1a',
  },
  controlButton: {
    backgroundColor: '#333',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 5,
    minWidth: 80,
  },
  activeButton: {
    backgroundColor: '#4CAF50',
  },
  controlButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  analysisContainer: {
    maxHeight: 200,
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 15,
  },
  analysisTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    paddingVertical: 10,
  },
  analysisItem: {
    backgroundColor: '#333',
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
  },
  analysisTimestamp: {
    color: '#4CAF50',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  analysisText: {
    color: '#fff',
    fontSize: 14,
    lineHeight: 20,
  },
  noAnalysisText: {
    color: '#ccc',
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 20,
  },
  fullscreenExit: {
    position: 'absolute',
    top: 40,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
  },
  fullscreenExitText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});