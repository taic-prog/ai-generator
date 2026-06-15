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

export const MAX_PROMPT_LENGTH = 500;
export const MODEL_NAME = "claude-sonnet-4-20250514";
