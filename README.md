# AI App Generator

自然言語でHTMLアプリを即時生成するAIデモSPA。プロンプトを入力すると、Claude APIがストリーミングでHTMLを生成し、sandboxed iframeでその場で実行できます。

## 技術スタック

- **フレームワーク**: Next.js 16 (App Router)
- **スタイリング**: Tailwind CSS v4
- **コードエディタ**: Monaco Editor
- **AI**: Claude API (`claude-sonnet-4-20250514`)
- **デプロイ**: Vercel

## セットアップ

```bash
# 依存パッケージのインストール
npm install

# 環境変数を設定
echo "ANTHROPIC_API_KEY=your_key_here" > .env.local

# 開発サーバー起動
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開いてください。

## 環境変数

| 変数名 | 説明 |
|--------|------|
| `ANTHROPIC_API_KEY` | Anthropic APIキー（[console.anthropic.com](https://console.anthropic.com) で取得） |

## Vercelへのデプロイ

1. このリポジトリをVercelにインポート
2. Environment Variables に `ANTHROPIC_API_KEY` を登録
3. デプロイ実行

## 機能

- プロンプト入力（最大500文字）・クイック例チップ4種
- `Cmd/Ctrl + Enter` で生成実行
- SSEストリーミングによるリアルタイム生成表示
- sandboxed iframeでの安全なプレビュー実行
- 生成コードのダウンロード・コピー
- レート制限（10リクエスト/分）
