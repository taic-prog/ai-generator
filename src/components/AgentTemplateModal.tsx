"use client";

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { AGENT_TEMPLATES } from "@/lib/agentTemplates";
import { ARIA_CLOSE_DELAY_MS } from "@/types";

interface AgentTemplateModalProps {
  onClose: () => void;
  onConfirm: (selectedAgentIds: string[]) => Promise<void>;
}

export function AgentTemplateModal({ onClose, onConfirm }: AgentTemplateModalProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>(() => AGENT_TEMPLATES.map((agent) => agent.id));
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // "" のとき AT は読み上げない。空→非空の変化で AT がアナウンスする
  const [a11yAnnounce, setA11yAnnounce] = useState("");
  const panelRef = useRef<HTMLDivElement>(null);
  const errorRef = useRef<HTMLParagraphElement>(null);
  const onCloseRef = useRef(onClose);
  const isDownloadingRef = useRef(false);
  // ダウンロード完了後の200ms待機フェーズを「ダウンロード中」と区別するフラグ
  const isSucceededRef = useRef(false);
  const isMountedRef = useRef(true);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rafRef = useRef<number | null>(null);

  // onCloseRef を最新の prop に同期する（空 deps の keydown クロージャが stale にならないため）
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  const titleId = useId();
  const descId = useId();

  // "" → rAF → msg の2段階更新で毎回 AT がアナウンスできる。前回分をキャンセルして蓄積防止
  const announce = useCallback((msg: string) => {
    setA11yAnnounce("");
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      setA11yAnnounce(msg);
      rafRef.current = null;
    });
  }, []);

  const close = useCallback(() => {
    onCloseRef.current();
  }, []);

  // ダウンロード失敗時にエラー段落へフォーカスを移動し AT が即読み上げできるようにする
  useEffect(() => {
    if (error) errorRef.current?.focus();
  }, [error]);

  // Cancel disabled 時ブラウザが body に飛ばすフォーカスをペイント前にパネルへ戻す（useLayoutEffect 必須）
  useLayoutEffect(() => {
    if (isDownloading) panelRef.current?.focus();
  }, [isDownloading]);

  // アンマウント時に未発火のタイマー・rAF をキャンセルする
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (closeTimerRef.current !== null) clearTimeout(closeTimerRef.current);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // DOM 確定後・ペイント前にフォーカスを移動するため useLayoutEffect を使用
  useLayoutEffect(() => {
    const prevFocus = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (isDownloadingRef.current && !isSucceededRef.current) {
          announce("ダウンロード中のため閉じられません");
          return;
        }
        if (closeTimerRef.current !== null) {
          clearTimeout(closeTimerRef.current);
          closeTimerRef.current = null;
        }
        if (isSucceededRef.current) {
          isSucceededRef.current = false;
          isDownloadingRef.current = false;
          setIsDownloading(false);
        }
        close();
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
          announce("ダウンロード中のため操作できません");
          return;
        }
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        const active = document.activeElement;
        // スクリーンリーダー操作等で modal 外にフォーカスが脱出した場合を先頭で回収する
        if (!panelRef.current.contains(active)) {
          e.preventDefault();
          first.focus();
          return;
        }
        // tabindex=-1 要素（errorRef 等）はセレクタに含まれないため、パネル内でも isInFocusableSet=false になる
        const isInFocusableSet = Array.from(focusable).includes(active as HTMLElement);
        if (e.shiftKey && (active === first || !isInFocusableSet)) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && (active === last || !isInFocusableSet)) {
          // panelRef や errorRef にフォーカスがある場合も first へ移動しブラウザ依存を排除
          e.preventDefault();
          first.focus();
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      // isConnected で切り離し済み要素への focus() を防ぐ
      if (prevFocus?.isConnected) prevFocus.focus();
    };
  }, [announce, close]);

  function toggle(id: string) {
    // AT 仮想カーソル（NVDA Browse Mode 等）はネイティブ focus と独立して動くため focus が panel 外に出る
    if (error && !panelRef.current?.contains(document.activeElement)) {
      panelRef.current?.focus();
    }
    setError(null);
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]));
  }

  // backdrop・キャンセルボタン共通: ダウンロード中はブロックして AT へ告知する
  function handleDismiss() {
    if (isDownloadingRef.current && !isSucceededRef.current) {
      announce("ダウンロード中のため閉じられません");
      return;
    }
    if (closeTimerRef.current !== null) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    if (isSucceededRef.current) {
      isSucceededRef.current = false;
      isDownloadingRef.current = false;
      setIsDownloading(false);
    }
    close();
  }

  async function handleConfirm() {
    if (isDownloadingRef.current) return;
    isDownloadingRef.current = true;
    let succeeded = false;
    try {
      setIsDownloading(true);
      setError(null);
      setA11yAnnounce("");
      await onConfirm(selectedIds);
      succeeded = true;
    } catch (err) {
      console.error("[AgentTemplateModal] download failed", err);
      setError("ダウンロードに失敗しました。もう一度お試しください。");
    } finally {
      // 失敗パスのみここでリセット。成功パスは isSucceededRef + 200ms timer でリセットする
      if (!succeeded) {
        isDownloadingRef.current = false;
        setIsDownloading(false);
        if (rafRef.current !== null) {
          cancelAnimationFrame(rafRef.current);
          rafRef.current = null;
        }
      }
      setA11yAnnounce("");
    }
    if (succeeded) {
      isSucceededRef.current = true;
      announce("ダウンロードが完了しました");
      closeTimerRef.current = setTimeout(() => {
        if (!isMountedRef.current) return;
        isSucceededRef.current = false;
        isDownloadingRef.current = false;
        setIsDownloading(false);
        closeTimerRef.current = null;
        close();
      }, ARIA_CLOSE_DELAY_MS);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "var(--color-overlay)" }}
      onClick={handleDismiss}
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
        {/* dialog 内に常時配置し、テキスト変更のみで AT に告知する（動的挿入だと NVDA/JAWS が登録しない） */}
        <span className="sr-only" aria-live="polite" aria-atomic="true">{a11yAnnounce}</span>

        <h2 id={titleId} className="text-sm font-mono mb-1" style={{ color: "var(--color-text-primary)" }}>
          含めるサブエージェントを選択
        </h2>
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
          <p role="alert" className="text-xs font-mono mb-3" style={{ color: "var(--color-error)" }}>
            少なくとも1つ選択してください
          </p>
        )}
        {error && (
          <p ref={errorRef} tabIndex={-1} role="alert" className="text-xs font-mono mb-3" style={{ color: "var(--color-error)" }}>
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2">
          <button
            onClick={handleDismiss}
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
