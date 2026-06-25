import { memo } from "react";
import { GenerationStatus, MODEL_NAME } from "@/types";

interface StatusBarProps {
  status: GenerationStatus;
  inputTokens: number;
  outputTokens: number;
}

const STATUS_CONFIG: Record<GenerationStatus, { color: string; label: string; pulse: boolean }> = {
  ready:      { color: "var(--color-dim)",            label: "Ready",      pulse: false },
  generating: { color: "var(--color-accent)",         label: "Generating", pulse: true  },
  done:       { color: "var(--color-success)",        label: "Done",       pulse: false },
  error:      { color: "var(--color-error)",          label: "Error",      pulse: false },
};

export const StatusBar = memo(function StatusBar({ status, inputTokens, outputTokens }: StatusBarProps) {
  const cfg = STATUS_CONFIG[status];
  const hasTokens = inputTokens > 0 || outputTokens > 0;

  return (
    <footer
      className="flex items-center justify-between px-4 py-2 text-xs font-mono border-t"
      style={{ backgroundColor: "var(--color-bg-surface)", borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}
      aria-live="polite"
    >
      <div className="flex items-center gap-2">
        <span
          className={`inline-block w-2 h-2 rounded-full ${cfg.pulse ? "animate-pulse" : ""}`}
          style={{ backgroundColor: cfg.color }}
        />
        <span style={{ color: cfg.color }}>{cfg.label}</span>
      </div>

      <div className="flex items-center gap-4">
        {hasTokens && (
          <span>
            in: <span style={{ color: "var(--color-text-primary)" }}>{inputTokens.toLocaleString()}</span>
            {" / "}
            out: <span style={{ color: "var(--color-text-primary)" }}>{outputTokens.toLocaleString()}</span>
            {" tokens"}
          </span>
        )}
        <span style={{ color: "var(--color-dim)" }}>{MODEL_NAME}</span>
      </div>
    </footer>
  );
});
