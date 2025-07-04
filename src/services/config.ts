"use client"

export interface AppConfig {
  websocketUrl: string;
  httpBaseUrl: string;
  isDevelopment: boolean;
}

// Default configuration
const defaultConfig: AppConfig = {
  websocketUrl: 'ws://localhost:8000',
  httpBaseUrl: 'http://localhost:8000',
  isDevelopment: true,
};

// Mobile/emulator configuration - users should set this via the Server Config dialog
const mobileConfig: AppConfig = {
  websocketUrl: 'ws://localhost:8000', // Will be updated by user via Server Config
  httpBaseUrl: 'http://localhost:8000', // Will be updated by user via Server Config
  isDevelopment: true,
};

// Production configuration (you can update these)
const productionConfig: AppConfig = {
  websocketUrl: 'wss://your-esp32-server.com',
  httpBaseUrl: 'https://your-esp32-server.com',
  isDevelopment: false,
};

class ConfigService {
  private config: AppConfig;

  constructor() {
    // Use development config by default, can be overridden
    this.config = { ...defaultConfig };
    
    // Auto-detect if running in development
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      console.log(`Detecting environment. Hostname: ${hostname}, Port: ${window.location.port}`);
      
      // Check if running on mobile device/emulator (not localhost/127.0.0.1)
      if (hostname !== 'localhost' && hostname !== '127.0.0.1' && !hostname.startsWith('192.168.')) {
        // Running on mobile device - use mobile config
        console.log('Mobile environment detected, using mobile config');
        this.config = mobileConfig;
      } else if (hostname === 'localhost' || hostname === '127.0.0.1') {
        // Running on desktop browser
        console.log('Desktop environment detected, using default config');
        this.config = defaultConfig;
      } else if (hostname.includes('192.168.')) {
        // Running on local network
        console.log('Local network environment detected, using default config');
        this.config = defaultConfig;
      } else {
        // Production environment
        console.log('Production environment detected');
        this.config = productionConfig;
      }
      
      console.log('Final config:', this.config);
    }
  }

  getConfig(): AppConfig {
    return { ...this.config };
  }

  updateConfig(newConfig: Partial<AppConfig>) {
    this.config = { ...this.config, ...newConfig };
    console.log('Configuration updated:', this.config);
  }

  // Convenience methods
  getWebSocketUrl(): string {
    return this.config.websocketUrl;
  }

  getHttpBaseUrl(): string {
    return this.config.httpBaseUrl;
  }

  isDevelopment(): boolean {
    return this.config.isDevelopment;
  }

  // Method to test different server URLs
  async testServerConnection(url: string): Promise<boolean> {
    try {
      const httpUrl = url.replace('ws://', 'http://').replace('wss://', 'https://');
      const response = await fetch(`${httpUrl}/health`, { 
        method: 'GET',
        signal: AbortSignal.timeout(3000) // 3 second timeout
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  // Auto-discover ESP32 on local network
  async autoDiscoverESP32(): Promise<string | null> {
    const commonPorts = [8000, 3000, 8080, 80];
    const localIPs = ['localhost', '127.0.0.1'];
    
    // Add common local network IPs (you might want to expand this)
    for (let i = 1; i <= 254; i++) {
      localIPs.push(`192.168.1.${i}`);
      localIPs.push(`192.168.0.${i}`);
    }

    console.log('Auto-discovering ESP32 server...');
    
    for (const ip of localIPs) {
      for (const port of commonPorts) {
        const url = `http://${ip}:${port}`;
        try {
          const isAvailable = await this.testServerConnection(url);
          if (isAvailable) {
            console.log(`Found ESP32 server at: ${url}`);
            return url;
          }
        } catch {
          // Continue searching
        }
      }
    }
    
    console.log('No ESP32 server found on local network');
    return null;
  }
}

// Singleton instance
export const configService = new ConfigService();
