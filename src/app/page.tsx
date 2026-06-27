"use client";

import React, { useCallback, useState } from "react";
import { Header } from "@/components/Header";
import { PromptInput } from "@/components/PromptInput";
import { PreviewPane } from "@/components/PreviewPane";
import { StatusBar } from "@/components/StatusBar";
import { useGenerate } from "@/hooks/useGenerate";
import { AppStyle, APP_STYLES, AppTaste, APP_TASTES } from "@/types";

// APG radiogroup パターン: roving tabindex + 矢印キーで選択移動。Enter 抑止は各ボタン側で行う
function makeRadioKeyDown<T extends string>(setter: (val: T) => void) {
  return (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) return;
    e.preventDefault();
    const radios = Array.from(
      e.currentTarget.querySelectorAll<HTMLButtonElement>("button:not(:disabled)")
    );
    const idx = radios.indexOf(e.target as HTMLButtonElement);
    if (idx === -1) return;
    const delta = (e.key === "ArrowRight" || e.key === "ArrowDown") ? 1 : -1;
    const next = radios[(idx + delta + radios.length) % radios.length];
    next.focus();
    if (!next.dataset.value) return;
    setter(next.dataset.value as T);
  };
}

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
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "var(--color-bg-main)" }}>
      <Header />

      <main className="flex-1 flex flex-col sm:flex-row overflow-hidden" style={{ minHeight: 0 }}>
        {/* 左ペイン */}
        <div
          className="w-full sm:w-1/2 flex flex-col gap-4 p-4 overflow-y-auto"
          style={{ borderRightWidth: "1px", borderRightStyle: "solid", borderRightColor: "var(--color-border)" }}
        >
          <div>
            <h2 className="text-sm font-mono font-semibold mb-1" style={{ color: "var(--color-text-primary)" }}>
              プロンプト
            </h2>
            <p className="text-xs font-mono" style={{ color: "var(--color-text-secondary)" }}>
              作りたいアプリを日本語または英語で説明してください
            </p>
          </div>

          {/* スタイル選択 */}
          <div className="flex flex-col gap-2">
            <p id="style-label" className="text-xs font-mono" style={{ color: "var(--color-text-secondary)" }}>スタイル</p>
            <div
              role="radiogroup"
              aria-labelledby="style-label"
              className="flex flex-wrap gap-2"
              onKeyDown={makeRadioKeyDown<AppStyle>(setStyle)}
            >
              {APP_STYLES.map((s) => {
                const isSelected = style === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    data-value={s.id}
                    onClick={() => setStyle(s.id)}
                    disabled={isGenerating}
                    role="radio"
                    aria-checked={isSelected}
                    tabIndex={isSelected ? 0 : -1}
                    onKeyDown={(e) => { if (e.key === "Enter") e.preventDefault(); }}
                    className="chip-btn flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{
                      borderWidth: "1px",
                      borderStyle: "solid",
                      borderColor: isSelected ? "var(--color-accent)" : "var(--color-border)",
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
            <p id="taste-label" className="text-xs font-mono" style={{ color: "var(--color-text-secondary)" }}>テイスト</p>
            <div
              role="radiogroup"
              aria-labelledby="taste-label"
              className="flex flex-wrap gap-2"
              onKeyDown={makeRadioKeyDown<AppTaste>(setTaste)}
            >
              {APP_TASTES.map((t) => {
                const isSelected = taste === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    data-value={t.id}
                    onClick={() => setTaste(t.id)}
                    disabled={isGenerating}
                    role="radio"
                    aria-checked={isSelected}
                    tabIndex={isSelected ? 0 : -1}
                    onKeyDown={(e) => { if (e.key === "Enter") e.preventDefault(); }}
                    className="chip-btn px-3 py-1.5 rounded-full text-xs font-mono transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{
                      borderWidth: "1px",
                      borderStyle: "solid",
                      borderColor: isSelected ? "var(--color-accent)" : "var(--color-border)",
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
              role="alert"
              className="rounded-lg px-4 py-3 text-sm font-mono"
              style={{ backgroundColor: "var(--color-error-bg)", color: "var(--color-error)", borderWidth: "1px", borderStyle: "solid", borderColor: "var(--color-error-border)" }}
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
