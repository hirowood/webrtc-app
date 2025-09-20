// Socket.IOで使用する型定義
// サーバーは中継するだけなので、WebRTC型は簡略化

// WebRTC関連の簡略型定義
interface SimpleRTCSessionDescription {
  type: 'offer' | 'answer';
  sdp: string;
}

interface SimpleRTCIceCandidate {
  candidate: string;
  sdpMLineIndex: number | null;
  sdpMid: string | null;
}

// サーバーからクライアントへ送るイベント
export interface ServerToClientEvents {
  userJoined: (userId: string) => void;
  userLeft: (userId: string) => void;
  offer: (data: { 
    from: string; 
    offer: SimpleRTCSessionDescription 
  }) => void;
  answer: (data: { 
    from: string; 
    answer: SimpleRTCSessionDescription 
  }) => void;
  iceCandidate: (data: { 
    from: string; 
    candidate: SimpleRTCIceCandidate 
  }) => void;
  roomUsers: (users: string[]) => void;
}

// クライアントからサーバーへ送るイベント
export interface ClientToServerEvents {
  joinRoom: (roomId: string) => void;
  leaveRoom: () => void;
  offer: (data: { 
    to: string; 
    offer: SimpleRTCSessionDescription 
  }) => void;
  answer: (data: { 
    to: string; 
    answer: SimpleRTCSessionDescription 
  }) => void;
  iceCandidate: (data: { 
    to: string; 
    candidate: SimpleRTCIceCandidate 
  }) => void;
}

export interface SocketData {
  userId: string;
  roomId?: string;
}