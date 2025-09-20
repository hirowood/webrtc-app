/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState, useCallback } from 'react';
import { useSocket } from './useSocket';

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    {
      urls: 'stun:stun.l.google.com:19302'
    }
  ]
};

interface CallState {
  localStream: MediaStream | null;
  remoteStreams: Map<string, MediaStream>;
  isMuted: boolean;
  isVideoOff: boolean;
  error: string | null;
  hasVideo: boolean;
  hasAudio: boolean;
}

export function useWebRTC(roomId: string | null) {
  const { emit, on, off } = useSocket();
  const peersRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const [callState, setCallState] = useState<CallState>({
    localStream: null,
    remoteStreams: new Map(),
    isMuted: false,
    isVideoOff: false,
    error: null,
    hasVideo: false,
    hasAudio: false
  });

  const getLocalStream = useCallback(async () => {
    try {
      console.log('📹 メディアデバイスを検出中...');
      
      // まずデバイスの権限を要求（これがないとデバイス一覧が取得できない）
      try {
        // 理想的な設定で試す
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });
        
        console.log('✅ カメラとマイク取得成功');
        setCallState(prev => ({
          ...prev,
          localStream: stream,
          hasVideo: true,
          hasAudio: true,
          error: null
        }));
        return stream;
        
      } catch (firstError) {
        console.warn('カメラとマイクの同時取得失敗、個別に試します...');
        
        // 音声のみで試す
        try {
          const audioStream = await navigator.mediaDevices.getUserMedia({
            video: false,
            audio: true
          });
          
          console.log('🎤 マイクのみ取得成功');
          setCallState(prev => ({
            ...prev,
            localStream: audioStream,
            hasVideo: false,
            hasAudio: true,
            error: null
          }));
          return audioStream;
          
        } catch (audioError) {
          console.warn('マイク取得失敗');
          
          // ビデオのみで試す
          try {
            const videoStream = await navigator.mediaDevices.getUserMedia({
              video: true,
              audio: false
            });
            
            console.log('📹 カメラのみ取得成功');
            setCallState(prev => ({
              ...prev,
              localStream: videoStream,
              hasVideo: true,
              hasAudio: false,
              error: null
            }));
            return videoStream;
            
          } catch (videoError) {
            throw new Error('カメラもマイクも利用できません');
          }
        }
      }
      
    } catch (error: any) {
      console.error('❌ メディア取得完全失敗:', error);
      
      let errorMessage = 'メディアデバイスへのアクセスに失敗しました。\n\n';
      
      if (error.name === 'NotFoundError') {
        errorMessage += '📹 カメラまたはマイクが見つかりません。\n';
        errorMessage += '• 外部デバイスの場合は接続を確認してください\n';
        errorMessage += '• ノートPCの場合はカメラが無効になっていないか確認してください';
      } else if (error.name === 'NotAllowedError') {
        errorMessage += '🔐 アクセスが拒否されました。\n';
        errorMessage += '• ブラウザのアドレスバーでカメラ/マイクを許可してください\n';
        errorMessage += '• ブラウザを再読み込みしてください';
      } else if (error.name === 'NotReadableError') {
        errorMessage += '🔒 デバイスが使用中です。\n';
        errorMessage += '• 他のアプリ（Zoom、Teams等）を終了してください\n';
        errorMessage += '• ブラウザの他のタブを確認してください';
      }
      
      setCallState(prev => ({
        ...prev,
        error: errorMessage
      }));
      
      throw new Error(errorMessage);
    }
  }, []);

  const toggleMute = useCallback(() => {
    if (callState.localStream) {
      const audioTrack = callState.localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setCallState(prev => ({
          ...prev,
          isMuted: !audioTrack.enabled
        }));
      }
    }
  }, [callState.localStream]);

  const toggleVideo = useCallback(() => {
    if (callState.localStream) {
      const videoTrack = callState.localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setCallState(prev => ({
          ...prev,
          isVideoOff: !videoTrack.enabled
        }));
      }
    }
  }, [callState.localStream]);

  // クリーンアップ
  useEffect(() => {
    return () => {
      // コンポーネントがアンマウントされる時にストリームを停止
      if (callState.localStream) {
        callState.localStream.getTracks().forEach(track => {
          track.stop();
        });
      }
    };
  }, [callState.localStream]);

  return {
    callState,
    getLocalStream,
    toggleMute,
    toggleVideo
  };
}