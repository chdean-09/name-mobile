"use client"

import { webSocketService, ConnectionStatus, StatusUpdate } from './websocket';
import { httpService } from './http';
import { configService } from './config';

export interface DeviceInfo {
  id: string;
  name: string;
  macAddress?: string;
  ipAddress: string;
  status: 'locked' | 'unlocked';
  isOnline: boolean;
  lastSeen: string;
  buzzer: 'on' | 'off';
}

export interface DeviceServiceState {
  devices: DeviceInfo[];
  connectionStatus: ConnectionStatus;
  isLoading: boolean;
  error: string | null;
}

export class DeviceService {
  private userId: string;
  private devices: Map<string, DeviceInfo> = new Map();
  private listeners: Array<(state: DeviceServiceState) => void> = [];
  private connectionStatus: ConnectionStatus = 'disconnected';
  private isLoading = false;
  private error: string | null = null;

  constructor(userId: string) {
    this.userId = userId;
    
    // Add a default device for single-door system
    this.addDefaultDevice();
    
    this.initializeWebSocket();
  }

  private async addDefaultDevice() {
    // Add a default ESP32 door device for single-door system
    await this.addDevice({
      id: 'esp32-door-1',
      name: 'ESP32 Door Lock',
      ipAddress: 'localhost:8000',
      status: 'locked',
      isOnline: false,
      lastSeen: 'Never',
      buzzer: 'off',
    });
  }

  private async initializeWebSocket() {
    // Listen for connection status changes
    webSocketService.onConnectionStatusChange((status) => {
      console.log('Device service received connection status change:', status);
      this.connectionStatus = status;
      this.notifyListeners();

      if (status === 'connected') {
        console.log('Connection established, registering user...');
        this.registerUser();
      } else if (status === 'error') {
        console.log('Connection error detected');
        this.setError('WebSocket connection failed. Using HTTP mode only.');
      }
    });

    // Listen for real-time status updates
    webSocketService.on('status-update', (data) => {
      console.log('Received status update:', data);
      this.handleStatusUpdate(data as unknown as StatusUpdate);
    });
    
    webSocketService.on('device-status-update', (data) => {
      console.log('Received device-status-update:', data);
      this.handleStatusUpdate(data as unknown as StatusUpdate);
    });
    
    webSocketService.on('door-status', (data) => {
      console.log('Received door-status:', data);
      this.handleStatusUpdate(data as unknown as StatusUpdate);
    });
    
    webSocketService.on('device-status', (data) => {
      console.log('Received device-status:', data);
      this.handleStatusUpdate(data as unknown as StatusUpdate);
    });

    // Attempt to connect directly (remove the test connection check)
    try {
      console.log('Attempting WebSocket connection...');
      await webSocketService.connect();
      console.log('WebSocket connection attempt completed');
    } catch (error) {
      console.error('WebSocket connection failed:', error);
      this.setError(`WebSocket connection failed: ${error instanceof Error ? error.message : 'Unknown error'}. Using HTTP mode only.`);
    }
  }

  private async registerUser() {
    try {
      console.log(`Attempting to register user: ${this.userId}`);
      const success = await webSocketService.registerUser(this.userId);
      if (success) {
        console.log('User registration successful - clearing any previous errors');
        this.setError(null); // Clear any errors when registration succeeds
      } else {
        console.log('User registration failed');
        this.setError('Failed to register user');
      }
    } catch (error) {
      console.error('User registration failed:', error);
      this.setError('User registration failed');
    }
  }

