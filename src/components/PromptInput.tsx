"use client";

import { KeyboardEvent } from "react";
import { QUICK_CHIPS, MAX_PROMPT_LENGTH } from "@/types";

interface PromptInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  isGenerating: boolean;
}

export function PromptInput({ value, onChange, onSubmit, isGenerating }: PromptInputProps) {
  const remaining = MAX_PROMPT_LENGTH - value.length;
  const isOverLimit = remaining < 0;
  const isNearLimit = remaining >= 0 && remaining < 50;
  const canSubmit = !isGenerating && value.trim() !== "" && !isOverLimit;

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && canSubmit) {
      e.preventDefault();
      onSubmit();
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {/* クイック例チップ */}
      <div className="flex flex-wrap gap-2">
        {QUICK_CHIPS.map((chip) => (
          <button
            key={chip.label}
            onClick={() => onChange(chip.prompt)}
            disabled={isGenerating}
            className="px-3 py-1 rounded-full text-xs font-mono transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ backgroundColor: "#1e1e2e", color: "#9999b3", border: "1px solid #2a2a3e" }}
            onMouseEnter={(e) => {
              if (!isGenerating) {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#2a2a3e";
                (e.currentTarget as HTMLButtonElement).style.color = "#f0eff8";
              }
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#1e1e2e";
              (e.currentTarget as HTMLButtonElement).style.color = "#9999b3";
            }}
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* テキストエリア */}
      <div className="relative">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isGenerating}
          placeholder="作りたいアプリを自然言語で説明してください..."
          aria-label="プロンプト入力"
          aria-describedby="char-count"
          rows={5}
          className="w-full resize-none rounded-lg px-4 py-3 text-sm font-mono outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            backgroundColor: "#111118",
            color: "#f0eff8",
            border: "1px solid #1e1e2e",
            lineHeight: "1.6",
          }}
          onFocus={(e) => (e.currentTarget.style.borderColor = "#7c6af7")}
          onBlur={(e) => (e.currentTarget.style.borderColor = "#1e1e2e")}
        />
        <span
          id="char-count"
          className="absolute bottom-2 right-3 text-xs font-mono"
          style={{ color: isOverLimit ? "#f87171" : isNearLimit ? "#f59e0b" : "#9999b3" }}
        >
          {value.length}/{MAX_PROMPT_LENGTH}
        </span>
      </div>

      {/* 生成ボタン */}
      <button
        onClick={onSubmit}
        disabled={!canSubmit}
        className="w-full py-2.5 rounded-lg text-sm font-mono font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ backgroundColor: "#7c6af7", color: "#f0eff8" }}
        onMouseEnter={(e) => {
          if (canSubmit) (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#6b5ce0";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#7c6af7";
        }}
      >
        {isGenerating ? (
          <span className="flex items-center justify-center gap-2">
            <span className="inline-block w-3.5 h-3.5 border-2 rounded-full animate-spin"
              style={{ borderColor: "#f0eff8 transparent transparent transparent" }} />
            生成中...
          </span>
        ) : (
          <span>生成する <span className="opacity-60 text-xs">(Cmd/Ctrl+Enter)</span></span>
        )}
      </button>
    </div>
  );
}
