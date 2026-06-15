"use client";

import { useState } from "react";
import { Header } from "@/components/Header";
import { PromptInput } from "@/components/PromptInput";
import { PreviewPane } from "@/components/PreviewPane";
import { StatusBar } from "@/components/StatusBar";
import { useGenerate } from "@/hooks/useGenerate";

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const { state, generate } = useGenerate();

  function handleSubmit() {
    if (prompt.trim() === "" || state.status === "generating") return;
    generate(prompt);
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#0a0a0f" }}>
      <Header />

      <main className="flex-1 flex flex-col sm:flex-row overflow-hidden" style={{ minHeight: 0 }}>
        {/* 左ペイン */}
        <div
          className="w-full sm:w-1/2 flex flex-col gap-4 p-4 overflow-y-auto"
          style={{ borderRight: "1px solid #1e1e2e" }}
        >
          <div>
            <h2 className="text-sm font-mono font-semibold mb-1" style={{ color: "#f0eff8" }}>
              プロンプト
            </h2>
            <p className="text-xs font-mono" style={{ color: "#9999b3" }}>
              作りたいアプリを日本語または英語で説明してください
            </p>
          </div>

          <PromptInput
            value={prompt}
            onChange={setPrompt}
            onSubmit={handleSubmit}
            isGenerating={state.status === "generating"}
          />

          {state.status === "error" && state.error && (
            <div
              className="rounded-lg px-4 py-3 text-sm font-mono"
              style={{ backgroundColor: "#2a1a1a", color: "#f87171", border: "1px solid #3a2020" }}
            >
              {state.error}
            </div>
          )}
        </div>

        {/* 右ペイン */}
        <div className="w-full sm:w-1/2 flex flex-col" style={{ minHeight: "400px" }}>
          <PreviewPane
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
