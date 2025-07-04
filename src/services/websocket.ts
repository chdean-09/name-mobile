"use client"

import { configService } from './config';

export interface WebSocketMessage {
  event: string;
  data: Record<string, unknown>;
}

export interface DeviceCommand {
  deviceId: string;
  command: 'lock' | 'unlock';
  userId: string;
}

export interface StatusUpdate {
  deviceId: string;
  sensors: {
    door?: number;
    door1?: number;
    buzzer: number;
    relay?: number;
  };
  timestamp: string | number;
}

export interface RegisterUserResponse {
  success: boolean;
}

export interface CommandResponse {
  success: boolean;
  method?: string;
}

export interface PairingResponse {
  success: boolean;
  pairingCode?: string;
}

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

type EventCallback = (data: Record<string, unknown>) => void;
type ConnectionStatusCallback = (status: ConnectionStatus) => void;

export class WebSocketService {
  private ws: WebSocket | null = null;
  private url: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5; // Reduced for faster fallback
  private reconnectInterval = 1000; // Start with 1 second
  private maxReconnectInterval = 30000; // Max 30 seconds
  private pingInterval: NodeJS.Timeout | null = null;
  private messageQueue: WebSocketMessage[] = [];
  private listeners: Map<string, EventCallback[]> = new Map();
  private connectionStatusListeners: ConnectionStatusCallback[] = [];
  private connectionStatus: ConnectionStatus = 'disconnected';
  private shouldReconnect = true;

