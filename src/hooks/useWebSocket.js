/**
 * React Hook for WebSocket connections
 */
import { useEffect, useRef, useState, useCallback } from 'react';
import { API_CONFIG } from '../config/api.config.js';

export function useWebSocket(url, options = {}) {
  const { onMessage, onError, onOpen, onClose, autoConnect = true } = options;
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState(null);
  const [error, setError] = useState(null);
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = options.maxReconnectAttempts || 5;

  const connect = useCallback(() => {
    try {
      // Convert http to ws
      const wsUrl = url.replace('http://', 'ws://').replace('https://', 'wss://');
      const ws = new WebSocket(wsUrl);
      
      ws.onopen = (event) => {
        setIsConnected(true);
        setError(null);
        reconnectAttempts.current = 0;
        if (onOpen) onOpen(event);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setLastMessage(data);
          if (onMessage) onMessage(data);
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
        }
      };

      ws.onerror = (event) => {
        setError('WebSocket error');
        if (onError) onError(event);
      };

      ws.onclose = (event) => {
        setIsConnected(false);
        if (onClose) onClose(event);

        // Auto-reconnect logic - only if not manually disconnected
        // Check if wsRef is still set (not null) to know if disconnect was called
        if (wsRef.current && reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current += 1;
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
          reconnectTimeoutRef.current = setTimeout(() => {
            // Double check wsRef is still set before reconnecting
            if (wsRef.current) {
              connect();
            }
          }, delay);
        }
      };

      wsRef.current = ws;
    } catch (err) {
      setError(err.message);
      if (onError) onError(err);
    }
  }, [url, onMessage, onError, onOpen, onClose, maxReconnectAttempts]);

  const disconnect = useCallback(() => {
    // Stop auto-reconnect
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    // Close WebSocket connection properly
    if (wsRef.current) {
      // Remove all event listeners to prevent errors
      wsRef.current.onopen = null;
      wsRef.current.onmessage = null;
      wsRef.current.onerror = null;
      wsRef.current.onclose = null;
      
      // Close connection if still open
      if (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING) {
        try {
          wsRef.current.close(1000, 'Client disconnect');
        } catch (err) {
          // Ignore errors during close
        }
      }
      
      wsRef.current = null;
    }
    
    setIsConnected(false);
    setError(null);
    reconnectAttempts.current = 0;
  }, []);

  const sendMessage = useCallback((message) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
      return true;
    }
    return false;
  }, []);

  const subscribe = useCallback((subscriptionType) => {
    sendMessage({
      action: 'subscribe',
      subscription_type: subscriptionType
    });
  }, [sendMessage]);

  const unsubscribe = useCallback((subscriptionType) => {
    sendMessage({
      action: 'unsubscribe',
      subscription_type: subscriptionType
    });
  }, [sendMessage]);

  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    // Cleanup on unmount
    return () => {
      disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoConnect]); // Only depend on autoConnect to avoid reconnecting on every render

  return {
    isConnected,
    lastMessage,
    error,
    connect,
    disconnect,
    sendMessage,
    subscribe,
    unsubscribe
  };
}

/**
 * Hook for shipment tracking WebSocket
 */
export function useShipmentTracking(shipmentId, options = {}) {
  // Use API_CONFIG which already handles native detection
  const baseUrl = API_CONFIG.baseURL;
  const wsUrl = shipmentId 
    ? `${baseUrl}/ws/shipments/${shipmentId}`
    : `${baseUrl}/ws`;
  
  const [shipmentData, setShipmentData] = useState(null);
  const [location, setLocation] = useState(null);
  const [temperature, setTemperature] = useState(null);
  const [alerts, setAlerts] = useState([]);

  const handleMessage = useCallback((message) => {
    if (message.type === 'shipment_update') {
      if (message.update_type === 'location') {
        setLocation(message.data);
      } else if (message.update_type === 'temperature') {
        setTemperature(message.data);
        if (message.data.has_violations) {
          setAlerts(prev => [...prev, {
            type: 'temperature_violation',
            message: 'Temperature violation detected',
            data: message.data,
            timestamp: message.timestamp
          }]);
        }
      } else if (message.update_type === 'status') {
        setShipmentData(message.data);
      }
    } else if (message.type === 'temperature_alert') {
      setAlerts(prev => [...prev, {
        type: 'temperature_alert',
        message: 'Temperature alert',
        data: message.data,
        timestamp: message.timestamp
      }]);
    }
  }, []);

  const ws = useWebSocket(wsUrl, {
    ...options,
    onMessage: handleMessage
  });

  useEffect(() => {
    if (ws.isConnected && shipmentId) {
      ws.subscribe('shipments');
    }
    
    // Cleanup on unmount or when shipmentId changes
    return () => {
      if (ws.isConnected) {
        ws.unsubscribe('shipments');
      }
      ws.disconnect();
    };
  }, [ws.isConnected, shipmentId, ws]);

  return {
    ...ws,
    shipmentData,
    location,
    temperature,
    alerts
  };
}




