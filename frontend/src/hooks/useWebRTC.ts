/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState, useCallback } from 'react';
import { useSocket } from './useSocket';

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ]
};

interface CallState {
  localStream: MediaStream | null;
  remoteStreams: Map<string, MediaStream>;
  isMuted: boolean;
  isVideoOff: boolean;
  error: string | null;
}

export function useWebRTC(roomId: string | null) {
  const { emit, on, off } = useSocket();
  const peersRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  
  const [callState, setCallState] = useState<CallState>({
    localStream: null,
    remoteStreams: new Map(),
    isMuted: false,
    isVideoOff: false,
    error: null
  });

  // ローカルメディア取得
  const getLocalStream = useCallback(async () => {
    try {
      console.log('📹 メディア取得開始...');
      
      // まず理想的な設定で試す
      let stream: MediaStream;
      
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { min: 640, ideal: 1280, max: 1920 },
            height: { min: 480, ideal: 720, max: 1080 }
          },
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            sampleRate: 44100
          }
        });
        console.log('✅ カメラとマイク取得成功');
      } catch (e) {
        // フォールバック：シンプルな設定
        console.log('⚠️ 理想設定失敗、シンプル設定で再試行...');
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });
      }
      
      setCallState(prev => ({
        ...prev,
        localStream: stream,
        error: null
      }));
      
      return stream;
    } catch (error: any) {
      console.error('❌ メディア取得エラー:', error);
      const errorMsg = `メディア取得失敗: ${error.message}`;
      setCallState(prev => ({
        ...prev,
        error: errorMsg
      }));
      throw error;
    }
  }, []);

  // ピア接続を作成
  const createPeerConnection = useCallback((userId: string): RTCPeerConnection => {
    console.log(`🔗 ピア接続作成: ${userId}`);
    
    const pc = new RTCPeerConnection(RTC_CONFIG);
    
    // ローカルストリームを追加
    if (callState.localStream) {
      callState.localStream.getTracks().forEach(track => {
        console.log(`➕ トラック追加: ${track.kind}`);
        pc.addTrack(track, callState.localStream!);
      });
    }

    // リモートストリーム受信
    pc.ontrack = (event) => {
      console.log(`📥 リモートトラック受信: ${event.track.kind}`);
      const [remoteStream] = event.streams;
      
      setCallState(prev => {
        const newStreams = new Map(prev.remoteStreams);
        newStreams.set(userId, remoteStream);
        return {
          ...prev,
          remoteStreams: newStreams
        };
      });
    };

    // ICE候補
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        console.log(`🧊 ICE候補送信`);
        emit('iceCandidate', {
          to: userId,
          candidate: event.candidate.toJSON()
        });
      }
    };

    // 接続状態監視
    pc.onconnectionstatechange = () => {
      console.log(`📡 接続状態 [${userId}]: ${pc.connectionState}`);
      if (pc.connectionState === 'failed') {
        pc.restartIce();
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log(`🧊 ICE接続状態 [${userId}]: ${pc.iceConnectionState}`);
    };

    peersRef.current.set(userId, pc);
    return pc;
  }, [callState.localStream, emit]);

  // Offer作成
  const createOffer = useCallback(async (userId: string) => {
    console.log(`📤 Offer作成: ${userId}`);
    
    const pc = createPeerConnection(userId);
    
    try {
      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true
      });
      
      await pc.setLocalDescription(offer);
      
      emit('offer', {
        to: userId,
        offer: {
          type: offer.type,
          sdp: offer.sdp
        }
      });
      
      console.log('✅ Offer送信完了');
    } catch (error) {
      console.error('❌ Offer作成エラー:', error);
    }
  }, [createPeerConnection, emit]);

  // Offer受信処理
  const handleOffer = useCallback(async (data: any) => {
    console.log(`📥 Offer受信: ${data.from}`);
    
    const pc = createPeerConnection(data.from);
    
    try {
      await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
      
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      
      emit('answer', {
        to: data.from,
        answer: {
          type: answer.type,
          sdp: answer.sdp
        }
      });
      
      console.log('✅ Answer送信完了');
    } catch (error) {
      console.error('❌ Offer処理エラー:', error);
    }
  }, [createPeerConnection, emit]);

  // Answer受信処理
  const handleAnswer = useCallback(async (data: any) => {
    console.log(`📥 Answer受信: ${data.from}`);
    
    const pc = peersRef.current.get(data.from);
    if (!pc) {
      console.error('❌ ピア接続が見つかりません');
      return;
    }
    
    try {
      await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
      console.log('✅ Answer処理完了');
    } catch (error) {
      console.error('❌ Answer処理エラー:', error);
    }
  }, []);

  // ICE候補受信処理
  const handleIceCandidate = useCallback(async (data: any) => {
    console.log(`🧊 ICE候補受信: ${data.from}`);
    
    const pc = peersRef.current.get(data.from);
    if (!pc) return;
    
    try {
      await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
      console.log('✅ ICE候補追加完了');
    } catch (error) {
      console.error('❌ ICE候補追加エラー:', error);
    }
  }, []);

  // ユーザー退出処理
  const handleUserLeft = useCallback((userId: string) => {
    console.log(`👋 ユーザー退出: ${userId}`);
    
    const pc = peersRef.current.get(userId);
    if (pc) {
      pc.close();
      peersRef.current.delete(userId);
    }
    
    setCallState(prev => {
      const newStreams = new Map(prev.remoteStreams);
      newStreams.delete(userId);
      return {
        ...prev,
        remoteStreams: newStreams
      };
    });
  }, []);

  // マイク切り替え
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

  // ビデオ切り替え
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

  // Socket.IOイベント設定
  useEffect(() => {
    if (!roomId || !callState.localStream) return;
    
    console.log('🎯 イベントリスナー設定');
    
    // 新規ユーザー参加
    const handleUserJoined = (userId: string) => {
      console.log(`✨ 新規ユーザー参加: ${userId}`);
      void createOffer(userId);
    };
    
    // 既存ユーザーリスト
    const handleRoomUsers = (users: string[]) => {
      console.log(`👥 既存ユーザー: ${users.length}人`);
      users.forEach(userId => {
        void createOffer(userId);
      });
    };
    
    // イベント登録
    on('userJoined', handleUserJoined);
    on('userLeft', handleUserLeft);
    on('roomUsers', handleRoomUsers);
    on('offer', handleOffer);
    on('answer', handleAnswer);
    on('iceCandidate', handleIceCandidate);
    
    return () => {
      off('userJoined');
      off('userLeft');
      off('roomUsers');
      off('offer');
      off('answer');
      off('iceCandidate');
    };
  }, [roomId, callState.localStream, on, off, createOffer, handleOffer, handleAnswer, handleIceCandidate, handleUserLeft]);

  return {
    callState,
    getLocalStream,
    toggleMute,
    toggleVideo
  };
}