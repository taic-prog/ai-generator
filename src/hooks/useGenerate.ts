"use client";

import { useState, useCallback, useRef } from "react";
import { GenerationState, AppStyle, AppTaste } from "@/types";
import { extractHtml, isHtmlComplete } from "@/lib/htmlExtractor";

const initialState: GenerationState = {
  status: "ready",
  rawStream: "",
  extractedHtml: "",
  inputTokens: 0,
  outputTokens: 0,
  error: null,
};

export function useGenerate() {
  const [state, setState] = useState<GenerationState>(initialState);
  const abortControllerRef = useRef<AbortController | null>(null);

  const generate = useCallback(async (prompt: string, style: AppStyle, taste: AppTaste) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    // このコントローラが現在のリクエストかどうかを確認するガード
    const isCurrentRequest = () => abortControllerRef.current === controller;

    setState({
      ...initialState,
      status: "generating",
    });

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, style, taste }),
        signal: controller.signal,
      });

      if (!response.ok) {
        let errorMessage = `HTTPエラー: ${response.status}`;
        try {
          const data = await response.json();
          if (data.error) errorMessage = data.error;
        } catch {
          // 非JSONレスポンス（Vercel HTMLエラーページ等）は無視してステータスコードを使用
        }
        throw new Error(errorMessage);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("レスポンスストリームを取得できませんでした");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();

        // done時はTextDecoderをフラッシュしてバッファに追記する
        buffer += done ? decoder.decode() : decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        // done時は残ったバッファも含めて全行を処理する（そうでない場合は未完成の行をバッファに残す）
        buffer = done ? "" : (lines.pop() ?? "");

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const raw = line.slice(6).trim();
          if (!raw || raw === "[DONE]") continue;

          let parsed: Record<string, unknown>;
          try {
            parsed = JSON.parse(raw);
          } catch {
            continue;
          }

          if (parsed.type === "error") {
            throw new Error(parsed.message as string);
          }

          if (parsed.type === "usage") {
            setState((prev) => ({
              ...prev,
              inputTokens: parsed.inputTokens as number,
              outputTokens: parsed.outputTokens as number,
            }));
            continue;
          }

          if (typeof parsed.text === "string") {
            const text = parsed.text;
            setState((prev) => {
              const newRaw = prev.rawStream + text;
              const shouldExtract = prev.extractedHtml === "" && isHtmlComplete(newRaw);
              const extracted = shouldExtract ? (extractHtml(newRaw) ?? "") : prev.extractedHtml;
              return {
                ...prev,
                rawStream: newRaw,
                extractedHtml: extracted,
              };
            });
          }
        }

        if (done) break;
      }

      // ストリーム完了後にもHTML抽出を試みる（念のため）
      if (isCurrentRequest()) {
        setState((prev) => {
          const extracted =
            prev.extractedHtml !== "" ? prev.extractedHtml : (extractHtml(prev.rawStream) ?? "");
          return { ...prev, status: "done", extractedHtml: extracted };
        });
      }
    } catch (err) {
      // 後続リクエストがすでに開始している場合は状態を上書きしない
      if (!isCurrentRequest()) return;
      if ((err as Error).name === "AbortError") {
        setState((prev) => ({ ...prev, status: "error", error: "タイムアウトまたはキャンセルされました" }));
      } else {
        setState((prev) => ({
          ...prev,
          status: "error",
          error: err instanceof Error ? err.message : "不明なエラーが発生しました",
        }));
      }
    } finally {
      clearTimeout(timeoutId);
    }
  }, []);

  const reset = useCallback(() => {
    abortControllerRef.current?.abort();
    setState(initialState);
  }, []);

  return { state, generate, reset };
}
