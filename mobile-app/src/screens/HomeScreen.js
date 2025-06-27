import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  StatusBar,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function HomeScreen({ navigation }) {
  const [serverUrl, setServerUrl] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [cameraStatus, setCameraStatus] = useState(null);

  useEffect(() => {
    loadSavedUrl();
  }, []);

  const loadSavedUrl = async () => {
    try {
      const savedUrl = await AsyncStorage.getItem('serverUrl');
      if (savedUrl) {
        setServerUrl(savedUrl);
      }
    } catch (error) {
      console.error('Error loading saved URL:', error);
    }
  };

  const saveUrl = async (url) => {
    try {
      await AsyncStorage.setItem('serverUrl', url);
    } catch (error) {
      console.error('Error saving URL:', error);
    }
  };



  const testConnection = async () => {
    if (!serverUrl.trim()) {
      Alert.alert('Error', 'Please enter a server URL');
      return;
    }

    setIsConnecting(true);
    setConnectionStatus('connecting');

    try {
      // Normalize URL
      let url = serverUrl.trim();
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = `http://${url}`;
      }
      if (!url.includes(':')) {
        url = `${url}:5000`;
      }

      const response = await fetch(`${url}/api/camera/status`, {
        method: 'GET',
        timeout: 10000,
      });

      if (response.ok) {
        const data = await response.json();
        setCameraStatus(data);
        setConnectionStatus('connected');
        setServerUrl(url);
        await saveUrl(url);
        Alert.alert('Success', 'Connected to CCTV server successfully!');
      } else {
        throw new Error(`Server responded with status: ${response.status}`);
      }
    } catch (error) {
      console.error('Connection error:', error);
      setConnectionStatus('disconnected');
      setCameraStatus(null);
      Alert.alert(
        'Connection Failed',
        'Could not connect to the server. Please check:\n' +
        '• Server URL is correct\n' +
        '• Server is running\n' +
        '• You are on the same network'
      );
    } finally {
      setIsConnecting(false);
    }
  };

  const startCamera = async () => {
    if (connectionStatus !== 'connected') {
      Alert.alert('Error', 'Please connect to server first');
      return;
    }

    try {
      const response = await fetch(`${serverUrl}/api/camera/start`, {
        method: 'POST',
      });
      
      if (response.ok) {
        Alert.alert('Success', 'Camera started successfully!');
        // Refresh camera status
        setTimeout(testConnection, 1000);
      } else {
        throw new Error('Failed to start camera');
      }
    } catch (error) {
      console.error('Start camera error:', error);
      Alert.alert('Error', 'Failed to start camera');
    }
  };

  const stopCamera = async () => {
    if (connectionStatus !== 'connected') {
      Alert.alert('Error', 'Please connect to server first');
      return;
    }

    try {
      const response = await fetch(`${serverUrl}/api/camera/stop`, {
        method: 'POST',
      });
      
      if (response.ok) {
        Alert.alert('Success', 'Camera stopped successfully!');
        // Refresh camera status
        setTimeout(testConnection, 1000);
      } else {
        throw new Error('Failed to stop camera');
      }
    } catch (error) {
      console.error('Stop camera error:', error);
      Alert.alert('Error', 'Failed to stop camera');
    }
  };

  const viewStream = () => {
    if (connectionStatus !== 'connected') {
      Alert.alert('Error', 'Please connect to server first');
      return;
    }

    if (!cameraStatus?.is_streaming) {
      Alert.alert('Error', 'Camera is not streaming. Please start the camera first.');
      return;
    }

    navigation.navigate('Stream', { serverUrl });
  };

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return '#4CAF50';
      case 'connecting': return '#FF9800';
      case 'disconnected': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected': return 'Connected';
      case 'connecting': return 'Connecting...';
      case 'disconnected': return 'Disconnected';
      default: return 'Unknown';
    }
  };

  return (
    <ScrollView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1976D2" />
      
      <View style={styles.header}>
        <Text style={styles.title}>CCTV Camera Viewer</Text>
        <Text style={styles.subtitle}>Connect to your streaming server</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Server URL</Text>
        <TextInput
          style={styles.input}
          value={serverUrl}
          onChangeText={setServerUrl}
          placeholder="192.168.1.100:5000"
          placeholderTextColor="#999"
          autoCapitalize="none"
          autoCorrect={false}
        />
        
        <TouchableOpacity
          style={[styles.button, styles.connectButton]}
          onPress={testConnection}
          disabled={isConnecting}
        >
          {isConnecting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Test Connection</Text>
          )}
        </TouchableOpacity>

        <View style={[styles.status, { backgroundColor: getStatusColor() }]}>
          <Text style={styles.statusText}>{getStatusText()}</Text>
        </View>
      </View>

      {cameraStatus && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Camera Status</Text>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Streaming:</Text>
            <Text style={[styles.statusValue, { 
              color: cameraStatus.is_streaming ? '#4CAF50' : '#F44336' 
            }]}>
              {cameraStatus.is_streaming ? 'Active' : 'Inactive'}
            </Text>
          </View>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Resolution:</Text>
            <Text style={styles.statusValue}>
              {cameraStatus.width}x{cameraStatus.height}
            </Text>
          </View>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>FPS:</Text>
            <Text style={styles.statusValue}>{cameraStatus.fps}</Text>
          </View>
        </View>
      )}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Camera Controls</Text>
        
        <TouchableOpacity
          style={[styles.button, styles.startButton]}
          onPress={startCamera}
          disabled={connectionStatus !== 'connected'}
        >
          <Text style={styles.buttonText}>Start Camera</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.stopButton]}
          onPress={stopCamera}
          disabled={connectionStatus !== 'connected'}
        >
          <Text style={styles.buttonText}>Stop Camera</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.viewButton]}
          onPress={viewStream}
          disabled={connectionStatus !== 'connected' || !cameraStatus?.is_streaming}
        >
          <Text style={styles.buttonText}>View Live Stream</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.button, styles.settingsButton]}
        onPress={() => navigation.navigate('Settings')}
      >
        <Text style={styles.buttonText}>Settings</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#2196F3',
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
  },
  card: {
    backgroundColor: '#fff',
    margin: 15,
    padding: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 15,
    backgroundColor: '#fff',
  },
  button: {
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 5,
  },
  connectButton: {
    backgroundColor: '#2196F3',
  },
  startButton: {
    backgroundColor: '#4CAF50',
  },
  stopButton: {
    backgroundColor: '#F44336',
  },
  viewButton: {
    backgroundColor: '#FF9800',
  },
  settingsButton: {
    backgroundColor: '#9E9E9E',
    margin: 15,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  status: {
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  statusText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 5,
  },
  statusLabel: {
    fontSize: 16,
    color: '#666',
  },
  statusValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
}); 