  constructor(url?: string) {
    this.url = url || configService.getWebSocketUrl();
    console.log(`WebSocket service initialized with URL: ${this.url}`);
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        console.log(`Attempting to connect to WebSocket: ${this.url}`);
        this.setConnectionStatus('connecting');

        const connectionTimeout = setTimeout(() => {
          console.error('WebSocket connection timeout');
          if (this.ws && this.ws.readyState === WebSocket.CONNECTING) {
            this.ws.close();
            this.setConnectionStatus('error');
            reject(new Error('Connection timeout - make sure your ESP32 backend is running'));
          }
        }, 5000); // 5 second timeout
        
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
          clearTimeout(connectionTimeout);
          console.log('WebSocket connected successfully');
          this.setConnectionStatus('connected');
          this.reconnectAttempts = 0;
          this.reconnectInterval = 1000;
          this.startPing();
          this.processMessageQueue();
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            console.log('=== WebSocket Message Received ===');
            console.log('Raw message data:', event.data);
            
            const message: WebSocketMessage = JSON.parse(event.data);
            console.log('Parsed message:', JSON.stringify(message, null, 2));
            console.log('Message event:', message.event);
            console.log('Message data:', message.data);
            
            this.handleMessage(message);
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
            console.error('Raw message was:', event.data);
          }
        };

        this.ws.onclose = (event) => {
          clearTimeout(connectionTimeout);
          console.log('WebSocket disconnected:', event.code, event.reason);
          this.setConnectionStatus('disconnected');
          this.stopPing();
          
          if (this.shouldReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.scheduleReconnect();
          } else if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.warn('Max reconnection attempts reached. Switching to HTTP-only mode.');
            this.setConnectionStatus('error');
          }
        };

        this.ws.onerror = (error) => {
          clearTimeout(connectionTimeout);
          console.error('WebSocket error:', error);
          this.setConnectionStatus('error');
          reject(new Error('WebSocket connection failed - check if your ESP32 backend is running on ws://localhost:8000'));
        };

      } catch (error) {
        this.setConnectionStatus('error');
        reject(error);
      }
    });
  }

  disconnect() {
    console.log('Manually disconnecting WebSocket');
    this.shouldReconnect = false;
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.stopPing();
    this.setConnectionStatus('disconnected');
  }

  // Add method to change WebSocket URL
  updateUrl(newUrl: string) {
    console.log(`Updating WebSocket URL from ${this.url} to ${newUrl}`);
    this.url = newUrl;
    if (this.ws) {
      this.disconnect();
    }
  }

  // Add method to check if WebSocket is available
  async testConnection(): Promise<boolean> {
    return new Promise((resolve) => {
      const testWs = new WebSocket(this.url);
      const timeout = setTimeout(() => {
        testWs.close();
        resolve(false);
      }, 3000);

      testWs.onopen = () => {
        clearTimeout(timeout);
        testWs.close();
        resolve(true);
      };

      testWs.onerror = () => {
        clearTimeout(timeout);
        resolve(false);
      };
    });
  }

  send(message: WebSocketMessage): boolean {
    console.log('=== WebSocket Send Debug ===');
    console.log('Connection status:', this.connectionStatus);
    console.log('WebSocket readyState:', this.ws?.readyState);
    console.log('Message to send:', JSON.stringify(message, null, 2));
    
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        const messageString = JSON.stringify(message);
        console.log('Sending WebSocket message:', messageString);
        this.ws.send(messageString);
        console.log('✅ WebSocket message sent successfully');
        return true;
      } catch (error) {
        console.error('❌ Failed to send WebSocket message:', error);
        this.messageQueue.push(message);
        return false;
      }
    } else {
      console.log('❌ WebSocket not ready, queueing message');
      console.log('- WebSocket exists:', !!this.ws);
      console.log('- ReadyState:', this.ws?.readyState);
      console.log('- Expected ReadyState (OPEN):', WebSocket.OPEN);
      // Queue message for when connection is restored
      this.messageQueue.push(message);
      return false;
    }
  }

  // Device-specific methods
  async registerUser(userId: string): Promise<boolean> {
    return new Promise((resolve) => {
      const messageId = `register-${Date.now()}`;
      
      // Listen for response
      this.once('register-user-response', (data) => {
        const response = data as unknown as RegisterUserResponse;
        resolve(response.success);
      });

      // Send registration
      const success = this.send({
        event: 'register-user',
        data: { userId, messageId }
      });

      // Timeout if no response
      setTimeout(() => resolve(false), 5000);
      
      if (!success) {
        resolve(false);
      }
    });
  }

  async sendCommand(deviceId: string, command: 'lock' | 'unlock', userId: string): Promise<boolean> {
    return new Promise((resolve) => {
      console.log('=== WebSocket sendCommand called ===');
      console.log('Parameters:', { deviceId, command, userId });
      console.log('Connection status:', this.connectionStatus);
      console.log('WebSocket readyState:', this.ws?.readyState);
      
      const messageId = `command-${Date.now()}`;
      
      // Listen for various response event types
      const responseEvents = ['command-response', 'door-command-response', 'response', 'door-response'];
      let resolved = false;
      
      const handleResponse = (data: unknown) => {
        if (resolved) return;
        resolved = true;
        console.log('Received command response:', data);
        const response = data as unknown as CommandResponse;
        resolve(response.success !== false); // Default to true unless explicitly false
      };
      
      responseEvents.forEach(eventType => {
        this.once(eventType, handleResponse);
      });

      // Try multiple command formats based on common ESP32 patterns
      const commandFormats = [
        // Format 1: Simple command with action
        {
          event: 'command',
          data: { 
            action: command,
            device: 'door',
            userId,
            messageId 
          }
        },
        // Format 2: Door-specific command
        {
          event: 'door-command',
          data: { 
            command: command.toUpperCase(),
            userId,
            messageId 
          }
        },
        // Format 3: Action-based format
        {
          event: 'action',
          data: { 
            type: 'door',
            action: command,
            userId,
            messageId 
          }
        }
      ];
      
      // Try the first format initially
      const commandMessage = commandFormats[0];
      console.log('Sending command message:', JSON.stringify(commandMessage, null, 2));
      
      const success = this.send(commandMessage);
      console.log('Send result:', success);

      // Timeout if no response
      setTimeout(() => {
        if (!resolved) {
          console.log('Command timeout reached, resolving false');
          resolved = true;
          resolve(false);
        }
      }, 5000);
      
      if (!success) {
        console.log('Send failed immediately, resolving false');
        if (!resolved) {
          resolved = true;
          resolve(false);
        }
      }
    });
  }

  async requestPairing(macAddress: string, deviceName: string): Promise<string | null> {
    return new Promise((resolve) => {
      const messageId = `pairing-${Date.now()}`;
      
      // Listen for response
      this.once('pairing-response', (data) => {
        const response = data as unknown as PairingResponse;
        resolve(response.success ? response.pairingCode || null : null);
      });

      // Send pairing request
      const success = this.send({
        event: 'pairing-request',
        data: { macAddress, deviceName, messageId }
      });

      // Timeout if no response
      setTimeout(() => resolve(null), 10000);
      
      if (!success) {
        resolve(null);
      }
    });
  }

  // Debug method to test different command formats
  async testCommand(deviceId: string, command: 'lock' | 'unlock', userId: string): Promise<void> {
    console.log('=== Testing Different Command Formats ===');
    
    const testStructures = [
      {
        name: 'Simple command with action',
        message: {
          event: 'command',
          data: { action: command, device: 'door', userId }
        }
      },
      {
        name: 'Door-specific command',
        message: {
          event: 'door-command',
          data: { command: command.toUpperCase(), userId }
        }
      },
      {
        name: 'Action-based format',
        message: {
          event: 'action',
          data: { type: 'door', action: command, userId }
        }
      },
      {
        name: 'Toggle format',
        message: {
          event: 'toggle',
          data: { device: 'door', state: command === 'lock' ? 'locked' : 'unlocked', userId }
        }
      },
      {
        name: 'Control format',
        message: {
          event: 'control',
          data: { target: 'door', command: command, userId }
        }
      },
      {
        name: 'ESP32 specific format',
        message: {
          event: 'esp32-command',
          data: { door: command === 'lock' ? 0 : 1, userId }
        }
      }
    ];

    for (const test of testStructures) {
      console.log(`\n--- Testing: ${test.name} ---`);
      console.log('Message:', JSON.stringify(test.message, null, 2));
      
      // Listen for any response
      const responsePromise = new Promise((resolve) => {
        const timeout = setTimeout(() => resolve('timeout'), 3000);
        
        const handleAnyResponse = (event: string, data: unknown) => {
          clearTimeout(timeout);
          resolve({ event, data });
        };
        
        // Listen for various response types
        const responseEvents = ['ping', 'pong', 'command-response', 'door-command-response', 'response', 'door-response', 'status-update', 'error'];
        responseEvents.forEach(eventType => {
          this.once(eventType, (data) => handleAnyResponse(eventType, data));
        });
      });
      
      this.send(test.message);
      
      const response = await responsePromise;
      console.log('Response:', response);
      
      // Wait between attempts
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  // Method to send raw message for testing
  async sendRawMessage(event: string, data: Record<string, unknown>): Promise<void> {
    console.log('=== Sending Raw Message ===');
    console.log('Event:', event);
    console.log('Data:', data);
    
    const message = { event, data };
    const success = this.send(message);
    console.log('Send result:', success);
  }

  // Event listeners
  on(event: string, callback: EventCallback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  once(event: string, callback: EventCallback) {
    const wrappedCallback = (...args: unknown[]) => {
      callback(args[0] as Record<string, unknown>);
      this.off(event, wrappedCallback);
    };
    this.on(event, wrappedCallback);
  }

  off(event: string, callback: EventCallback) {
    const listeners = this.listeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  onConnectionStatusChange(callback: (status: ConnectionStatus) => void) {
    this.connectionStatusListeners.push(callback);
  }

  getConnectionStatus(): ConnectionStatus {
    return this.connectionStatus;
  }

  private setConnectionStatus(status: ConnectionStatus) {
    console.log(`WebSocket status changing from ${this.connectionStatus} to ${status}`);
    this.connectionStatus = status;
    console.log(`Notifying ${this.connectionStatusListeners.length} listeners about status change`);
    this.connectionStatusListeners.forEach(callback => callback(status));
  }

  private handleMessage(message: WebSocketMessage) {
    console.log('=== Handling WebSocket Message ===');
    console.log('Event type:', message.event);
    console.log('Event data:', message.data);
    
    // Handle different event types
    switch (message.event) {
      case 'ping':
        console.log('Received ping from backend - sending pong response');
        this.send({ event: 'pong', data: {} });
        break;
        
      case 'pong':
        console.log('Received pong from backend');
        break;
        
      case 'status-update':
      case 'device-status':
      case 'door-status':
      case 'device-status-update':
        console.log('Received status update from backend');
        break;
        
      case 'command-response':
      case 'door-command-response':
      case 'response':
        console.log('Received command response from backend');
        break;
        
      default:
        console.log(`Received unknown event type: ${message.event}`);
    }
    
    // Forward to registered listeners
    const listeners = this.listeners.get(message.event);
    if (listeners && listeners.length > 0) {
      console.log(`Forwarding to ${listeners.length} listeners for event: ${message.event}`);
      listeners.forEach(callback => callback(message.data));
    } else {
      console.log(`No listeners registered for event: ${message.event}`);
    }
  }

  private startPing() {
    console.log('Starting WebSocket ping mechanism...');
    this.pingInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        console.log('Sending ping message...');
        this.ws.send(JSON.stringify({ event: 'ping', data: {} }));
      }
    }, 30000); // Ping every 30 seconds
  }

  private stopPing() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  private scheduleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      
      setTimeout(() => {
        console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
        this.connect().catch(() => {
          // Exponential backoff
          this.reconnectInterval = Math.min(this.reconnectInterval * 2, this.maxReconnectInterval);
        });
      }, this.reconnectInterval);
    }
  }

  private processMessageQueue() {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      if (message) {
        this.send(message);
      }
    }
  }
}

// Singleton instance
export const webSocketService = new WebSocketService();
