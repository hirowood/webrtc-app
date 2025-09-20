import { Server, Socket } from 'socket.io';
import {
  ServerToClientEvents,
  ClientToServerEvents,
  SocketData
} from '../types/socket.types';

// ルーム管理用のMap
const rooms = new Map<string, Set<string>>();

export function setupSocketHandlers(io: Server<ClientToServerEvents, ServerToClientEvents>) {
  io.on('connection', (socket: Socket<ClientToServerEvents, ServerToClientEvents>) => {
    console.log(`新規接続: ${socket.id}`);
    
    // joinRoomイベントの処理
    socket.on('joinRoom', (roomId: string) => {
      console.log(`${socket.id} が ${roomId} に参加`);
      
      // Socket.IOの部屋に参加
      socket.join(roomId);
      
      // ルーム管理
      if (!rooms.has(roomId)) {
        rooms.set(roomId, new Set());
      }
      rooms.get(roomId)!.add(socket.id);
      
      // 他のメンバーに通知
      socket.to(roomId).emit('userJoined', socket.id);
      
      // 既存メンバーリストを送信
      const members = Array.from(rooms.get(roomId) || []);
      socket.emit('roomUsers', members.filter(id => id !== socket.id));
    });

    // WebRTCシグナリングの中継
    socket.on('offer', ({ to, offer }) => {
      io.to(to).emit('offer', { from: socket.id, offer });
    });

    socket.on('answer', ({ to, answer }) => {
      io.to(to).emit('answer', { from: socket.id, answer });
    });

    socket.on('iceCandidate', ({ to, candidate }) => {
      io.to(to).emit('iceCandidate', { from: socket.id, candidate });
    });

    // 切断処理
    socket.on('disconnect', () => {
      console.log(`切断: ${socket.id}`);
      // 全ルームから削除
      rooms.forEach((users, roomId) => {
        if (users.has(socket.id)) {
          users.delete(socket.id);
          socket.to(roomId).emit('userLeft', socket.id);
        }
      });
    });
  });
}