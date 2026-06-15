"use client";

import { useState } from "react";
import { GenerationStatus } from "@/types";
import { CodeViewer } from "./CodeViewer";

interface PreviewPaneProps {
  html: string;
  rawStream: string;
  status: GenerationStatus;
}

export function PreviewPane({ html, rawStream, status }: PreviewPaneProps) {
  const [iframeKey, setIframeKey] = useState(0);
  const [showCode, setShowCode] = useState(false);

  const hasContent = html !== "";
  const codeContent = hasContent ? html : rawStream;

  function handleReload() {
    setIframeKey((prev) => prev + 1);
  }

  function handleDownload() {
    if (!hasContent) return;
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "generated-app.html";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="h-full flex flex-col">
      {/* ツールバー */}
      <div
        className="flex items-center justify-between px-3 py-2 border-b shrink-0"
        style={{ backgroundColor: "#111118", borderColor: "#1e1e2e" }}
      >
        <span className="text-xs font-mono" style={{ color: "#9999b3" }}>
          {showCode ? "ソースコード" : "プレビュー"}
        </span>
        <div className="flex items-center gap-2">
          <ToolbarButton onClick={() => setShowCode((v) => !v)} disabled={!hasContent && rawStream === ""}>
            {showCode ? "プレビュー" : "ソース表示"}
          </ToolbarButton>
          <ToolbarButton onClick={handleReload} disabled={!hasContent}>
            リロード
          </ToolbarButton>
          <ToolbarButton onClick={handleDownload} disabled={!hasContent}>
            ダウンロード
          </ToolbarButton>
        </div>
      </div>

      {/* コンテンツ */}
      <div className="flex-1 overflow-hidden">
        {showCode ? (
          <CodeViewer code={codeContent} />
        ) : hasContent ? (
          <iframe
            key={iframeKey}
            srcDoc={html}
            sandbox="allow-scripts"
            title="生成されたアプリのプレビュー"
            className="w-full h-full"
            style={{ border: "none", backgroundColor: "#fff" }}
          />
        ) : (
          <Placeholder status={status} />
        )}
      </div>
    </div>
  );
}

function ToolbarButton({
  onClick,
  disabled,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="text-xs font-mono px-2.5 py-1 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
      style={{ backgroundColor: "#1e1e2e", color: "#9999b3" }}
      onMouseEnter={(e) => {
        if (!disabled) {
          (e.currentTarget as HTMLButtonElement).style.color = "#f0eff8";
          (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#2a2a3e";
        }
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.color = "#9999b3";
        (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#1e1e2e";
      }}
    >
      {children}
    </button>
  );
}

function Placeholder({ status }: { status: GenerationStatus }) {
  return (
    <div className="h-full flex flex-col items-center justify-center gap-3"
      style={{ color: "#3a3a5e" }}>
      {status === "generating" ? (
        <>
          <span className="inline-block w-8 h-8 border-2 rounded-full animate-spin"
            style={{ borderColor: "#7c6af7 transparent transparent transparent" }} />
          <span className="text-sm font-mono" style={{ color: "#9999b3" }}>生成中...</span>
        </>
      ) : status === "error" ? (
        <span className="text-sm font-mono" style={{ color: "#f87171" }}>エラーが発生しました</span>
      ) : (
        <>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M3 9h18M9 21V9" />
          </svg>
          <span className="text-sm font-mono">ここにプレビューが表示されます</span>
        </>
      )}
    </div>
  );
}
