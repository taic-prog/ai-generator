"use client";

import { useEffect, useId, useRef, useState } from "react";
import { AGENT_TEMPLATES } from "@/lib/agentTemplates";

interface AgentTemplateModalProps {
  onClose: () => void;
  onConfirm: (selectedAgentIds: string[]) => Promise<void>;
}

export function AgentTemplateModal({ onClose, onConfirm }: AgentTemplateModalProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>(() => AGENT_TEMPLATES.map((agent) => agent.id));
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  const isDownloadingRef = useRef(false);
  useEffect(() => {
    onCloseRef.current = onClose;
    isDownloadingRef.current = isDownloading;
  });

  // Fix #9: useId でインスタンスごとに一意な id を生成（静的文字列は複数マウント時に id が衝突する）
  const titleId = useId();
  const descId = useId();

  useEffect(() => {
    panelRef.current?.focus();

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (!isDownloadingRef.current) onCloseRef.current();
        return;
      }
      if (e.key === "Tab" && panelRef.current) {
        const focusable = panelRef.current.querySelectorAll<HTMLElement>(
          'button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) {
          // ダウンロード中は全要素が disabled になるためパネル自身にフォーカスを閉じ込める
          e.preventDefault();
          panelRef.current.focus();
          return;
        }
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        const active = document.activeElement;
        if (e.shiftKey && (active === first || active === panelRef.current)) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && (active === last || active === panelRef.current)) {
          // Fix #7: panelRef にフォーカスがある場合も明示的に first へ移動しブラウザ依存を排除
          e.preventDefault();
          first.focus();
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  function toggle(id: string) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]));
  }

  async function handleConfirm() {
    if (isDownloading) return; // Fix #3: 同一フレーム内の二重呼び出しを防ぐ
    setIsDownloading(true);
    setError(null);
    try {
      await onConfirm(selectedIds);
    } catch (err) {
      console.error("[AgentTemplateModal] download failed", err); // Fix #2: エラーを捨てず記録
      setError("ダウンロードに失敗しました。もう一度お試しください。");
      return;
    } finally {
      // Fix #5: finally で一元管理することで setIsDownloading の漏れを防ぐ
      setIsDownloading(false);
    }
    onCloseRef.current();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "var(--color-overlay)" }}
      onClick={() => { if (!isDownloading) onClose(); }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        tabIndex={-1}
        className="w-full max-w-md rounded-lg border p-5"
        style={{ backgroundColor: "var(--color-bg-surface)", borderColor: "var(--color-border)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id={titleId} className="text-sm font-mono mb-1" style={{ color: "var(--color-text-primary)" }}>
          含めるサブエージェントを選択
        </h2>
        {/* Fix #8: aria-describedby でダイアログ開幕時にスクリーンリーダーが字幕を読み上げる */}
        <p id={descId} className="text-xs font-mono mb-4" style={{ color: "var(--color-text-secondary)" }}>
          CLAUDE.md・コーディング規約・セキュリティルールは常に含まれます
        </p>

        <div className="flex flex-col gap-2 mb-3">
          {AGENT_TEMPLATES.map((agent) => (
            <label
              key={agent.id}
              className={`flex items-start gap-2 px-2.5 py-2 rounded ${isDownloading ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
              style={{ backgroundColor: "var(--color-border)" }}
            >
              <input
                type="checkbox"
                checked={selectedIds.includes(agent.id)}
                onChange={() => toggle(agent.id)}
                disabled={isDownloading}
                className="mt-0.5"
              />
              <span>
                <span className="block text-xs font-mono" style={{ color: "var(--color-text-primary)" }}>
                  {agent.label}
                </span>
                <span className="block text-xs font-mono" style={{ color: "var(--color-text-secondary)" }}>
                  {agent.description}
                </span>
              </span>
            </label>
          ))}
        </div>

        {selectedIds.length === 0 && (
          <p className="text-xs font-mono mb-3" style={{ color: "var(--color-error)" }}>
            少なくとも1つ選択してください
          </p>
        )}
        {error && (
          <p className="text-xs font-mono mb-3" style={{ color: "var(--color-error)" }}>
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            disabled={isDownloading}
            className="text-xs font-mono px-3 py-1.5 rounded disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ backgroundColor: "var(--color-border)", color: "var(--color-text-secondary)" }}
          >
            キャンセル
          </button>
          <button
            onClick={handleConfirm}
            disabled={selectedIds.length === 0 || isDownloading}
            className="text-xs font-mono px-3 py-1.5 rounded disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ backgroundColor: "var(--color-accent)", color: "var(--color-text-primary)" }}
          >
            {isDownloading ? "ダウンロード中..." : "ダウンロード"}
          </button>
        </div>
      </div>
    </div>
  );
}
