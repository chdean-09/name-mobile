"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, AlertTriangle, WifiOff, Settings, RefreshCw } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

interface ConnectionTroubleshootingProps {
  connectionStatus: string;
  error: string | null;
  onRetryConnection: () => Promise<boolean>;
  onTestConnection: () => Promise<{ websocket: boolean; http: boolean }>;
}

export function ConnectionTroubleshooting({
  connectionStatus,
  error,
  onRetryConnection,
  onTestConnection,
}: ConnectionTroubleshootingProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResults, setTestResults] = useState<{ websocket: boolean; http: boolean } | null>(null);

  const handleTestConnection = async () => {
    setTesting(true);
    try {
      const results = await onTestConnection();
      setTestResults(results);
    } finally {
      setTesting(false);
    }
  };

  const handleRetryConnection = async () => {
    setTesting(true);
    try {
      await onRetryConnection();
      // Refresh test results after retry
      await handleTestConnection();
    } finally {
      setTesting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'connecting':
        return <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />;
      case 'disconnected':
        return <WifiOff className="h-4 w-4 text-orange-600" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return 'bg-green-100 text-green-800';
      case 'connecting':
        return 'bg-blue-100 text-blue-800';
      case 'disconnected':
        return 'bg-orange-100 text-orange-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4 mr-2" />
          Connection Help
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Connection Troubleshooting</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Current Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                {getStatusIcon(connectionStatus)}
                Connection Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge className={getStatusColor(connectionStatus)}>
                  {connectionStatus}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {connectionStatus === 'connected' && 'Real-time updates available'}
                  {connectionStatus === 'connecting' && 'Establishing connection...'}
                  {connectionStatus === 'disconnected' && 'Using HTTP-only mode'}
                  {connectionStatus === 'error' && 'Connection failed'}
                </span>
              </div>
              {error && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Connection Tests */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Connection Tests</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span>Test connections</span>
                <Button
                  size="sm"
                  onClick={handleTestConnection}
                  disabled={testing}
                >
                  {testing ? 'Testing...' : 'Run Tests'}
                </Button>
              </div>
              {testResults && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>WebSocket (ws://localhost:3000)</span>
                    {testResults.websocket ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>HTTP (http://localhost:3000)</span>
                    {testResults.http ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Troubleshooting Steps */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Troubleshooting Steps</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex gap-3">
                  <span className="font-medium text-blue-600">1.</span>
                  <div>
                    <strong>Check ESP32 Backend:</strong>
                    <p className="text-muted-foreground">
                      Make sure your ESP32 backend is running on <code>ws://localhost:3000</code>
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="font-medium text-blue-600">2.</span>
                  <div>
                    <strong>Check Network:</strong>
                    <p className="text-muted-foreground">
                      Ensure your device and ESP32 are on the same network
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="font-medium text-blue-600">3.</span>
                  <div>
                    <strong>Try HTTP Mode:</strong>
                    <p className="text-muted-foreground">
                      Even without WebSocket, you can still control devices using HTTP
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="font-medium text-blue-600">4.</span>
                  <div>
                    <strong>Restart Services:</strong>
                    <p className="text-muted-foreground">
                      Try restarting your ESP32 backend and refresh this app
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Close
            </Button>
            <Button onClick={handleRetryConnection} disabled={testing}>
              {testing ? 'Retrying...' : 'Retry Connection'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
