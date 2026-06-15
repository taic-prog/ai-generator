---
description: セキュリティルール。コード変更時に常に確認する。違反は即修正する。
---

# セキュリティルール

## APIキー管理（最重要）

- `ANTHROPIC_API_KEY` は `src/app/api/generate/route.ts` 内でのみ参照する
- `NEXT_PUBLIC_` プレフィックスを付けた環境変数にAPIキーを格納してはならない
- クライアントコンポーネント（`"use client"` を含むファイル）に `process.env.ANTHROPIC_API_KEY` を渡してはならない
- `.env.local` は `.gitignore` に含まれていることを定期的に確認する

**違反例（禁止）:**
```typescript
// ❌ クライアントに渡している
const apiKey = process.env.ANTHROPIC_API_KEY;
return <Component apiKey={apiKey} />;

// ❌ NEXT_PUBLIC_ はブラウザに露出する
NEXT_PUBLIC_ANTHROPIC_KEY=sk-ant-...
```

## iframe サンドボックス

- 生成HTMLを表示するiframeの `sandbox` 属性は `allow-scripts` のみ許可する
- `allow-same-origin` を追加してはならない（追加するとXSSリスクが発生する）
- `allow-forms`・`allow-popups`・`allow-top-navigation` も追加禁止

**正しい実装:**
```tsx
<iframe sandbox="allow-scripts" srcDoc={html} title="プレビュー" />
```

## 入力バリデーション

- `/api/generate/route.ts` でプロンプトの型・長さ（MAX_PROMPT_LENGTH）を必ず検証する
- クライアント側のバリデーションはUXのためであり、サーバー側バリデーションの代替にはならない
- APIルートでは `prompt` が `string` 型かつ空でないことを確認する

## レート制限

- IPベースのレート制限（10リクエスト/分）を `src/lib/rateLimit.ts` で実装済み
- レート制限ロジックを削除・緩和する場合は理由を明記しレビューを受ける
- 超過時は `429` ステータスと `Retry-After` ヘッダーを返す

## 依存パッケージ

- `npm audit` で高・重大脆弱性が検出された場合は即対応する
- 新しいパッケージを追加する前にその必要性を確認する（バンドルサイズとセキュリティリスクの両面から）
