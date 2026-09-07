"use client";

import { useEffect, useMemo, useState } from "react";
import { ComposeDoc } from "@/lib/compose/schema";
import { hydrate } from "@/lib/compose/hydrate";
import { Palette } from "@/lib/tokens";
import { Icon } from "./M3Node";

export function generateKotlinCode(doc: ComposeDoc, composableName = "GeneratedScreen"): string {
  if (!doc || !doc.rootId || !doc.nodes[doc.rootId]) {
    return `package com.example.ui

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp

@Composable
fun ${composableName}() {
    Box(modifier = Modifier.fillMaxSize()) {
        Text("Empty Canvas")
    }
}
`;
  }

  const rootNode = hydrate(doc.rootId, doc.nodes);
  const bodyKotlin = rootNode.toKotlin(4);

  return `package com.example.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage

@Composable
fun ${composableName}() {
${bodyKotlin}
}
`;
}

export function KotlinComposeExporter({
  doc,
  palette: p,
}: {
  doc: ComposeDoc;
  palette: Palette;
}) {
  const code = useMemo(() => generateKotlinCode(doc), [doc]);
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
          aria-label="Kotlin Compose Code"
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
        {copied ? "Copied Kotlin Code!" : "Copy Kotlin (Jetpack Compose)"}
      </button>
    </div>
  );
}
