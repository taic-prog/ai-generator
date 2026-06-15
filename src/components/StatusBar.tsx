import { GenerationStatus, MODEL_NAME } from "@/types";

interface StatusBarProps {
  status: GenerationStatus;
  inputTokens: number;
  outputTokens: number;
}

const STATUS_CONFIG: Record<GenerationStatus, { color: string; label: string; pulse: boolean }> = {
  ready:      { color: "#9999b3", label: "Ready",      pulse: false },
  generating: { color: "#7c6af7", label: "Generating", pulse: true  },
  done:       { color: "#34d399", label: "Done",       pulse: false },
  error:      { color: "#f87171", label: "Error",      pulse: false },
};

export function StatusBar({ status, inputTokens, outputTokens }: StatusBarProps) {
  const cfg = STATUS_CONFIG[status];
  const hasTokens = inputTokens > 0 || outputTokens > 0;

  return (
    <footer
      className="flex items-center justify-between px-4 py-2 text-xs font-mono border-t"
      style={{ backgroundColor: "#111118", borderColor: "#1e1e2e", color: "#9999b3" }}
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
            in: <span style={{ color: "#f0eff8" }}>{inputTokens.toLocaleString()}</span>
            {" / "}
            out: <span style={{ color: "#f0eff8" }}>{outputTokens.toLocaleString()}</span>
            {" tokens"}
          </span>
        )}
        <span style={{ color: "#3a3a5e" }}>{MODEL_NAME}</span>
      </div>
    </footer>
  );
}
