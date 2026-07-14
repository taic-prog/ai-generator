"use client";

import { useState } from "react";
import { GenerationStatus } from "@/types";
import { CodeViewer } from "./CodeViewer";
import { AgentTemplateModal } from "./AgentTemplateModal";
import { downloadAgentTemplates } from "@/lib/downloadTemplates";
import { triggerDownload } from "@/lib/triggerDownload";

interface PreviewPaneProps {
  html: string;
  rawStream: string;
  status: GenerationStatus;
}

export function PreviewPane({ html, rawStream, status }: PreviewPaneProps) {
  const [iframeKey, setIframeKey] = useState(0);
  const [showCode, setShowCode] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);

  const hasContent = html !== "";
  const codeContent = hasContent ? html : rawStream;
  // コンテンツがない状態でソースコード表示をオンにしたままリセットしてもトラップされないよう派生値で制御
  const effectiveShowCode = showCode && (hasContent || rawStream !== "");

  function handleReload() {
    setIframeKey((prev) => prev + 1);
  }

  function handleDownload() {
    if (!hasContent) return;
    const blob = new Blob([html], { type: "text/html" });
    triggerDownload(blob, "generated-app.html");
  }

  function handleDownloadTemplates() {
    if (!hasContent) return;
    setShowTemplateModal(true);
  }

  return (
    <div className="h-full flex flex-col">
      {/* ツールバー */}
      <div
        className="flex items-center justify-between px-3 py-2 border-b shrink-0"
        style={{ backgroundColor: "var(--color-bg-surface)", borderColor: "var(--color-border)" }}
      >
        <span className="text-xs font-mono" style={{ color: "var(--color-text-secondary)" }}>
          {effectiveShowCode ? "ソースコード" : "プレビュー"}
        </span>
        <div className="flex items-center gap-2">
          <ToolbarButton onClick={() => setShowCode((v) => !v)} disabled={!hasContent && rawStream === ""}>
            {effectiveShowCode ? "プレビュー" : "ソース表示"}
          </ToolbarButton>
          <ToolbarButton onClick={handleReload} disabled={!hasContent}>
            リロード
          </ToolbarButton>
          <ToolbarButton onClick={handleDownload} disabled={!hasContent} title="生成されたHTMLファイルをダウンロード">
            HTML保存
          </ToolbarButton>
          <ToolbarButton onClick={handleDownloadTemplates} disabled={!hasContent} title="Claude Code用エージェントテンプレートをZIPでダウンロード">
            Claude Code ZIP
          </ToolbarButton>
        </div>
      </div>

      {/* コンテンツ */}
      <div className="flex-1 overflow-hidden">
        {effectiveShowCode ? (
          <CodeViewer code={codeContent} />
        ) : hasContent ? (
          <iframe
            key={iframeKey}
            srcDoc={html}
            sandbox="allow-scripts"
            title="生成されたアプリのプレビュー"
            className="w-full h-full"
            style={{ border: "none", backgroundColor: "var(--color-bg-main)" }}
          />
        ) : (
          <Placeholder status={status} />
        )}
      </div>

      {showTemplateModal && (
        <AgentTemplateModal onClose={() => setShowTemplateModal(false)} onConfirm={downloadAgentTemplates} />
      )}
    </div>
  );
}

function ToolbarButton({
  onClick,
  disabled,
  title,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="text-xs font-mono px-2.5 py-1 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
      style={{ backgroundColor: "var(--color-border)", color: "var(--color-text-secondary)" }}
      onMouseEnter={(e) => {
        if (!disabled) {
          (e.currentTarget as HTMLButtonElement).style.color = "var(--color-text-primary)";
          (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--color-bg-hover)";
        }
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.color = "var(--color-text-secondary)";
        (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--color-border)";
      }}
    >
      {children}
    </button>
  );
}

function Placeholder({ status }: { status: GenerationStatus }) {
  return (
    <div className="h-full flex flex-col items-center justify-center gap-3"
      style={{ color: "var(--color-text-secondary)" }}>
      {status === "generating" ? (
        <>
          <span className="inline-block w-8 h-8 border-2 rounded-full animate-spin"
            style={{ borderColor: "var(--color-accent) transparent transparent transparent" }} />
          <span className="text-sm font-mono" style={{ color: "var(--color-text-secondary)" }}>生成中...</span>
        </>
      ) : status === "error" ? (
        <span className="text-sm font-mono" style={{ color: "var(--color-error)" }}>エラーが発生しました</span>
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
