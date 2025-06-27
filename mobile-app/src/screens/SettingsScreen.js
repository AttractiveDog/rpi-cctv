import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Switch,
  StatusBar,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SettingsScreen({ navigation }) {
  const [settings, setSettings] = useState({
    serverUrl: '',
    autoConnect: false,
    streamQuality: 'medium',
    refreshInterval: 30,
    keepScreenOn: true,
    showTimestamp: false,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const keys = [
        'serverUrl',
        'autoConnect',
        'streamQuality',
        'refreshInterval',
        'keepScreenOn',
        'showTimestamp',
      ];
      
      const values = await AsyncStorage.multiGet(keys);
      const loadedSettings = {};
      
      values.forEach(([key, value]) => {
        if (value !== null) {
          if (key === 'autoConnect' || key === 'keepScreenOn' || key === 'showTimestamp') {
            loadedSettings[key] = value === 'true';
          } else if (key === 'refreshInterval') {
            loadedSettings[key] = parseInt(value, 10) || 30;
          } else {
            loadedSettings[key] = value;
          }
        }
      });
      
      setSettings(prevSettings => ({ ...prevSettings, ...loadedSettings }));
    } catch (error) {
      console.error('Error loading settings:', error);
      Alert.alert('Error', 'Failed to load settings');
    } finally {
      setIsLoading(false);
    }
  };

  const saveSetting = async (key, value) => {
    try {
      await AsyncStorage.setItem(key, value.toString());
      setSettings(prevSettings => ({ ...prevSettings, [key]: value }));
    } catch (error) {
      console.error('Error saving setting:', error);
      Alert.alert('Error', 'Failed to save setting');
    }
  };

  const saveAllSettings = async () => {
    try {
      const settingsToSave = Object.entries(settings).map(([key, value]) => [key, value.toString()]);
      await AsyncStorage.multiSet(settingsToSave);
      Alert.alert('Success', 'Settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      Alert.alert('Error', 'Failed to save settings');
    }
  };

  const resetSettings = () => {
    Alert.alert(
      'Reset Settings',
      'Are you sure you want to reset all settings to default?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              const keys = [
                'serverUrl',
                'autoConnect',
                'streamQuality',
                'refreshInterval',
                'keepScreenOn',
                'showTimestamp',
              ];
              await AsyncStorage.multiRemove(keys);
              setSettings({
                serverUrl: '',
                autoConnect: false,
                streamQuality: 'medium',
                refreshInterval: 30,
                keepScreenOn: true,
                showTimestamp: false,
              });
              Alert.alert('Success', 'Settings reset to default');
            } catch (error) {
              console.error('Error resetting settings:', error);
              Alert.alert('Error', 'Failed to reset settings');
            }
          },
        },
      ]
    );
  };

  const clearServerData = () => {
    Alert.alert(
      'Clear Server Data',
      'This will remove saved server URL and connection data.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem('serverUrl');
              saveSetting('serverUrl', '');
              Alert.alert('Success', 'Server data cleared');
            } catch (error) {
              console.error('Error clearing server data:', error);
              Alert.alert('Error', 'Failed to clear server data');
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading settings...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1976D2" />
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Connection Settings</Text>
        
        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>Server URL</Text>
          <TextInput
            style={styles.textInput}
            value={settings.serverUrl}
            onChangeText={value => saveSetting('serverUrl', value)}
            placeholder="192.168.1.100:5000"
            placeholderTextColor="#999"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>Auto Connect on Launch</Text>
          <Switch
            value={settings.autoConnect}
            onValueChange={value => saveSetting('autoConnect', value)}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={settings.autoConnect ? '#2196F3' : '#f4f3f4'}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Stream Settings</Text>
        
        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>Stream Quality</Text>
          <View style={styles.qualityButtons}>
            {['low', 'medium', 'high'].map(quality => (
              <TouchableOpacity
                key={quality}
                style={[
                  styles.qualityButton,
                  settings.streamQuality === quality && styles.qualityButtonActive
                ]}
                onPress={() => saveSetting('streamQuality', quality)}
              >
                <Text style={[
                  styles.qualityButtonText,
                  settings.streamQuality === quality && styles.qualityButtonTextActive
                ]}>
                  {quality.charAt(0).toUpperCase() + quality.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>Refresh Interval (seconds)</Text>
          <TextInput
            style={styles.numberInput}
            value={settings.refreshInterval.toString()}
            onChangeText={value => {
              const num = parseInt(value, 10);
              if (!isNaN(num) && num > 0) {
                saveSetting('refreshInterval', num);
              }
            }}
            keyboardType="numeric"
            placeholder="30"
          />
        </View>

        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>Keep Screen On</Text>
          <Switch
            value={settings.keepScreenOn}
            onValueChange={value => saveSetting('keepScreenOn', value)}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={settings.keepScreenOn ? '#2196F3' : '#f4f3f4'}
          />
        </View>

        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>Show Timestamp</Text>
          <Switch
            value={settings.showTimestamp}
            onValueChange={value => saveSetting('showTimestamp', value)}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={settings.showTimestamp ? '#2196F3' : '#f4f3f4'}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>App Information</Text>
        
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Version</Text>
          <Text style={styles.infoValue}>1.0.0</Text>
        </View>
        
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Build</Text>
          <Text style={styles.infoValue}>2024.01.01</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Actions</Text>
        
        <TouchableOpacity style={styles.actionButton} onPress={saveAllSettings}>
          <Text style={styles.actionButtonText}>Save All Settings</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton} onPress={clearServerData}>
          <Text style={styles.actionButtonText}>Clear Server Data</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.resetButton]} 
          onPress={resetSettings}
        >
          <Text style={styles.actionButtonText}>Reset to Default</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <Text style={styles.aboutText}>
          CCTV Viewer allows you to connect to your USB camera streaming server 
          and view live video feeds on your mobile device. Make sure your device 
          is connected to the same network as your streaming server.
        </Text>
      </View>

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    fontSize: 18,
    color: '#666',
  },
  section: {
    backgroundColor: '#fff',
    margin: 15,
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 10,
  },
  settingLabel: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    minWidth: 150,
    backgroundColor: '#fff',
  },
  numberInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    width: 80,
    textAlign: 'center',
    backgroundColor: '#fff',
  },
  qualityButtons: {
    flexDirection: 'row',
  },
  qualityButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    marginHorizontal: 2,
    backgroundColor: '#f8f8f8',
  },
  qualityButtonActive: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  qualityButtonText: {
    fontSize: 14,
    color: '#666',
  },
  qualityButtonTextActive: {
    color: '#fff',
    fontWeight: '500',
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 5,
  },
  infoLabel: {
    fontSize: 16,
    color: '#333',
  },
  infoValue: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  actionButton: {
    backgroundColor: '#2196F3',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 5,
  },
  resetButton: {
    backgroundColor: '#F44336',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  aboutText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  bottomPadding: {
    height: 20,
  },
}); 