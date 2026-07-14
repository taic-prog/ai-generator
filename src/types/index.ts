export type GenerationStatus = "ready" | "generating" | "done" | "error";

export interface GenerationState {
  status: GenerationStatus;
  rawStream: string;
  extractedHtml: string;
  inputTokens: number;
  outputTokens: number;
  error: string | null;
}

export interface QuickChip {
  label: string;
  prompt: string;
}

export const QUICK_CHIPS: QuickChip[] = [
  { label: "カウンター", prompt: "インクリメント/デクリメントボタン付きのカウンターアプリを作ってください" },
  { label: "タイマー", prompt: "スタート・ストップ・リセット機能付きのストップウォッチを作ってください" },
  { label: "カラーパレット", prompt: "クリックでランダムな色を生成するカラーパレット生成アプリを作ってください" },
  { label: "BMI計算機", prompt: "身長と体重を入力してBMIを計算するアプリを作ってください" },
];

export const FOLLOWUP_CHIPS: QuickChip[] = [
  { label: "ダークモード", prompt: "ダークモードとライトモードの切り替えボタンを追加してください" },
  { label: "レスポンシブ", prompt: "スマートフォンでも見やすいようにレスポンシブデザインに対応してください" },
  { label: "アニメーション", prompt: "ボタンやUIのインタラクションにアニメーションを追加してください" },
  { label: "色を変更", prompt: "カラーテーマをより鮮やかな配色に変更してください" },
];

export type AppStyle = "dark" | "light" | "neon" | "pastel" | "classic";

export interface StyleOption {
  id: AppStyle;
  label: string;
  swatchColor: string;
}

export const APP_STYLES: StyleOption[] = [
  { id: "dark",    label: "ダーク",       swatchColor: "#7c6af7" },
  { id: "light",   label: "ライト",       swatchColor: "#3b82f6" },
  { id: "neon",    label: "ネオン",       swatchColor: "#00ff9f" },
  { id: "pastel",  label: "パステル",     swatchColor: "#d946ef" },
  { id: "classic", label: "クラシック",   swatchColor: "#94a3b8" },
];

export type AppTaste = "cute" | "cool" | "pop" | "elegant" | "minimal";

export interface TasteOption {
  id: AppTaste;
  label: string;
}

export const APP_TASTES: TasteOption[] = [
  { id: "cute",    label: "かわいい" },
  { id: "cool",    label: "クール" },
  { id: "pop",     label: "ポップ" },
  { id: "elegant", label: "エレガント" },
  { id: "minimal", label: "ミニマル" },
];

export const MAX_PROMPT_LENGTH = 500;
export const MODEL_NAME = "claude-sonnet-4-20250514";
export const MODEL_DISPLAY_NAME = "claude-sonnet-4";
// AT が polite アナウンスを処理し終えるまでモーダルを閉じない待機時間（ms）
export const ARIA_CLOSE_DELAY_MS = 200;
// フォローアップ編集で保持する最大ターン数（超えると古いものから切り捨て）
export const MAX_HISTORY_TURNS = 5;
// 会話履歴の中間メッセージ1件あたりの最大文字長（生成HTML想定）
export const MAX_HISTORY_CONTENT_LENGTH = 30000;

export interface ConversationTurn {
  prompt: string;
  html: string;
}

// クライアント→APIへ送るメッセージ1件の型
export type MessageParam = { role: "user" | "assistant"; content: string };
