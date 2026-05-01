# Voice-Bridge-BOT

> 複数のDiscordサーバーのVCを繋ぎ、リアルタイムで音声を双方向中継するBOTです。  
> A Discord BOT that bridges voice channels across multiple servers in real-time.

---

## 概要 / Overview

**Voice-Bridge-BOT** は「ユニオン」という概念を使って、異なるDiscordサーバーのボイスチャンネルをグループ化し、音声をリアルタイムで相互中継します。複数人の同時発話にも対応しており、PCMレベルでのミキシングによりエコーバックを防止しています。

**Voice-Bridge-BOT** uses the concept of "Unions" to group voice channels across different Discord servers and relay audio in real-time. It supports simultaneous multi-user speech and prevents echo-back through PCM-level mixing.

---

## 機能 / Features

- 🔗 複数サーバーのVCをユニオンIDで紐付けて音声中継 / Bridge VCs across servers using Union IDs
- 🎚️ PCMミキシングによる複数人同時発話対応 / Multi-user simultaneous speech via PCM mixing
- 🔇 エコーバック防止（自サーバーの音声は自サーバーに返さない）/ Echo-back prevention
- 💾 BOT再起動後もユニオン情報を保持 / Persistent union data across restarts
- 🧩 ユニオンへの参加・脱退をコマンドで管理 / Union membership managed via commands

---

## 動作環境 / Requirements

| 項目 | 要件 |
|------|------|
| Node.js | v18以上 / v18 or higher |
| OS | Windows（ffmpeg.exeを使用）/ Windows (uses ffmpeg.exe) |
| ffmpeg | 別途ダウンロードが必要 / Must be downloaded separately |
| Discord BOT | Privileged Intents: `GUILDS`, `GUILD_VOICE_STATES` |

---

## セットアップ / Setup

### 1. リポジトリのクローン / Clone the repository

```bash
git clone https://github.com/yourname/voice-bridge-bot.git
cd voice-bridge-bot
```

### 2. パッケージのインストール / Install packages

```bash
npm install
```

使用パッケージ / Dependencies:

- `discord.js`
- `@discordjs/voice`
- `prism-media`
- `mediaplex`
- `audio-mixer`
- `dotenv`

### 3. ffmpegの配置 / Place ffmpeg

> ⚠️ `ffmpeg.exe` はライセンスの都合上リポジトリに含まれていません。別途ダウンロードして配置してください。  
> `ffmpeg.exe` is not included in this repository due to licensing. Please download and place it manually.

[ffmpeg公式サイト](https://ffmpeg.org/download.html) またはWindows向けビルド配布サイト（[gyan.dev](https://www.gyan.dev/ffmpeg/builds/) 推奨）から `ffmpeg.exe` をダウンロードし、プロジェクトルート（`index.js` と同じ場所）に配置してください。

Download `ffmpeg.exe` from the [official ffmpeg site](https://ffmpeg.org/download.html) or a Windows build (recommended: [gyan.dev](https://www.gyan.dev/ffmpeg/builds/)) and place it in the project root (same directory as `index.js`).

```
voice-bridge-bot/
├── index.js
├── ffmpeg.exe   ← ここに配置 / Place here
└── ...
```

### 4. 環境変数の設定 / Configure environment variables

`.env` ファイルをプロジェクトルートに作成してください。  
Create a `.env` file in the project root:

```env
DISCORD_TOKEN=your_bot_token_here
```

### 5. BOTの起動 / Start the BOT

```bash
node index.js
```

---

## コマンド一覧 / Commands

### ユニオン管理 / Union Management

| コマンド | 説明 / Description |
|---------|-------------------|
| `/create_union [id]` | ユニオンを作成します。IDを省略すると自動生成。/ Create a union. ID is auto-generated if omitted. |
| `/union_join <id>` | このサーバーを指定ユニオンに参加登録します。/ Register this server to a union. |
| `/union_leave <id>` | このサーバーをユニオンから脱退させます。/ Remove this server from a union. |

### VC操作 / Voice Channel Control

| コマンド | 説明 / Description |
|---------|-------------------|
| `/vc_join` | BOTをあなたのVCに呼びます（`/union_join` 済みが前提）。/ Make the BOT join your VC (requires prior `/union_join`). |
| `/vc_leave` | BOTをVCから退出させます。/ Make the BOT leave the VC. |

### 使用手順 / Usage Flow

```
1. /create_union <id>     # ユニオン作成（どちらかのサーバーで1回）
2. /union_join <id>       # 各サーバーで実行
3. /vc_join               # 各サーバーのVCでBOTを呼ぶ
→ 音声中継開始！

4. /vc_leave              # VCから退出
5. /union_leave <id>      # ユニオンから脱退
```

---

## ファイル構成 / File Structure

```
voice-bridge-bot/
├── index.js              # エントリポイント・コマンド処理 / Entry point & command handling
├── ffmpeg.exe            # ffmpeg本体（別途配置）/ ffmpeg binary (place manually)
├── .env                  # 環境変数 / Environment variables
├── data/
│   └── unions.json       # ユニオン永続化データ / Persistent union data
└── src/
    ├── UnionManager.js   # ユニオンの管理 / Union management
    ├── VoiceHandler.js   # 音声の受信・送信処理 / Audio input/output handling
    └── Mixer.js          # PCMミキシング・エコーバック防止 / PCM mixing & echo prevention
```

---

## .gitignore 推奨設定 / Recommended .gitignore

```gitignore
ffmpeg.exe
.env
data/
node_modules/
```

---

## 注意事項 / Notes

> ⚠️ **BOT再起動について / BOT Restart**  
> 再起動後もユニオンの登録情報（`data/unions.json`）は保持されますが、VCへの接続は切れます。再起動後は各サーバーで `/vc_join` を再実行してください。  
> Union registrations persist after restart, but VC connections are lost. Run `/vc_join` again after restarting.

> ⚠️ **Node.js バージョンについて / Node.js Version**  
> `@discordjs/opus` は Node.js v24 でビルドできません。代わりに `mediaplex` を使用しています。  
> `@discordjs/opus` cannot be built on Node.js v24. `mediaplex` is used as a substitute.

> ⚠️ **Windowsのみ対応 / Windows Only**  
> 現在 `ffmpeg.exe` を直接参照しているため、Windows環境専用です。Linux/macOS対応には `ffmpeg` コマンドへの切り替えが必要です。  
> Currently Windows-only due to direct `ffmpeg.exe` reference. Linux/macOS support requires switching to the `ffmpeg` command.

> ⚠️ **遅延について / Latency**  
> Opus エンコード → 送信 → PCMデコード → ミキシング → 再エンコードの処理により、若干の遅延が発生します。通常の会話では気にならない程度です。  
> Some latency occurs due to the Opus encode → transmit → PCM decode → mix → re-encode pipeline. This is generally acceptable for normal conversation.

---

## 既知の問題 / Known Issues

- 長時間稼働時にメモリが増加する可能性があります / Memory usage may increase during long sessions
- ユーザーが短く区切って話すとストリームの切断・再接続が頻発します / Frequent stream reconnections may occur when users speak in short bursts

---

## ライセンス / License

MIT © 2026 Kinakomochi Milk

詳細は [LICENSE](./LICENSE) を参照してください。/ See [LICENSE](./LICENSE) for details.
