"use client"

import { configService } from './config';

export interface HttpResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  method?: string;
}

export interface DeviceStatus {
  deviceId: string;
  sensors: {
    door: number;
    buzzer: number;
  };
  timestamp: string;
  online: boolean;
}

export interface UserDevices {
  devices: Array<{
    deviceId: string;
    deviceName: string;
    macAddress: string;
    lastSeen: string;
    online: boolean;
  }>;
}

export class HttpService {
  private baseUrl: string;
  private timeout: number;

  constructor(baseUrl?: string, timeout: number = 10000) {
    this.baseUrl = baseUrl || configService.getHttpBaseUrl();
    this.timeout = timeout;
    console.log(`HTTP service initialized with base URL: ${this.baseUrl}`);
    console.log(`Current window location: ${typeof window !== 'undefined' ? window.location.href : 'N/A'}`);
  }

  private async fetchWithTimeout(url: string, options: RequestInit): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  async getDeviceStatus(): Promise<DeviceStatus | null> {
    try {
      const response = await this.fetchWithTimeout(`${this.baseUrl}/door_sensor`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: HttpResponse<DeviceStatus> = await response.json();
      return data.success ? data.data || null : null;
    } catch (error) {
      console.error('Failed to get device status:', error);
      return null;
    }
  }

  async sendCommand(userId: string, command: 'LOCK' | 'UNLOCK'): Promise<boolean> {
    try {
      const url = `${this.baseUrl}/door`;
      console.log(`HTTP sendCommand: POST ${url}`, { userId, command });
      
      const response = await this.fetchWithTimeout(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          command,
        }),
      });

      console.log(`HTTP response status: ${response.status}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: HttpResponse = await response.json();
      console.log('HTTP response data:', data);
      return data.success;
    } catch (error) {
      console.error('Failed to send command:', error);
      return false;
    }
  }

  async sendBuzzerCommand(userId: string, command: 'BUZZER_ON' | 'BUZZER_OFF'): Promise<boolean> {
    try {
      const response = await this.fetchWithTimeout(`${this.baseUrl}/buzzer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          command,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: HttpResponse = await response.json();
      return data.success;
    } catch (error) {
      console.error('Failed to send buzzer command:', error);
      return false;
    }
  }

  async pairDevice(macAddress: string, deviceName: string): Promise<string | null> {
    try {
      const response = await this.fetchWithTimeout(`${this.baseUrl}/device/pair`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          macAddress,
          deviceName,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: HttpResponse<{ pairingCode: string }> = await response.json();
      return data.success && data.data ? data.data.pairingCode : null;
    } catch (error) {
      console.error('Failed to pair device:', error);
      return null;
    }
  }

  async getUserDevices(userId: string): Promise<UserDevices | null> {
    try {
      const response = await this.fetchWithTimeout(`${this.baseUrl}/device/user/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: HttpResponse<UserDevices> = await response.json();
      return data.success ? data.data || null : null;
    } catch (error) {
      console.error('Failed to get user devices:', error);
      return null;
    }
  }

  // Health check
  async ping(): Promise<boolean> {
    try {
      const response = await this.fetchWithTimeout(`${this.baseUrl}/health`, {
        method: 'GET',
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  // Method to update base URL
  updateBaseUrl(newBaseUrl: string) {
    console.log(`Updating HTTP base URL from ${this.baseUrl} to ${newBaseUrl}`);
    this.baseUrl = newBaseUrl;
  }
}

// Singleton instance
export const httpService = new HttpService();
