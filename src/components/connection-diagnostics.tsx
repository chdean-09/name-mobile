"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Wifi, WifiOff, Loader2, CheckCircle, XCircle, Settings, RefreshCw } from "lucide-react"
import { configService } from "@/services/config"
import { webSocketService } from "@/services/websocket"
import { httpService } from "@/services/http"

interface ConnectionDiagnosticsProps {
  className?: string;
}

export function ConnectionDiagnostics({ className = "" }: ConnectionDiagnosticsProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [websocketUrl, setWebsocketUrl] = useState(configService.getWebSocketUrl());
  const [httpUrl, setHttpUrl] = useState(configService.getHttpBaseUrl());
  const [testing, setTesting] = useState(false);
  const [autoDiscovering, setAutoDiscovering] = useState(false);
  const [testResults, setTestResults] = useState<{
    websocket: boolean | null;
    http: boolean | null;
    autoDiscovered?: string | null;
  }>({
    websocket: null,
    http: null,
  });

  useEffect(() => {
    // Auto-test connection on mount
    testConnections();
  }, []);

  const testConnections = async () => {
    setTesting(true);
    
    // Test HTTP connection
    const httpResult = await httpService.ping();
    
    // Test WebSocket connection
    const wsResult = await webSocketService.testConnection();
    
    setTestResults({
      websocket: wsResult,
      http: httpResult,
    });
    
    setTesting(false);
  };

  const autoDiscover = async () => {
    setAutoDiscovering(true);
    const discoveredUrl = await configService.autoDiscoverESP32();
    
    if (discoveredUrl) {
      const wsUrl = discoveredUrl.replace('http://', 'ws://').replace('https://', 'wss://');
      setWebsocketUrl(wsUrl);
      setHttpUrl(discoveredUrl);
      
      setTestResults(prev => ({
        ...prev,
        autoDiscovered: discoveredUrl
      }));
    }
    
    setAutoDiscovering(false);
  };

  const updateConfiguration = () => {
    configService.updateConfig({
      websocketUrl,
      httpBaseUrl: httpUrl,
    });

    // Update services
    webSocketService.updateUrl(websocketUrl);
    
    // Re-test connections
    testConnections();
    
    // Try to reconnect WebSocket
    webSocketService.connect().catch(() => {
      console.log('WebSocket connection failed with new URL');
    });
  };

  const getStatusIcon = (status: boolean | null) => {
    if (status === null) return <Loader2 className="h-4 w-4 animate-spin" />;
    return status ? <CheckCircle className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-red-500" />;
  };

  const getStatusText = (status: boolean | null) => {
    if (status === null) return "Testing...";
    return status ? "Connected" : "Failed";
  };

  if (!isVisible) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsVisible(true)}
        className={`${className} flex items-center gap-2`}
      >
        <Settings className="h-4 w-4" />
        Connection Settings
      </Button>
    );
  }

  return (
    <Card className={`${className} w-full max-w-2xl`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Wifi className="h-5 w-5" />
            Connection Diagnostics
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsVisible(false)}
          >
            ×
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Status */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <span className="text-sm font-medium">WebSocket</span>
            <div className="flex items-center gap-2">
              {getStatusIcon(testResults.websocket)}
              <span className="text-sm">{getStatusText(testResults.websocket)}</span>
            </div>
          </div>
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <span className="text-sm font-medium">HTTP API</span>
            <div className="flex items-center gap-2">
              {getStatusIcon(testResults.http)}
              <span className="text-sm">{getStatusText(testResults.http)}</span>
            </div>
          </div>
        </div>

        {/* Configuration */}
        <div className="space-y-3">
          <div>
            <Label htmlFor="websocket-url">WebSocket URL</Label>
            <Input
              id="websocket-url"
              value={websocketUrl}
              onChange={(e) => setWebsocketUrl(e.target.value)}
              placeholder="ws://localhost:3000"
            />
          </div>
          <div>
            <Label htmlFor="http-url">HTTP Base URL</Label>
            <Input
              id="http-url"
              value={httpUrl}
              onChange={(e) => setHttpUrl(e.target.value)}
              placeholder="http://localhost:3000"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={testConnections}
            disabled={testing}
            size="sm"
          >
            {testing ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Test Connections
          </Button>
          
          <Button
            onClick={autoDiscover}
            disabled={autoDiscovering}
            variant="outline"
            size="sm"
          >
            {autoDiscovering ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Wifi className="h-4 w-4 mr-2" />
            )}
            Auto Discover
          </Button>
          
          <Button
            onClick={updateConfiguration}
            size="sm"
          >
            Update & Reconnect
          </Button>
        </div>

        {/* Auto-discovery result */}
        {testResults.autoDiscovered && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              ESP32 server found at: {testResults.autoDiscovered}
            </AlertDescription>
          </Alert>
        )}

        {/* Troubleshooting tips */}
        {(!testResults.websocket && !testResults.http) && (
          <Alert>
            <WifiOff className="h-4 w-4" />
            <AlertDescription>
              <strong>Connection Failed:</strong>
              <ul className="mt-2 list-disc list-inside text-sm space-y-1">
                <li>Make sure your ESP32 backend is running</li>
                <li>Check if the server is accessible at the configured URL</li>
                <li>Try auto-discovery to find the ESP32 on your network</li>
                <li>Verify firewall settings allow connections</li>
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Working in HTTP-only mode */}
        {!testResults.websocket && testResults.http && (
          <Alert>
            <Badge variant="secondary" className="mr-2">HTTP Only</Badge>
            <AlertDescription>
              WebSocket connection failed, but HTTP is working. You can still control devices, but won't receive real-time updates.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