  private handleStatusUpdate(update: StatusUpdate) {
    console.log('=== Status Update Debug ===');
    console.log('Update object:', update);
    console.log('Update deviceId:', update.deviceId);
    console.log('Update sensors:', update.sensors);
    console.log('Current devices count:', this.devices.size);
    
    // For single door system, try to find the device by ID or use the first available device
    let device = this.devices.get(update.deviceId);
    
    if (!device && this.devices.size > 0) {
      // If no device matches the ID, use the first device (single door system)
      device = this.devices.values().next().value;
      if (device) {
        console.log(`Device ${update.deviceId} not found, using first available device: ${device.id}`);
      }
    }
    
    if (device) {
      console.log('Found device to update:', device.name);
      
      // Handle different sensor formats - ESP32 sends door1, door, or relay
      let doorSensorValue = 0;
      if (update.sensors.door1 !== undefined) {
        doorSensorValue = update.sensors.door1;
        console.log('Using door1 sensor value:', doorSensorValue);
      } else if (update.sensors.door !== undefined) {
        doorSensorValue = update.sensors.door;
        console.log('Using door sensor value:', doorSensorValue);
      } else if (update.sensors.relay !== undefined) {
        // Relay might be inverted (1 = unlocked, 0 = locked)
        doorSensorValue = update.sensors.relay === 1 ? 0 : 1;
        console.log('Using relay sensor value (inverted):', doorSensorValue);
      }
      
      // Update device status based on sensor data
      const newStatus = doorSensorValue === 1 ? 'locked' : 'unlocked';
      const newBuzzer = update.sensors.buzzer === 1 ? 'on' : 'off';
      
      console.log(`Updating device status: ${device.status} -> ${newStatus}`);
      console.log(`Updating device buzzer: ${device.buzzer} -> ${newBuzzer}`);
      
      device.status = newStatus;
      device.buzzer = newBuzzer;
      device.isOnline = true;
      device.lastSeen = 'Just now';

      this.devices.set(device.id, device);
      this.notifyListeners();
      
      console.log('Device updated successfully');
    } else {
      console.log(`No device found to update for deviceId: ${update.deviceId}`);
      console.log('Available devices:', Array.from(this.devices.keys()));
    }
  }

  async toggleDeviceLock(deviceId: string): Promise<boolean> {
    const device = this.devices.get(deviceId);
    if (!device) {
      this.setError('Device not found');
      return false;
    }

    this.setLoading(true);
    this.setError(null);
    console.log(`=== Toggle Device Lock Debug ===`);
    console.log(`Device ID: ${deviceId}`);
    console.log(`Current status: ${device.status}`);
    console.log(`Connection status: ${this.connectionStatus}`);
    console.log(`User ID: ${this.userId}`);

    try {
      // Determine command based on current status
      const currentStatus = device.status;
      const command = currentStatus === 'locked' ? 'unlock' : 'lock';
      console.log(`Command to send: ${command}`);

      // Try WebSocket first
      if (this.connectionStatus === 'connected') {
        console.log('Attempting WebSocket command...');
        console.log('WebSocket service connection status:', webSocketService.getConnectionStatus());
        
        // For single door system, use the device's actual ID or default to 'esp32-door'
        const wsDeviceId = deviceId || 'esp32-door';
        console.log(`Calling webSocketService.sendCommand('${wsDeviceId}', '${command}', '${this.userId}')`);
        
        const success = await webSocketService.sendCommand(wsDeviceId, command, this.userId);
        console.log(`WebSocket command result: ${success}`);
        
        if (success) {
          console.log('✅ WebSocket command successful');
          // Optimistic update
          device.status = command === 'lock' ? 'locked' : 'unlocked';
          this.devices.set(deviceId, device);
          this.notifyListeners();
          this.setLoading(false);
          return true;
        } else {
          console.log('❌ WebSocket command failed, trying HTTP fallback...');
        }
      } else {
        console.log(`WebSocket not connected (status: ${this.connectionStatus}), using HTTP fallback...`);
      }

      // Fallback to HTTP
      console.log(`WebSocket not available, using HTTP fallback. Connection status: ${this.connectionStatus}`);
      const httpCommand = command === 'lock' ? 'LOCK' : 'UNLOCK';
      console.log(`Sending HTTP command: ${httpCommand} to user: ${this.userId}`);
      
      const success = await httpService.sendCommand(this.userId, httpCommand);
      
      if (success) {
        // Optimistic update
        device.status = command === 'lock' ? 'locked' : 'unlocked';
        this.devices.set(deviceId, device);
        this.notifyListeners();
      } else {
        this.setError('Failed to send command to device');
      }

      this.setLoading(false);
      return success;

    } catch (error) {
      console.error('Failed to toggle device lock:', error);
      this.setError('Failed to toggle device lock');
      this.setLoading(false);
      return false;
    }
  }

