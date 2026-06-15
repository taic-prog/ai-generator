"use client";

import { useState, useCallback, useRef } from "react";
import { GenerationState } from "@/types";
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

  const generate = useCallback(async (prompt: string) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    setState({
      ...initialState,
      status: "generating",
    });

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || `HTTPエラー: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("レスポンスストリームを取得できませんでした");

      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

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
            accumulated += parsed.text;
            const finalAcc = accumulated;

            setState((prev) => {
              const newRaw = prev.rawStream + parsed.text;
              // </html>が届いたタイミングでiframe用HTMLを確定
              const shouldExtract = isHtmlComplete(newRaw) && prev.extractedHtml === "";
              const extracted = shouldExtract ? (extractHtml(newRaw) ?? "") : prev.extractedHtml;
              return {
                ...prev,
                rawStream: newRaw,
                extractedHtml: extracted,
              };
            });
            void finalAcc;
          }
        }
      }

      // ストリーム完了後にもHTML抽出を試みる（念のため）
      setState((prev) => {
        const extracted =
          prev.extractedHtml !== "" ? prev.extractedHtml : (extractHtml(prev.rawStream) ?? "");
        return { ...prev, status: "done", extractedHtml: extracted };
      });
    } catch (err) {
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
