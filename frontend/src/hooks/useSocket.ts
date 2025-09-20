import { useRef, useCallback } from 'react';
import io, { Socket } from 'socket.io-client';

const SOCKET_SERVER_URL = 'http://localhost:3001';

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);

  const connect = useCallback(() => {
    if (socketRef.current?.connected) {
      return socketRef.current;
    }

    console.log('Socket接続中...');
    socketRef.current = io(SOCKET_SERVER_URL, {
      transports: ['websocket']
    });

    socketRef.current.on('connect', () => {
      console.log('Socket接続成功:', socketRef.current?.id);
    });

    return socketRef.current;
  }, []);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  }, []);

  // any型を使用（Socket.IOの柔軟性のため）
  const emit = useCallback((event: string, ...args: any[]) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, ...args);
    }
  }, []);

  const on = useCallback((event: string, handler: (...args: any[]) => any) => {
    if (socketRef.current) {
      socketRef.current.on(event, handler);
    }
  }, []);

  const off = useCallback((event: string) => {
    if (socketRef.current) {
      socketRef.current.off(event);
    }
  }, []);

  return {
    connect,
    disconnect,
    emit,
    on,
    off,
    socket: socketRef.current
  };
}