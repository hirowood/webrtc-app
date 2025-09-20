'use client';

import { useState, useEffect } from 'react';
import { useSocket } from '@/hooks/useSocket';

export default function Home() {
  const [roomId, setRoomId] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [users, setUsers] = useState<string[]>([]);
  const { connect, disconnect, emit, on, off } = useSocket();

  // ルームに参加
  const joinRoom = () => {
    if (!roomId) {
      alert('ルームIDを入力してください');
      return;
    }

    const socket = connect();
    if (socket) {
      setIsConnected(true);
      emit('joinRoom', roomId);
      
      // イベントリスナー設定
      on('userJoined', (userId: string) => {
        console.log('新しいユーザー参加:', userId);
        setUsers(prev => [...prev, userId]);
      });

      on('roomUsers', (userList: string[]) => {
        console.log('既存ユーザー:', userList);
        setUsers(userList);
      });

      on('userLeft', (userId: string) => {
        console.log('ユーザー退出:', userId);
        setUsers(prev => prev.filter(id => id !== userId));
      });
    }
  };

  // ルームから退出
  const leaveRoom = () => {
    emit('leaveRoom');
    disconnect();
    setIsConnected(false);
    setUsers([]);
    setRoomId('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-gray-800 p-8 rounded-lg max-w-md w-full">
        <h1 className="text-2xl font-bold mb-6">WebRTC通話アプリ - 接続テスト</h1>
        
        {!isConnected ? (
          <div className="space-y-4">
            <input
              type="text"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              placeholder="ルームIDを入力"
              className="w-full px-4 py-2 bg-gray-700 rounded text-white"
            />
            <button
              onClick={joinRoom}
              className="w-full bg-blue-600 hover:bg-blue-700 py-2 rounded text-white"
            >
              接続
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <p>ルーム: {roomId}</p>
            <p>接続中のユーザー数: {users.length + 1}</p>
            <div className="bg-gray-700 p-4 rounded">
              <p className="text-sm">他のユーザー:</p>
              {users.map(user => (
                <div key={user} className="text-xs text-gray-400">
                  {user}
                </div>
              ))}
            </div>
            <button
              onClick={leaveRoom}
              className="w-full bg-red-600 hover:bg-red-700 py-2 rounded text-white"
            >
              切断
            </button>
          </div>
        )}
      </div>
    </div>
  );
}