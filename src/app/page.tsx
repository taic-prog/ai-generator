"use client";

import React, { useCallback, useEffect, useId, useRef, useState } from "react";
import { Header } from "@/components/Header";
import { PromptInput } from "@/components/PromptInput";
import { PreviewPane } from "@/components/PreviewPane";
import { StatusBar } from "@/components/StatusBar";
import { useGenerate } from "@/hooks/useGenerate";
import { AppStyle, APP_STYLES, AppTaste, APP_TASTES, MAX_HISTORY_TURNS } from "@/types";

// APG radiogroup パターン: roving tabindex + 矢印キーで選択移動。Enter 抑止は各ボタン側で行う
function makeRadioKeyDown<T extends string>(setter: (val: T) => void) {
  return (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) return;
    const radios = Array.from(
      e.currentTarget.querySelectorAll<HTMLButtonElement>("button:not(:disabled)")
    );
    const idx = radios.indexOf(e.target as HTMLButtonElement);
    if (idx === -1) return;
    e.preventDefault();
    const delta = (e.key === "ArrowRight" || e.key === "ArrowDown") ? 1 : -1;
    const next = radios[(idx + delta + radios.length) % radios.length];
    if (next.dataset.value === undefined) return;
    next.focus();
    setter(next.dataset.value as T);
  };
}

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState<AppStyle>("dark");
  const [taste, setTaste] = useState<AppTaste>("cool");
  const styleId = useId();
  const tasteId = useId();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const prevIsGenerating = useRef(false);
  const [previewKey, setPreviewKey] = useState(0);
  const { state, history, generate, abort, reset } = useGenerate();
  const isGenerating = state.status === "generating";
  const isFollowUp = history.length > 0;

  // 生成完了後に textarea へフォーカスを当てる（disabled 解除後に行う必要があるため useEffect で実行）
  useEffect(() => {
    if (prevIsGenerating.current && !isGenerating && state.status === "done") {
      textareaRef.current?.focus();
    }
    prevIsGenerating.current = isGenerating;
  }, [isGenerating, state.status]);

  const handleSubmit = useCallback(async () => {
    if (prompt.trim() === "" || isGenerating) return;
    const succeeded = await generate(prompt, style, taste);
    if (succeeded) setPrompt("");
  }, [prompt, isGenerating, style, taste, generate]);

  const handleCancel = useCallback(() => {
    abort();
    setPreviewKey((k) => k + 1);
  }, [abort]);

  const handleReset = useCallback(() => {
    reset();
    setPrompt("");
    setStyle("dark");
    setTaste("cool");
    setPreviewKey((k) => k + 1);
  }, [reset]);

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "var(--color-bg-main)" }}>
      <Header />

      <main className="flex-1 flex flex-col sm:flex-row overflow-hidden" style={{ minHeight: 0 }}>
        {/* 左ペイン */}
        <div
          className="w-full sm:w-1/2 flex flex-col gap-4 p-4 overflow-y-auto"
          style={{ borderRightWidth: "1px", borderRightStyle: "solid", borderRightColor: "var(--color-border)" }}
        >
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-sm font-mono font-semibold mb-1" style={{ color: "var(--color-text-primary)" }}>
                {isFollowUp ? "変更指示" : "プロンプト"}
              </h2>
              <p className="text-xs font-mono" style={{ color: "var(--color-text-secondary)" }}>
                {isFollowUp
                  ? history.length < MAX_HISTORY_TURNS
                    ? `${history.length}回目の編集 — 残り${MAX_HISTORY_TURNS - history.length}回`
                    : `${history.length}回目の編集 — 変更点を入力してください`
                  : "作りたいアプリを日本語または英語で説明してください"}
              </p>
            </div>
            {(isFollowUp || isGenerating) && (
              <button
                onClick={isGenerating ? handleCancel : handleReset}
                className="shrink-0 text-xs font-mono px-2.5 py-1 rounded transition-colors"
                style={{
                  borderWidth: "1px",
                  borderStyle: "solid",
                  borderColor: "var(--color-border)",
                  color: "var(--color-text-secondary)",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.color = "var(--color-text-primary)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.color = "var(--color-text-secondary)";
                }}
              >
                {isGenerating ? "キャンセル" : "最初から"}
              </button>
            )}
          </div>

          {/* スタイル選択 - フォローアップ時は非表示 */}
          {!isFollowUp && <div className="flex flex-col gap-2">
            <p id={styleId} className="text-xs font-mono" style={{ color: "var(--color-text-secondary)" }}>スタイル</p>
            <div
              role="radiogroup"
              aria-labelledby={styleId}
              className="flex flex-wrap gap-2"
              onKeyDown={!isGenerating ? makeRadioKeyDown<AppStyle>(setStyle) : undefined}
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
          </div>}

          {/* テイスト選択 - フォローアップ時は非表示 */}
          {!isFollowUp && <div className="flex flex-col gap-2">
            <p id={tasteId} className="text-xs font-mono" style={{ color: "var(--color-text-secondary)" }}>テイスト</p>
            <div
              role="radiogroup"
              aria-labelledby={tasteId}
              className="flex flex-wrap gap-2"
              onKeyDown={!isGenerating ? makeRadioKeyDown<AppTaste>(setTaste) : undefined}
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
          </div>}

          <PromptInput
            ref={textareaRef}
            value={prompt}
            onChange={setPrompt}
            onSubmit={handleSubmit}
            isGenerating={isGenerating}
            isFollowUp={isFollowUp}
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
            key={previewKey}
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
