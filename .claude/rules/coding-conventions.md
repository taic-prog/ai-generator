---
description: このプロジェクトのコーディング規約。ファイル編集・新規作成時に常に適用する。
---

# コーディング規約

## ファイル・ディレクトリ

- コンポーネント: `src/components/PascalCase.tsx`
- フック: `src/hooks/useCamelCase.ts`
- ライブラリ: `src/lib/camelCase.ts`
- 型定義: `src/types/index.ts`（共通型はここに集約）
- APIルート: `src/app/api/<endpoint>/route.ts`

## TypeScript

- `any` 型は使用禁止。不明な型は `unknown` を使い型ガードで絞り込む
- `as` キャストは最小限に。`as HTMLButtonElement` 程度は許容、`as unknown as Foo` は禁止
- Props インターフェースはコンポーネントファイル内にインライン定義する
- 共通型・定数は `src/types/index.ts` に追加する（マジックナンバー・文字列を直接書かない）

## コンポーネント

- `"use client"` は状態・イベント・ブラウザAPIを使う場合のみ付与する
- Monaco Editor など SSR 非対応ライブラリは `dynamic(() => import(...), { ssr: false })` で読み込む
- スタイルはインライン `style` プロパティか Tailwind クラスを使う。新規 CSS ファイルは作らない
- カラーは `src/app/globals.css` の `@theme` で定義した値を使い、ハードコードしない

## 命名規則

| 対象 | 規則 | 例 |
|------|------|----|
| コンポーネント関数 | PascalCase | `function PromptInput()` |
| カスタムフック | `use` + PascalCase | `useGenerate` |
| イベントハンドラ | `handle` + 動詞 | `handleSubmit`, `handleDownload` |
| 状態変数 | camelCase の名詞 | `isGenerating`, `showCode` |
| 定数 | UPPER_SNAKE_CASE | `MAX_PROMPT_LENGTH` |

## コメント

- コードを読めばわかることはコメントしない
- 「なぜ」が非自明な場合のみ1行で書く
- 関数・コンポーネントの JSDoc は書かない