  async addDevice(device: Omit<DeviceInfo, 'id'> & { id?: string }): Promise<void> {
    const deviceInfo: DeviceInfo = {
      id: device.id || 'esp32-door-1', // Use consistent ID for single door system
      name: device.name,
      macAddress: device.macAddress,
      ipAddress: device.ipAddress,
      status: device.status,
      isOnline: device.isOnline,
      lastSeen: device.lastSeen,
      buzzer: device.buzzer || 'off',
    };

    this.devices.set(deviceInfo.id, deviceInfo);
    this.notifyListeners();
  }

  async removeDevice(deviceId: string): Promise<void> {
    this.devices.delete(deviceId);
    this.notifyListeners();
  }

  async refreshDeviceStatus(deviceId: string): Promise<void> {
    try {
      const status = await httpService.getDeviceStatus();
      if (status) {
        const device = this.devices.get(deviceId);
        if (device) {
          device.status = status.sensors.door === 1 ? 'locked' : 'unlocked';
          device.buzzer = status.sensors.buzzer === 1 ? 'on' : 'off';
          device.isOnline = status.online;
          device.lastSeen = new Date(status.timestamp).toLocaleString();

          this.devices.set(deviceId, device);
          this.notifyListeners();
        }
      }
    } catch (error) {
      console.error('Failed to refresh device status:', error);
    }
  }

  async refreshAllDevices(): Promise<void> {
    const deviceIds = Array.from(this.devices.keys());
    await Promise.all(deviceIds.map(id => this.refreshDeviceStatus(id)));
  }

  getDevice(deviceId: string): DeviceInfo | undefined {
    return this.devices.get(deviceId);
  }

  getAllDevices(): DeviceInfo[] {
    return Array.from(this.devices.values());
  }

  getConnectionStatus(): ConnectionStatus {
    return this.connectionStatus;
  }

  isConnected(): boolean {
    return this.connectionStatus === 'connected';
  }

  // Connection management methods
  async testConnection(): Promise<{ websocket: boolean; http: boolean }> {
    const websocketAvailable = await webSocketService.testConnection();
    const httpAvailable = await httpService.ping();
    
    return {
      websocket: websocketAvailable,
      http: httpAvailable,
    };
  }

