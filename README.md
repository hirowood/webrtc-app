# WebRTC Video Call App

WebRTCとSocket.IOを使用したリアルタイムビデオ通話アプリケーションです。

## 🚀 機能

- ✅ リアルタイムビデオ/音声通話
- ✅ 複数人での通話対応
- ✅ マイクミュート機能
- ✅ カメラオン/オフ機能
- ✅ ルームベースの通話管理

## 📁 プロジェクト構造

```
webrtc-app/
├── backend/          # Express.js シグナリングサーバー
│   ├── src/
│   │   ├── server.ts           # メインサーバー
│   │   ├── socket/
│   │   │   └── socketHandler.ts # Socket.IOハンドラー
│   │   └── types/
│   │       └── socket.types.ts  # 型定義
│   └── package.json
│
└── frontend/         # Next.js クライアント
    ├── src/
    │   ├── app/                 # Next.js App Router
    │   ├── components/          # UIコンポーネント
    │   ├── hooks/              # カスタムフック
    │   └── types/              # 型定義
    └── package.json
```

## 🛠 セットアップ

### 必要な環境

- Node.js 18以上
- npm または yarn

### インストール手順

1. **バックエンドのセットアップ**
```bash
cd backend
npm install
npm run dev
```
サーバーは http://localhost:3001 で起動します

2. **フロントエンドのセットアップ**（別ターミナル）
```bash
cd frontend
npm install
npm run dev
```
アプリケーションは http://localhost:3000 で起動します

## 📖 使い方

1. ブラウザで http://localhost:3000 にアクセス
2. 任意のルームIDを入力（例: room-123）
3. 「通話を開始」をクリック
4. カメラとマイクの使用を許可
5. 他のユーザーに同じルームIDを共有
6. 同じルームIDで参加したユーザーと通話開始

## 🔧 技術スタック

### バックエンド
- Express.js - Webサーバー
- Socket.IO - WebSocketによるリアルタイム通信
- TypeScript - 型安全な開発

### フロントエンド
- Next.js 14 - Reactフレームワーク
- TypeScript - 型安全な開発
- Tailwind CSS - スタイリング
- Socket.IO Client - サーバーとの通信
- WebRTC API - P2Pビデオ/音声通信

## 📝 アーキテクチャ

### シグナリングフロー
1. ユーザーAがルームに参加
2. ユーザーBが同じルームに参加
3. サーバーがユーザーAにユーザーBの参加を通知
4. ユーザーAがWebRTC Offerを作成してユーザーBに送信
5. ユーザーBがOfferを受信し、Answerを返信
6. ICE候補の交換
7. P2P接続確立

### 責務分離
- **サーバー**: シグナリングの中継のみ（メディアストリームは扱わない）
- **クライアント**: WebRTC接続の管理、メディア処理
- **カスタムフック**: ロジックの再利用とテストの容易性

## 🚧 今後の改善点

### Phase 2 - 機能追加
- [ ] 画面共有機能
- [ ] チャット機能
- [ ] 録画機能
- [ ] 仮想背景

### Phase 3 - 品質向上
- [ ] エラーリトライ機能
- [ ] 接続品質インジケーター
- [ ] 帯域幅の最適化
- [ ] モバイル対応の改善

## 📄 ライセンス

MIT

## 🤝 コントリビューション

プルリクエストを歓迎します！
