'use client';

import { useState, useEffect, useRef } from 'react';
import { useSocket } from '../hooks/useSocket';
import { useWebRTC } from '../hooks/useWebRTC';

export default function VideoCall() {
  const [roomId, setRoomId] = useState('');
  const [isInCall, setIsInCall] = useState(false);
  const { connect, disconnect, emit } = useSocket();
  const { callState, getLocalStream, toggleMute, toggleVideo } = useWebRTC(isInCall ? roomId : null);

  // ビデオ要素の参照
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());

  // ローカルビデオを表示
  useEffect(() => {
    if (localVideoRef.current && callState.localStream) {
      localVideoRef.current.srcObject = callState.localStream;
    }
  }, [callState.localStream]);

  // 通話開始
  
  const startCall = async () => {
    if (!roomId) {
      alert('ルームIDを入力してください');
      return;
    }

    try {
      connect();
      
      // メディア取得を試みる
      await getLocalStream();
      
      emit('joinRoom', roomId);
      setIsInCall(true);
    } catch (error: any) {
      console.error('通話開始エラー:', error);
      
      // 詳細なエラーメッセージを表示
      const message = error.message || 'メディアデバイスの接続に失敗しました';
      
      if (confirm(message + '\n\nカメラ/マイクなしで続行しますか？')) {
        // デバイスなしで続行
        connect();
        emit('joinRoom', roomId);
        setIsInCall(true);
      }
    }
  };

  // 通話終了
  const endCall = () => {
    if (callState.localStream) {
      callState.localStream.getTracks().forEach((track: MediaStreamTrack) => {
        track.stop();
      });
    }

    emit('leaveRoom');
    disconnect();
    setIsInCall(false);
    setRoomId('');
  };

  // 通話前の画面
  if (!isInCall) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="bg-gray-800 p-8 rounded-lg max-w-md w-full">
          <h1 className="text-3xl font-bold text-white mb-6">ビデオ通話</h1>
          
          <div className="space-y-4">
            <input
              type="text"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              placeholder="ルームIDを入力"
              className="w-full px-4 py-2 bg-gray-700 text-white rounded"
            />
            
            <button
              onClick={startCall}
              className="w-full bg-blue-600 hover:bg-blue-700 py-3 rounded text-white font-bold"
            >
              通話を開始
            </button>
          </div>
        </div>
      </div>
    );
  }

  // リモートストリームを配列に変換（型を明示的に指定）
  const remoteStreamsArray = Array.from(callState.remoteStreams.entries());

  // 通話中の画面
  return (
    <div className="min-h-screen bg-gray-900 p-4">
      <div className="mb-4 text-white">
        <p>ルーム: {roomId}</p>
        <p>参加者: {callState.remoteStreams.size + 1}人</p>
      </div>

      {/* ビデオグリッド */}
      <div className="grid grid-cols-2 gap-4 mb-20">
        {/* ローカルビデオ */}
        <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          <p className="absolute bottom-2 left-2 text-white bg-black/50 px-2 py-1 rounded">
            あなた {callState.isMuted && '🔇'} {callState.isVideoOff && '📷'}
          </p>
        </div>

        {/* リモートビデオ（修正版） */}
        {remoteStreamsArray.map((entry) => {
          const userId = entry[0];
          const stream = entry[1];
          
          return (
            <div key={userId} className="relative bg-black rounded-lg overflow-hidden aspect-video">
              <video
                ref={(el) => {
                  if (el) {
                    el.srcObject = stream;
                    remoteVideoRefs.current.set(userId, el);
                  }
                }}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
              <p className="absolute bottom-2 left-2 text-white bg-black/50 px-2 py-1 rounded">
                {userId.substring(0, 8)}
              </p>
            </div>
          );
        })}
      </div>

      {/* コントロールボタン */}
      <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 flex gap-4">
        <button
          onClick={toggleMute}
          className={`px-6 py-3 rounded-full text-white ${
            callState.isMuted ? 'bg-red-600' : 'bg-gray-700'
          }`}
        >
          {callState.isMuted ? 'ミュート解除' : 'ミュート'}
        </button>
        
        <button
          onClick={toggleVideo}
          className={`px-6 py-3 rounded-full text-white ${
            callState.isVideoOff ? 'bg-red-600' : 'bg-gray-700'
          }`}
        >
          {callState.isVideoOff ? 'ビデオON' : 'ビデオOFF'}
        </button>
        
        <button
          onClick={endCall}
          className="px-6 py-3 bg-red-600 rounded-full text-white"
        >
          通話終了
        </button>
      </div>
    </div>
  );
}