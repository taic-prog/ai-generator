"use client";

import { GALLERY_ITEMS } from "@/lib/galleryItems";

interface GalleryProps {
  onSelect: (prompt: string) => void;
}

export function Gallery({ onSelect }: GalleryProps) {
  return (
    <div className="h-full flex flex-col overflow-y-auto p-4 gap-4">
      <div>
        <h2 className="text-sm font-mono font-semibold" style={{ color: "var(--color-text-primary)" }}>
          サンプルギャラリー
        </h2>
        <p className="text-xs font-mono mt-1" style={{ color: "var(--color-text-secondary)" }}>
          カードをクリックするとプロンプトが入力されます
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {GALLERY_ITEMS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect(item.prompt)}
            className="text-left rounded-lg p-3 transition-colors"
            style={{
              backgroundColor: "var(--color-bg-surface)",
              borderWidth: "1px",
              borderStyle: "solid",
              borderColor: "var(--color-border)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--color-accent)";
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--color-bg-hover)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--color-border)";
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--color-bg-surface)";
            }}
          >
            <div className="text-2xl mb-2">{item.emoji}</div>
            <span
              className="text-xs font-mono px-1.5 py-0.5 rounded"
              style={{ backgroundColor: "var(--color-border)", color: "var(--color-text-secondary)" }}
            >
              {item.category}
            </span>
            <p className="text-sm font-mono font-semibold mt-1.5 mb-1" style={{ color: "var(--color-text-primary)" }}>
              {item.title}
            </p>
            <p className="text-xs font-mono leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
              {item.description}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}
