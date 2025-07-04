"use client"

import { Badge } from "@/components/ui/badge"
import { Wifi, WifiOff, Loader2, AlertTriangle } from "lucide-react"
import { ConnectionStatus } from "@/services/websocket"

interface ConnectionStatusIndicatorProps {
  status: ConnectionStatus;
  className?: string;
}

export function ConnectionStatusIndicator({ status, className = "" }: ConnectionStatusIndicatorProps) {
  const getStatusConfig = (status: ConnectionStatus) => {
    switch (status) {
      case 'connected':
        return {
          icon: Wifi,
          text: 'Connected',
          variant: 'default' as const,
          className: 'bg-green-500 hover:bg-green-600',
        };
      case 'connecting':
        return {
          icon: Loader2,
          text: 'Connecting...',
          variant: 'secondary' as const,
          className: 'bg-yellow-500 hover:bg-yellow-600',
          animate: true,
        };
      case 'disconnected':
        return {
          icon: WifiOff,
          text: 'Disconnected',
          variant: 'secondary' as const,
          className: 'bg-gray-500 hover:bg-gray-600',
        };
      case 'error':
        return {
          icon: AlertTriangle,
          text: 'Connection Error',
          variant: 'destructive' as const,
          className: 'bg-red-500 hover:bg-red-600',
        };
      default:
        return {
          icon: WifiOff,
          text: 'Unknown',
          variant: 'secondary' as const,
          className: 'bg-gray-500 hover:bg-gray-600',
        };
    }
  };

  const config = getStatusConfig(status);
  const Icon = config.icon;

  return (
    <Badge 
      variant={config.variant} 
      className={`${config.className} ${className} flex items-center gap-1 text-white`}
    >
      <Icon 
        className={`h-3 w-3 ${config.animate ? 'animate-spin' : ''}`} 
      />
      <span className="text-xs font-medium">{config.text}</span>
    </Badge>
  );
}
