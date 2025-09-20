// WebRTCとSocket通信で使用する型定義

// ビデオ通話の状態
export interface CallState {
  isConnected: boolean;
  localStream: MediaStream | null;
  remoteStreams: Map<string, MediaStream>;
  isMuted: boolean;
  isVideoOff: boolean;
}

// WebRTC接続の設定
export const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    {
      urls: 'stun:stun.l.google.com:19302'  // Googleの無料STUNサーバー
    }
  ]
};