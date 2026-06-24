"use client";

import { useCallback, useState } from "react";
import { Header } from "@/components/Header";
import { PromptInput } from "@/components/PromptInput";
import { PreviewPane } from "@/components/PreviewPane";
import { StatusBar } from "@/components/StatusBar";
import { useGenerate } from "@/hooks/useGenerate";
import { AppStyle, APP_STYLES, AppTaste, APP_TASTES } from "@/types";

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState<AppStyle>("dark");
  const [taste, setTaste] = useState<AppTaste>("cool");
  const { state, generate } = useGenerate();
  const isGenerating = state.status === "generating";

  const handleSubmit = useCallback(() => {
    if (prompt.trim() === "" || isGenerating) return;
    generate(prompt, style, taste);
  }, [prompt, isGenerating, style, taste, generate]);

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#0a0a0f" }}>
      <Header />

      <main className="flex-1 flex flex-col sm:flex-row overflow-hidden" style={{ minHeight: 0 }}>
        {/* 左ペイン */}
        <div
          className="w-full sm:w-1/2 flex flex-col gap-4 p-4 overflow-y-auto"
          style={{ borderRight: "1px solid #1e1e2e" }}
        >
          <div>
            <h2 className="text-sm font-mono font-semibold mb-1" style={{ color: "#f0eff8" }}>
              プロンプト
            </h2>
            <p className="text-xs font-mono" style={{ color: "#9999b3" }}>
              作りたいアプリを日本語または英語で説明してください
            </p>
          </div>

          {/* スタイル選択 */}
          <div className="flex flex-col gap-2">
            <p className="text-xs font-mono" style={{ color: "#9999b3" }}>スタイル</p>
            <div className="flex flex-wrap gap-2">
              {APP_STYLES.map((s) => {
                const isSelected = style === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => setStyle(s.id)}
                    disabled={isGenerating}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{
                      backgroundColor: isSelected ? "#1e1a3e" : "#111118",
                      color: isSelected ? "#f0eff8" : "#9999b3",
                      border: `1px solid ${isSelected ? "#7c6af7" : "#1e1e2e"}`,
                    }}
                  >
                    <span
                      className="inline-block w-2.5 h-2.5 rounded-sm"
                      style={{ backgroundColor: s.swatchColor }}
                    />
                    {s.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* テイスト選択 */}
          <div className="flex flex-col gap-2">
            <p className="text-xs font-mono" style={{ color: "#9999b3" }}>テイスト</p>
            <div className="flex flex-wrap gap-2">
              {APP_TASTES.map((t) => {
                const isSelected = taste === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setTaste(t.id)}
                    disabled={isGenerating}
                    className="px-3 py-1.5 rounded-full text-xs font-mono transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{
                      backgroundColor: isSelected ? "#1e1a3e" : "#111118",
                      color: isSelected ? "#f0eff8" : "#9999b3",
                      border: `1px solid ${isSelected ? "#7c6af7" : "#1e1e2e"}`,
                    }}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>

          <PromptInput
            value={prompt}
            onChange={setPrompt}
            onSubmit={handleSubmit}
            isGenerating={isGenerating}
          />

          {state.status === "error" && state.error && (
            <div
              className="rounded-lg px-4 py-3 text-sm font-mono"
              style={{ backgroundColor: "#2a1a1a", color: "#f87171", border: "1px solid #3a2020" }}
            >
              {state.error}
            </div>
          )}
        </div>

        {/* 右ペイン */}
        <div className="w-full sm:w-1/2 flex flex-col" style={{ minHeight: "400px" }}>
          <PreviewPane
            html={state.extractedHtml}
            rawStream={state.rawStream}
            status={state.status}
          />
        </div>
      </main>

      <StatusBar
        status={state.status}
        inputTokens={state.inputTokens}
        outputTokens={state.outputTokens}
      />
    </div>
  );
}
