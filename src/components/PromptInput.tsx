"use client";

import { forwardRef, KeyboardEvent, memo } from "react";
import { QUICK_CHIPS, FOLLOWUP_CHIPS, MAX_PROMPT_LENGTH } from "@/types";

interface PromptInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  isGenerating: boolean;
  isFollowUp?: boolean;
}

export const PromptInput = memo(forwardRef<HTMLTextAreaElement, PromptInputProps>(function PromptInput(
  { value, onChange, onSubmit, isGenerating, isFollowUp = false },
  ref
) {
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

  const chips = isFollowUp ? FOLLOWUP_CHIPS : QUICK_CHIPS;

  return (
    <div className="flex flex-col gap-3">
      {/* クイック例チップ */}
      <div className="flex flex-wrap gap-2">
        {chips.map((chip) => (
          <button
            key={chip.label}
            onClick={() => onChange(chip.prompt)}
            disabled={isGenerating}
            className="px-3 py-1 rounded-full text-xs font-mono transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ backgroundColor: "var(--color-border)", color: "var(--color-text-secondary)", borderWidth: "1px", borderStyle: "solid", borderColor: "var(--color-bg-hover)" }}
            onMouseEnter={(e) => {
              if (!isGenerating) {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--color-bg-hover)";
                (e.currentTarget as HTMLButtonElement).style.color = "var(--color-text-primary)";
              }
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--color-border)";
              (e.currentTarget as HTMLButtonElement).style.color = "var(--color-text-secondary)";
            }}
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* テキストエリア */}
      <div className="relative">
        <textarea
          ref={ref}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isGenerating}
          placeholder={
            isFollowUp
              ? "変更点を入力してください（例：ボタンを赤にして、ダークモードを追加して）"
              : "作りたいアプリを自然言語で説明してください..."
          }
          aria-label={isFollowUp ? "変更指示入力" : "プロンプト入力"}
          aria-describedby="char-count"
          rows={5}
          className="w-full resize-none rounded-lg px-4 py-3 text-sm font-mono outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            backgroundColor: "var(--color-bg-surface)",
            color: "var(--color-text-primary)",
            borderWidth: "1px",
            borderStyle: "solid",
            borderColor: "var(--color-border)",
            lineHeight: "1.6",
          }}
          onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-accent)")}
          onBlur={(e) => (e.currentTarget.style.borderColor = "var(--color-border)")}
        />
        <span
          id="char-count"
          className="absolute bottom-2 right-3 text-xs font-mono"
          style={{ color: isOverLimit ? "var(--color-error)" : isNearLimit ? "var(--color-warning)" : "var(--color-text-secondary)" }}
        >
          {value.length}/{MAX_PROMPT_LENGTH}
        </span>
      </div>

      {/* 生成/更新ボタン */}
      <button
        onClick={onSubmit}
        disabled={!canSubmit}
        className="w-full py-2.5 rounded-lg text-sm font-mono font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ backgroundColor: "var(--color-accent)", color: "var(--color-text-primary)" }}
        onMouseEnter={(e) => {
          if (canSubmit) (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--color-accent-hover)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--color-accent)";
        }}
      >
        {isGenerating ? (
          <span className="flex items-center justify-center gap-2">
            <span className="inline-block w-3.5 h-3.5 border-2 rounded-full animate-spin"
              style={{ borderColor: "var(--color-text-primary) transparent transparent transparent" }} />
            生成中...
          </span>
        ) : (
          <span>
            {isFollowUp ? "更新する" : "生成する"}
            {" "}
            <span className="opacity-60 text-xs">(Cmd/Ctrl+Enter)</span>
          </span>
        )}
      </button>
    </div>
  );
}));
