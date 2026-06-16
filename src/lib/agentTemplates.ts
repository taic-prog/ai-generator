export interface TemplateFile {
  path: string;
  content: string;
}

export interface AgentTemplate {
  id: string;
  label: string;
  description: string;
  tools: string;
  agentDescription: string;
  body: string;
}

export function getAgentTemplateFile(agent: AgentTemplate): TemplateFile {
  const frontmatter = `---\nname: ${agent.id}\ndescription: ${agent.agentDescription}\ntools: ${agent.tools}\n---`;
  return {
    path: `.claude/agents/${agent.id}.md`,
    content: `${frontmatter}\n\n${agent.body}`,
  };
}

const CLAUDE_MD = `@.claude/rules/coding-conventions.md
@.claude/rules/security.md
`;

const README_MD = `# このフォルダについて

このZIPには、ダウンロードしたHTMLアプリを [Claude Code](https://claude.com/claude-code) で改善し続けるためのテンプレートが入っています。

## 使い方

1. ダウンロードしたHTMLファイル（例: \`generated-app.html\`）と同じフォルダにこのZIPの内容を展開する
2. ターミナルでそのフォルダを開き \`claude\` を実行する
3. 「カウンターの最大値を100にして」のように、自然言語で改善したい内容を伝える

## フォルダ構成

- \`CLAUDE.md\` — Claude Codeが起動時に読み込む設定ファイル
- \`.claude/agents/\` — ダウンロード時に選択した専門サブエージェント
- \`.claude/rules/\` — このアプリ向けのコーディング規約・セキュリティルール
`;

const RULE_CODING_CONVENTIONS = `---
description: 単一HTMLファイルアプリのコーディング規約。ファイル編集時に常に適用する。
---

# コーディング規約

## ファイル構成

- アプリ本体は単一のHTMLファイルのみ。新規ファイルの作成は基本的に行わない
- CSSは \`<style>\` タグ内、JavaScriptは \`<script>\` タグ内にインラインで記述する

## 禁止事項

- 外部CDN・フォント・ライブラリの読み込み（\`<script src="https://...">\`・\`<link href="https://...">\`）
- ビルドツール・パッケージマネージャーの導入
- フレームワーク（React/Vue/Angular等）の追加

## 命名規則

- CSSクラス名・JS変数名は既存ファイル内の命名スタイル（camelCase/kebab-case等）に合わせる
- 新しい命名規則を独自に持ち込まない

## コメント

- 自明な処理にはコメントを書かない
- 非自明な理由（ブラウザ固有の回避策など）がある場合のみ簡潔に記す
`;

const RULE_SECURITY = `---
description: 単一HTMLファイルアプリのセキュリティルール。コード変更時に常に確認する。
---

# セキュリティルール

## このファイルの特性

- このHTMLファイルはサーバーやiframeサンドボックスを介さず、ブラウザで直接開かれることを前提とする
- そのため通常のWebアプリより厳しい制約を自分自身に課す必要がある

## 禁止事項

- \`eval()\`・\`new Function()\` の使用
- 外部ドメインへの \`fetch\`/\`XMLHttpRequest\`/\`<script src="https://...">\`/\`<link href="https://...">\`
- \`innerHTML\` への未エスケープのユーザー入力代入（XSSの原因になる）

**正しい実装（ユーザー入力をDOMに挿入する場合）:**

\`\`\`js
// 正: textContent を使う
el.textContent = userInput;

// 誤: innerHTML に直接代入しない
el.innerHTML = userInput;
\`\`\`

## データの扱い

- 保存が必要な場合は \`localStorage\` のみを使う。外部送信は行わない
- 機密情報（APIキー・パスワード）をコードに埋め込まない
`;

export const BASE_TEMPLATE_FILES: TemplateFile[] = [
  { path: "CLAUDE.md", content: CLAUDE_MD },
  { path: "README.md", content: README_MD },
  { path: ".claude/rules/coding-conventions.md", content: RULE_CODING_CONVENTIONS },
  { path: ".claude/rules/security.md", content: RULE_SECURITY },
];

const FEATURE_BUILDER_BODY = `あなたはこのプロジェクトの機能追加専門エージェントです。

## プロジェクト概要

- このフォルダには自己完結した単一HTMLファイル（\`<style>\`・\`<script>\`がすべてインライン）が1つだけ存在する
- 外部ファイル・ビルドツール・パッケージマネージャーは存在しない。ブラウザで直接開いて動作する
- フレームワーク（React/Vue等）やCDN経由の外部ライブラリは使用しない

## 実装ルール

1. 機能追加前に対象HTMLファイルを \`Read\` で全文読み、既存のスタイル（クラス名・命名規則）と構造を把握する
2. CSSは \`<style>\` タグ内に追記する。新規CSSファイルは作らない
3. JavaScriptは \`<script>\` タグ内に追記する。新規JSファイルは作らない
4. 外部CDN・フォント・APIへの \`fetch\`/\`<script src="https://...">\` は追加しない
5. 既存のインデント・命名スタイルに合わせる
6. 変更後はブラウザで開いて動作確認する旨をユーザーに伝える

## よくある追加機能パターン

| 要望 | 実装方針 |
|------|----------|
| 入力フォームの追加 | 既存のフォーム要素のスタイルをコピーして再利用する |
| データの保存 | \`localStorage\` を使う（サーバー通信は行わない） |
| アニメーション | CSSの \`transition\`/\`@keyframes\` を使う。JSライブラリは追加しない |
`;

