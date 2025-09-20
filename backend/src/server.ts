import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { setupSocketHandlers } from './socket/socketHandler';

const app = express();
const httpServer = createServer(app);

// CORS設定
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));

// ヘルスチェック
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Socket.IOサーバー初期化
const io = new Server(httpServer, {
  cors: {
    origin: 'http://localhost:3000',
    credentials: true
  }
});

// ハンドラー設定
setupSocketHandlers(io);

// サーバー起動
const PORT = 3001;
httpServer.listen(PORT, () => {
  console.log(`サーバー起動: http://localhost:${PORT}`);
});