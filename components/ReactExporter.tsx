"use client";

import { useEffect, useMemo, useState } from "react";
import { ComposeDoc } from "@/lib/compose/schema";
import { hydrate } from "@/lib/compose/hydrate";
import { Palette } from "@/lib/tokens";
import { Icon } from "./M3Node";
import { IconBtn } from "./ui";

export function generateReactCode(doc: ComposeDoc, componentName = "GeneratedScreen"): string {
  if (!doc || !doc.rootId || !doc.nodes[doc.rootId]) {
    return `import React from 'react';

export default function ${componentName}() {
  return (
    <div style={{ padding: 16 }}>
      <p>Empty Canvas</p>
    </div>
  );
}
`;
  }

  const rootNode = hydrate(doc.rootId, doc.nodes);
  const bodyJsx = rootNode.toReact(4);

  return `import React from 'react';

export default function ${componentName}() {
  return (
${bodyJsx}
  );
}
`;
}

export function ReactExporter({
  doc,
  palette: p,
}: {
  doc: ComposeDoc;
  palette: Palette;
}) {
  const code = useMemo(() => generateReactCode(doc), [doc]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 1400);
    return () => clearTimeout(timer);
  }, [copied]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
    } catch {}
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", gap: 10 }}>
      <div style={{ position: "relative", flex: 1, minHeight: 0, display: "flex" }}>
        <textarea
          readOnly
          className="no-scrollbar"
          value={code}
          spellCheck={false}
          aria-label="React Code"
          style={{
            flex: 1,
            minHeight: 0,
            width: "100%",
            borderRadius: 18,
            border: "none",
            background: p.surfaceContainerLow,
            padding: 14,
            fontSize: 12,
            lineHeight: 1.6,
            color: p.onSurface,
            fontFamily: "monospace",
            resize: "none",
            outline: "none",
            boxSizing: "border-box",
            whiteSpace: "pre",
          }}
        />
      </div>
      <button
        onClick={copy}
        className="m3-press"
        style={{
          height: 48,
          borderRadius: 24,
          border: "none",
          background: copied ? p.tertiaryContainer : p.primary,
          color: copied ? p.onTertiaryContainer : p.onPrimary,
          fontSize: 14,
          fontWeight: 600,
          cursor: "pointer",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          transition: "background 160ms, color 160ms",
        }}
      >
        <Icon name={copied ? "check" : "content_copy"} size={20} />
        {copied ? "Copied React Code!" : "Copy React (JSX)"}
      </button>
    </div>
  );
}
