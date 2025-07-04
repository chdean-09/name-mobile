"use client"

import { useState, useEffect, useCallback } from 'react';
import { getDeviceService, DeviceService, DeviceInfo, DeviceServiceState } from '@/services/device-service';
import { ConnectionStatus } from '@/services/websocket';

export interface UseDeviceControlReturn {
  devices: DeviceInfo[];
  connectionStatus: ConnectionStatus;
  isLoading: boolean;
  error: string | null;
  isConnected: boolean;
  toggleDeviceLock: (deviceId: string) => Promise<boolean>;
  toggleBuzzer: (deviceId: string) => Promise<boolean>;
  addDevice: (device: Omit<DeviceInfo, 'id'> & { id?: string }) => Promise<void>;
  removeDevice: (deviceId: string) => Promise<void>;
  refreshDevice: (deviceId: string) => Promise<void>;
  refreshAllDevices: () => Promise<void>;
  pairDevice: (macAddress: string, deviceName: string) => Promise<string | null>;
  getDevice: (deviceId: string) => DeviceInfo | undefined;
  clearError: () => void;
  retryConnection: () => Promise<boolean>;
  testConnection: () => Promise<{ websocket: boolean; http: boolean }>;
}

export function useDeviceControl(userId: string): UseDeviceControlReturn {
  const [deviceService] = useState<DeviceService>(() => getDeviceService(userId));
  const [state, setState] = useState<DeviceServiceState>({
    devices: [],
    connectionStatus: 'disconnected',
    isLoading: false,
    error: null,
  });

  useEffect(() => {
    // Subscribe to device service state changes
    const unsubscribe = deviceService.subscribe((newState) => {
      setState(newState);
    });

    // Cleanup on unmount
    return () => {
      unsubscribe();
    };
  }, [deviceService]);

  const toggleDeviceLock = useCallback(async (deviceId: string): Promise<boolean> => {
    return await deviceService.toggleDeviceLock(deviceId);
  }, [deviceService]);

  const toggleBuzzer = useCallback(async (deviceId: string): Promise<boolean> => {
    return await deviceService.toggleBuzzer(deviceId);
  }, [deviceService]);

  const addDevice = useCallback(async (device: Omit<DeviceInfo, 'id'> & { id?: string }): Promise<void> => {
    await deviceService.addDevice(device);
  }, [deviceService]);

  const removeDevice = useCallback(async (deviceId: string): Promise<void> => {
    await deviceService.removeDevice(deviceId);
  }, [deviceService]);

  const refreshDevice = useCallback(async (deviceId: string): Promise<void> => {
    await deviceService.refreshDeviceStatus(deviceId);
  }, [deviceService]);

  const refreshAllDevices = useCallback(async (): Promise<void> => {
    await deviceService.refreshAllDevices();
  }, [deviceService]);

  const pairDevice = useCallback(async (macAddress: string, deviceName: string): Promise<string | null> => {
    return await deviceService.pairDevice(macAddress, deviceName);
  }, [deviceService]);

  const getDevice = useCallback((deviceId: string): DeviceInfo | undefined => {
    return deviceService.getDevice(deviceId);
  }, [deviceService]);

  const clearError = useCallback(() => {
    // We'll need to add this method to the device service
    // For now, we can work around it
    setState(prev => ({ ...prev, error: null }));
  }, []);

  const retryConnection = useCallback(async (): Promise<boolean> => {
    return await deviceService.retryConnection();
  }, [deviceService]);

  const testConnection = useCallback(async (): Promise<{ websocket: boolean; http: boolean }> => {
    return await deviceService.testConnection();
  }, [deviceService]);

  return {
    devices: state.devices,
    connectionStatus: state.connectionStatus,
    isLoading: state.isLoading,
    error: state.error,
    isConnected: state.connectionStatus === 'connected',
    toggleDeviceLock,
    toggleBuzzer,
    addDevice,
    removeDevice,
    refreshDevice,
    refreshAllDevices,
    pairDevice,
    getDevice,
    clearError,
    retryConnection,
    testConnection,
  };
}
