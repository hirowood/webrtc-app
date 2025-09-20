import { useEffect, useRef, useCallback } from 'react';
import io, { Socket } from 'socket.io-client';

const SOCKET_SERVER_URL = 'http://localhost:3001';

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);

  // Socket接続を初期化
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

  // Socket切断
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  }, []);

  // イベント送信
  const emit = useCallback((event: string, ...args: any[]) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, ...args);
    }
  }, []);

  // イベントリスナー登録
  const on = useCallback((event: string, handler: (...args: any[]) => void) => {
    if (socketRef.current) {
      socketRef.current.on(event, handler);
    }
  }, []);

  // イベントリスナー解除
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