  async retryConnection(): Promise<boolean> {
    console.log('Retrying WebSocket connection...');
    this.setError(null);
    this.setLoading(true);

    try {
      // Test if server is available first
      const isAvailable = await webSocketService.testConnection();
      
      if (!isAvailable) {
        this.setError('ESP32 server not reachable. Make sure it\'s running on ws://localhost:8000');
        this.setLoading(false);
        return false;
      }

      // Try to connect
      await webSocketService.connect();
      console.log('WebSocket reconnected successfully');
      this.setLoading(false);
      return true;

    } catch (error) {
      console.error('WebSocket reconnection failed:', error);
      this.setError(`Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      this.setLoading(false);
      return false;
    }
  }

  // Method to update server URLs
  updateServerUrls(websocketUrl: string, httpUrl: string) {
    console.log(`Updating server URLs - WebSocket: ${websocketUrl}, HTTP: ${httpUrl}`);
    
    // Update config service
    configService.updateConfig({
      websocketUrl,
      httpBaseUrl: httpUrl,
    });
    
    // Update WebSocket service URL
    webSocketService.updateUrl(websocketUrl);
    
    // Update HTTP service URL
    httpService.updateBaseUrl(httpUrl);
  }

  // Pairing functionality
  async pairDevice(macAddress: string, deviceName: string): Promise<string | null> {
    this.setLoading(true);
    this.setError(null);

    try {
      // Try WebSocket first
      if (this.connectionStatus === 'connected') {
        const pairingCode = await webSocketService.requestPairing(macAddress, deviceName);
        if (pairingCode) {
          this.setLoading(false);
          return pairingCode;
        }
      }

      // Fallback to HTTP
      const pairingCode = await httpService.pairDevice(macAddress, deviceName);
      this.setLoading(false);
      
      if (!pairingCode) {
        this.setError('Failed to pair device');
      }

      return pairingCode;

    } catch (error) {
      console.error('Device pairing failed:', error);
      this.setError('Device pairing failed');
      this.setLoading(false);
      return null;
    }
  }

  // Buzzer control
  async toggleBuzzer(deviceId: string): Promise<boolean> {
    const device = this.devices.get(deviceId);
    if (!device) {
      this.setError('Device not found');
      return false;
    }

    this.setLoading(true);
    this.setError(null);

    try {
      // Determine command based on current buzzer status
      const currentStatus = device.buzzer;
      const command = currentStatus === 'on' ? 'BUZZER_OFF' : 'BUZZER_ON';

      // Use HTTP for buzzer control (assuming WebSocket doesn't have buzzer commands)
      const success = await httpService.sendBuzzerCommand(this.userId, command);
      
      if (success) {
        // Optimistic update
        device.buzzer = command === 'BUZZER_ON' ? 'on' : 'off';
        this.devices.set(deviceId, device);
        this.notifyListeners();
      } else {
        this.setError('Failed to send buzzer command to device');
      }

      this.setLoading(false);
      return success;

    } catch (error) {
      console.error('Failed to toggle buzzer:', error);
      this.setError('Failed to toggle buzzer');
      this.setLoading(false);
      return false;
    }
  }

  // Debug method to test WebSocket commands
  async debugWebSocketCommands(deviceId: string): Promise<void> {
    if (this.connectionStatus === 'connected') {
      console.log('Testing different WebSocket command formats...');
      await webSocketService.testCommand(deviceId, 'unlock', this.userId);
    } else {
      console.log('WebSocket not connected, cannot test commands');
    }
  }

  // Method to send raw WebSocket messages for testing
  async sendRawMessage(event: string, data: Record<string, unknown>): Promise<void> {
    if (this.connectionStatus === 'connected') {
      console.log('Sending raw WebSocket message...');
      await webSocketService.sendRawMessage(event, data);
    } else {
      console.log('WebSocket not connected, cannot send raw message');
    }
  }

  // Method to test specific ESP32 command formats
  async testESP32Commands(): Promise<void> {
    if (this.connectionStatus !== 'connected') {
      console.log('WebSocket not connected, cannot test ESP32 commands');
      return;
    }

    console.log('=== Testing ESP32-specific Command Formats ===');
    
    const esp32Tests = [
      { event: 'unlock', data: {} },
      { event: 'lock', data: {} },
      { event: 'door', data: { action: 'unlock' } },
      { event: 'door', data: { state: 1 } },
      { event: 'cmd', data: { door: 'unlock' } },
      { event: 'control', data: { type: 'door', value: 'unlock' } },
    ];

    for (const test of esp32Tests) {
      console.log(`Testing: ${test.event}`, test.data);
      await this.sendRawMessage(test.event, test.data);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  // State management
  subscribe(listener: (state: DeviceServiceState) => void): () => void {
    this.listeners.push(listener);
    
    // Call immediately with current state
    listener(this.getState());
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  private getState(): DeviceServiceState {
    return {
      devices: this.getAllDevices(),
      connectionStatus: this.connectionStatus,
      isLoading: this.isLoading,
      error: this.error,
    };
  }

  private notifyListeners() {
    const state = this.getState();
    this.listeners.forEach(listener => listener(state));
  }

  private setLoading(loading: boolean) {
    this.isLoading = loading;
    this.notifyListeners();
  }

  private setError(error: string | null) {
    this.error = error;
    this.notifyListeners();
  }

  // Cleanup
  disconnect() {
    webSocketService.disconnect();
    this.listeners = [];
  }
}

// Create a singleton instance (you might want to make this configurable)
let deviceServiceInstance: DeviceService | null = null;

export function getDeviceService(userId: string): DeviceService {
  if (!deviceServiceInstance) {
    deviceServiceInstance = new DeviceService(userId);
  }
  return deviceServiceInstance;
}
