"use client";

import { useState, useCallback, useRef } from "react";
import { GenerationState, AppStyle, AppTaste, ConversationTurn, MAX_HISTORY_TURNS } from "@/types";
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
  const [history, setHistory] = useState<ConversationTurn[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);

  const generate = useCallback(async (prompt: string, style: AppStyle, taste: AppTaste): Promise<boolean> => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    // このコントローラが現在のリクエストかどうかを確認するガード
    const isCurrentRequest = () => abortControllerRef.current === controller;

    // history からマルチターンの messages 配列を構築する
    const messages: { role: "user" | "assistant"; content: string }[] = [
      ...history.flatMap((turn) => [
        { role: "user" as const, content: turn.prompt },
        // U+200B を挿入して ``` をコードフェンス区切りとして誤認識させない
        { role: "assistant" as const, content: `\`\`\`html\n${turn.html.replace(/`{3}/g, "``\u200B`")}\n\`\`\`` },
      ]),
      { role: "user" as const, content: prompt },
    ];

    setState({
      ...initialState,
      status: "generating",
    });

    let rawAccumulated = "";
    let localExtractedHtml = "";
    // "" は falsy なので別フラグで「試行済み」を管理する（extractHtml が null を返した場合も再試行を防ぐ）
    let htmlExtractionDone = false;
    let success = false;

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages, style, taste }),
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
            throw new Error(typeof parsed.message === "string" ? parsed.message : "不明なエラーが発生しました");
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
            rawAccumulated += text;
            if (!htmlExtractionDone && isHtmlComplete(rawAccumulated)) {
              htmlExtractionDone = true;
              localExtractedHtml = extractHtml(rawAccumulated) ?? "";
            }
            setState((prev) => {
              // リセット後にキューイングされた更新が適用されないようにガードする
              if (!isCurrentRequest()) return prev;
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

      if (isCurrentRequest()) {
        const postStreamHtml = extractHtml(rawAccumulated) || localExtractedHtml;
        if (postStreamHtml) {
          setState((prev) => {
            // mid-streamで既に抽出済みのHTMLを優先し、post-streamの貪欲マッチによる上書きを防ぐ
            const extracted = prev.extractedHtml !== "" ? prev.extractedHtml : postStreamHtml;
            return { ...prev, status: "done", extractedHtml: extracted };
          });
          // historyにはmid-stream抽出結果を優先して保存する（貪欲マッチの汚染を避けるため）
          const historyHtml = localExtractedHtml || postStreamHtml;
          const keep = MAX_HISTORY_TURNS - 1;
          setHistory((prev) => [
            ...(keep > 0 ? prev.slice(-keep) : []),
            { prompt, html: historyHtml },
          ]);
          success = true;
        } else {
          // HTMLが抽出できなかった場合はエラーとして扱う
          setState((prev) => ({
            ...prev,
            status: "error",
            error: "HTMLの生成に失敗しました。プロンプトを変更してもう一度お試しください。",
          }));
        }
      }
    } catch (err) {
      // 後続リクエストがすでに開始している場合は状態を上書きしない
      if (!isCurrentRequest()) return false;
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
    return success;
  }, [history]);

  const reset = useCallback(() => {
    abortControllerRef.current?.abort();
    // null にしないと catch 内の isCurrentRequest() が true を返し initialState を上書きする
    abortControllerRef.current = null;
    setState(initialState);
    setHistory([]);
  }, []);

  return { state, history, generate, reset };
}
