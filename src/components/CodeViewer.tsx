"use client";

import { useState } from "react";
import dynamic from "next/dynamic";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

interface CodeViewerProps {
  code: string;
}

export function CodeViewer({ code }: CodeViewerProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="relative h-full flex flex-col">
      <div className="flex items-center justify-between px-3 py-1.5 border-b"
        style={{ backgroundColor: "var(--color-bg-code)", borderColor: "var(--color-border)" }}>
        <span className="text-xs font-mono" style={{ color: "var(--color-text-secondary)" }}>generated.html</span>
        <button
          onClick={handleCopy}
          className="text-xs font-mono px-2 py-0.5 rounded transition-colors"
          style={{ color: copied ? "var(--color-success)" : "var(--color-text-secondary)", backgroundColor: "var(--color-border)" }}
        >
          {copied ? "コピー済み ✓" : "コピー"}
        </button>
      </div>
      <div className="flex-1 overflow-hidden">
        <MonacoEditor
          height="100%"
          language="html"
          value={code}
          theme="vs-dark"
          options={{
            readOnly: true,
            minimap: { enabled: false },
            fontSize: 13,
            wordWrap: "on",
            scrollBeyondLastLine: false,
            lineNumbers: "on",
            folding: true,
            renderLineHighlight: "none",
            overviewRulerLanes: 0,
          }}
        />
      </div>
    </div>
  );
}