const DEBUGGER_BODY = `あなたはこのプロジェクトのデバッグ専門エージェントです。

## 調査手順

1. ユーザーから症状（エラーメッセージ、期待した動作と実際の動作の違い）を確認する
2. 対象HTMLファイルを \`Read\` で全文読み、関連する \`<script>\`・\`<style>\` 部分を特定する
3. ブラウザの開発者コンソールに表示されるエラーがあれば、それを優先的に手がかりにする
4. 原因を特定したら最小限の差分で修正する

## よくある不具合パターン

| 症状 | 確認ポイント |
|------|--------------|
| ボタンを押しても反応しない | \`addEventListener\` の対象セレクタ・タイミング（DOM読み込み前に登録していないか） |
| レイアウトが崩れる | CSSのセレクタ優先度・\`flex\`/\`grid\` の親子関係 |
| 値が更新されない | JS変数のスコープ、DOM要素の再取得忘れ |
| コンソールにエラーが出る | スタックトレースの行番号から該当箇所を特定する |

## 修正時の注意

- 修正は最小限の差分にする。無関係な箇所のリファクタリングはしない
- 修正後は変更箇所と修正理由を簡潔に説明する
`;

const REVIEWER_BODY = `あなたはこのプロジェクトのコードレビュー専門エージェントです。

## レビュー観点

- セキュリティ: \`eval()\`・外部通信・\`innerHTML\` への未エスケープ代入がないか
- 品質: 重複コード・不要なグローバル変数・命名の一貫性
- 動作: イベントリスナーの登録漏れ・タイポ

## レビュー手順

1. 対象HTMLファイルを \`Read\` で全文読む
2. 上記観点に沿って問題点を洗い出す
3. 問題がなければ「LGTM」と報告する。問題があればファイル内の該当箇所を指摘し、修正案を提示する
`;

const ACCESSIBILITY_BODY = `あなたはこのプロジェクトのアクセシビリティ改善専門エージェントです。

## チェック項目

| 項目 | 確認内容 |
|------|----------|
| キーボード操作 | すべてのボタン・入力欄が Tab キーで操作できるか |
| ARIA属性 | アイコンのみのボタンに \`aria-label\` があるか |
| コントラスト | 文字色と背景色のコントラスト比が十分か |
| フォーカス表示 | \`:focus\` 時に視覚的なフォーカスリングが表示されるか |

## 実装ルール

- 既存のCSS/JS構造を維持したまま、最小限の差分で改善する
- 新しい外部ライブラリ（ARIA系ポリフィル等）は追加しない
`;

export const AGENT_TEMPLATES: AgentTemplate[] = [
  {
    id: "feature-builder",
    label: "機能追加",
    description: "新しい機能の追加を手伝う",
    tools: "Bash, Read, Edit, Glob, Grep",
    agentDescription:
      "単一HTMLファイルのアプリに新機能を追加する。要件を伝えると既存のスタイル・実装パターンに合わせて追記する。",
    body: FEATURE_BUILDER_BODY,
  },
  {
    id: "debugger",
    label: "デバッグ",
    description: "バグや不具合の調査・修正を手伝う",
    tools: "Bash, Read, Edit, Glob, Grep",
    agentDescription:
      "単一HTMLファイルのアプリのバグ・不具合を調査・修正する。エラーメッセージや症状を伝えると原因を特定して修正する。",
    body: DEBUGGER_BODY,
  },
  {
    id: "reviewer",
    label: "コードレビュー",
    description: "セキュリティ・品質の観点で変更内容をレビューする",
    tools: "Read, Glob, Grep",
    agentDescription:
      "単一HTMLファイルのアプリの変更内容をレビューする。コード変更後や公開前に呼び出す。セキュリティ・品質の観点でチェックする。",
    body: REVIEWER_BODY,
  },
  {
    id: "accessibility-improver",
    label: "アクセシビリティ改善",
    description: "キーボード操作やコントラストなどを改善する",
    tools: "Read, Edit, Grep",
    agentDescription:
      "単一HTMLファイルのアプリのアクセシビリティを改善する。キーボード操作・コントラスト・読み上げ対応を改善したいときに呼び出す。",
    body: ACCESSIBILITY_BODY,
  },
];
