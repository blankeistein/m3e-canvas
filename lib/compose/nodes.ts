import type { CSSProperties } from "react";
import { ComponentType, ModifierProps, NodeData } from "./schema";

export function hexToComposeColor(hex?: string): string {
  if (!hex) return "Color.Unspecified";
  const clean = hex.replace("#", "");
  if (clean.length === 6) {
    return `Color(0xFF${clean.toUpperCase()})`;
  }
  if (clean.length === 8) {
    return `Color(0x${clean.toUpperCase()})`;
  }
  return `Color(0xFF${clean.toUpperCase()})`;
}

export abstract class ComposeNode {
  id: string;
  type: ComponentType;
  modifiers: ModifierProps;
  props: Record<string, any>;
  children: ComposeNode[] = [];

  constructor(data: NodeData) {
    this.id = data.id;
    this.type = data.type;
    this.modifiers = data.modifiers || {};
    this.props = data.props || {};
  }

  abstract toKotlin(indent?: number): string;
  abstract toReact(indent?: number): string;

  protected modifierToKotlin(): string {
    const parts: string[] = ["Modifier"];
    const m = this.modifiers;

    if (m.width === "fillMax" && m.height === "fillMax") {
      parts.push("fillMaxSize()");
    } else {
      if (m.width === "fillMax") parts.push("fillMaxWidth()");
      else if (typeof m.width === "number") parts.push(`width(${m.width}.dp)`);

      if (m.height === "fillMax") parts.push("fillMaxHeight()");
      else if (typeof m.height === "number") parts.push(`height(${m.height}.dp)`);
    }

    if (m.weight != null && m.weight > 0) {
      parts.push(`weight(${m.weight}f)`);
    }

    if (m.padding) {
      const p = m.padding;
      if (p.all != null && p.all > 0) {
        parts.push(`padding(${p.all}.dp)`);
      } else if (p.horizontal != null || p.vertical != null) {
        const h = p.horizontal ? `horizontal = ${p.horizontal}.dp` : "";
        const v = p.vertical ? `vertical = ${p.vertical}.dp` : "";
        const args = [h, v].filter(Boolean).join(", ");
        if (args) parts.push(`padding(${args})`);
      } else if (p.start != null || p.top != null || p.end != null || p.bottom != null) {
        const s = p.start ? `start = ${p.start}.dp` : "";
        const t = p.top ? `top = ${p.top}.dp` : "";
        const e = p.end ? `end = ${p.end}.dp` : "";
        const b = p.bottom ? `bottom = ${p.bottom}.dp` : "";
        const args = [s, t, e, b].filter(Boolean).join(", ");
        if (args) parts.push(`padding(${args})`);
      }
    }

    if (m.clip?.radius != null && m.clip.radius > 0) {
      parts.push(`clip(RoundedCornerShape(${m.clip.radius}.dp))`);
    }

    if (m.background?.color) {
      parts.push(`background(${hexToComposeColor(m.background.color)})`);
    }

    if (m.clickable) {
      parts.push("clickable { /* onClick */ }");
    }

    return parts.length > 1 ? parts.join("\n        .") : "Modifier";
  }

  public modifierToReactStyle(): CSSProperties {
    const style: CSSProperties = {};
    const m = this.modifiers;

    if (m.width === "fillMax") style.width = "100%";
    else if (typeof m.width === "number") style.width = `${m.width}px`;

    if (m.height === "fillMax") style.height = "100%";
    else if (typeof m.height === "number") style.height = `${m.height}px`;

    if (m.weight != null && m.weight > 0) {
      style.flex = m.weight;
    }

    if (m.padding) {
      const p = m.padding;
      if (p.all != null && p.all > 0) {
        style.padding = `${p.all}px`;
      } else {
        const top = p.top ?? p.vertical ?? 0;
        const bottom = p.bottom ?? p.vertical ?? 0;
        const start = p.start ?? p.horizontal ?? 0;
        const end = p.end ?? p.horizontal ?? 0;
        if (top || bottom || start || end) {
          style.padding = `${top}px ${end}px ${bottom}px ${start}px`;
        }
      }
    }

    if (m.background?.color) {
      style.backgroundColor = m.background.color;
    }

    if (m.clip?.radius != null && m.clip.radius > 0) {
      style.borderRadius = `${m.clip.radius}px`;
      style.overflow = "hidden";
    }

    if (m.clickable) {
      style.cursor = "pointer";
    }

    return style;
  }

  protected reactStyleToString(extraStyles?: Record<string, any>): string {
    const merged: Record<string, any> = { ...extraStyles, ...this.modifierToReactStyle() };
    const keys = Object.keys(merged);
    if (keys.length === 0) return "";
    const items = keys.map((k) => {
      const val = merged[k];
      return typeof val === "number" ? `${k}: ${val}` : `${k}: "${val}"`;
    });
    return `style={{ ${items.join(", ")} }}`;
  }
}

export class ColumnNode extends ComposeNode {
  toKotlin(indent = 0): string {
    const sp = " ".repeat(indent);
    const mod = this.modifierToKotlin();
    const arr = this.props.verticalArrangement;
    const align = this.props.horizontalAlignment;
    const gap = this.props.gap;

    const args: string[] = [];
    if (mod !== "Modifier") args.push(`modifier = ${mod}`);
    if (arr === "center") args.push("verticalArrangement = Arrangement.Center");
    else if (arr === "bottom") args.push("verticalArrangement = Arrangement.Bottom");
    else if (arr === "spaceBetween") args.push("verticalArrangement = Arrangement.SpaceBetween");
    else if (arr === "spaceAround") args.push("verticalArrangement = Arrangement.SpaceAround");
    else if (arr === "spaceEvenly") args.push("verticalArrangement = Arrangement.SpaceEvenly");
    else if (gap != null && gap > 0) args.push(`verticalArrangement = Arrangement.spacedBy(${gap}.dp)`);

    if (align === "center") args.push("horizontalAlignment = Alignment.CenterHorizontally");
    else if (align === "end") args.push("horizontalAlignment = Alignment.End");

    const header = args.length > 0 ? `Column(\n${sp}    ${args.join(`,\n${sp}    `)}\n${sp})` : "Column";

    if (this.children.length === 0) {
      return `${sp}${header} {\n${sp}}`;
    }

    const body = this.children.map((c) => c.toKotlin(indent + 4)).join("\n");
    return `${sp}${header} {\n${body}\n${sp}}`;
  }

  toReact(indent = 0): string {
    const sp = " ".repeat(indent);
    const justifyMap: Record<string, string> = {
      top: "flex-start",
      center: "center",
      bottom: "flex-end",
      spaceBetween: "space-between",
      spaceAround: "space-around",
      spaceEvenly: "space-evenly",
    };
    const alignMap: Record<string, string> = {
      start: "flex-start",
      center: "center",
      end: "flex-end",
    };

    const extra: Record<string, any> = {
      display: "flex",
      flexDirection: "column",
    };
    if (this.props.verticalArrangement && justifyMap[this.props.verticalArrangement]) {
      extra.justifyContent = justifyMap[this.props.verticalArrangement];
    }
    if (this.props.horizontalAlignment && alignMap[this.props.horizontalAlignment]) {
      extra.alignItems = alignMap[this.props.horizontalAlignment];
    }
    if (this.props.gap != null) {
      extra.gap = `${this.props.gap}px`;
    }

    const styleStr = this.reactStyleToString(extra);
    const attr = styleStr ? ` ${styleStr}` : "";

    if (this.children.length === 0) {
      return `${sp}<div${attr} />`;
    }

    const body = this.children.map((c) => c.toReact(indent + 2)).join("\n");
    return `${sp}<div${attr}>\n${body}\n${sp}</div>`;
  }
}

export class RowNode extends ComposeNode {
  toKotlin(indent = 0): string {
    const sp = " ".repeat(indent);
    const mod = this.modifierToKotlin();
    const arr = this.props.horizontalArrangement;
    const align = this.props.verticalAlignment;
    const gap = this.props.gap;

    const args: string[] = [];
    if (mod !== "Modifier") args.push(`modifier = ${mod}`);
    if (arr === "center") args.push("horizontalArrangement = Arrangement.Center");
    else if (arr === "end") args.push("horizontalArrangement = Arrangement.End");
    else if (arr === "spaceBetween") args.push("horizontalArrangement = Arrangement.SpaceBetween");
    else if (arr === "spaceAround") args.push("horizontalArrangement = Arrangement.SpaceAround");
    else if (arr === "spaceEvenly") args.push("horizontalArrangement = Arrangement.SpaceEvenly");
    else if (gap != null && gap > 0) args.push(`horizontalArrangement = Arrangement.spacedBy(${gap}.dp)`);

    if (align === "top") args.push("verticalAlignment = Alignment.Top");
    else if (align === "bottom") args.push("verticalAlignment = Alignment.Bottom");
    else if (align === "center") args.push("verticalAlignment = Alignment.CenterVertically");

    const header = args.length > 0 ? `Row(\n${sp}    ${args.join(`,\n${sp}    `)}\n${sp})` : "Row";

    if (this.children.length === 0) {
      return `${sp}${header} {\n${sp}}`;
    }

    const body = this.children.map((c) => c.toKotlin(indent + 4)).join("\n");
    return `${sp}${header} {\n${body}\n${sp}}`;
  }

  toReact(indent = 0): string {
    const sp = " ".repeat(indent);
    const justifyMap: Record<string, string> = {
      start: "flex-start",
      center: "center",
      end: "flex-end",
      spaceBetween: "space-between",
      spaceAround: "space-around",
      spaceEvenly: "space-evenly",
    };
    const alignMap: Record<string, string> = {
      top: "flex-start",
      center: "center",
      bottom: "flex-end",
    };

    const extra: Record<string, any> = {
      display: "flex",
      flexDirection: "row",
    };
    if (this.props.horizontalArrangement && justifyMap[this.props.horizontalArrangement]) {
      extra.justifyContent = justifyMap[this.props.horizontalArrangement];
    }
    if (this.props.verticalAlignment && alignMap[this.props.verticalAlignment]) {
      extra.alignItems = alignMap[this.props.verticalAlignment];
    }
    if (this.props.gap != null) {
      extra.gap = `${this.props.gap}px`;
    }

    const styleStr = this.reactStyleToString(extra);
    const attr = styleStr ? ` ${styleStr}` : "";

    if (this.children.length === 0) {
      return `${sp}<div${attr} />`;
    }

    const body = this.children.map((c) => c.toReact(indent + 2)).join("\n");
    return `${sp}<div${attr}>\n${body}\n${sp}</div>`;
  }
}

export class BoxNode extends ComposeNode {
  toKotlin(indent = 0): string {
    const sp = " ".repeat(indent);
    const mod = this.modifierToKotlin();
    const align = this.props.contentAlignment;

    const alignMap: Record<string, string> = {
      topStart: "Alignment.TopStart",
      topCenter: "Alignment.TopCenter",
      topEnd: "Alignment.TopEnd",
      centerStart: "Alignment.CenterStart",
      center: "Alignment.Center",
      centerEnd: "Alignment.CenterEnd",
      bottomStart: "Alignment.BottomStart",
      bottomCenter: "Alignment.BottomCenter",
      bottomEnd: "Alignment.BottomEnd",
    };

    const args: string[] = [];
    if (mod !== "Modifier") args.push(`modifier = ${mod}`);
    if (align && alignMap[align]) args.push(`contentAlignment = ${alignMap[align]}`);

    const header = args.length > 0 ? `Box(\n${sp}    ${args.join(`,\n${sp}    `)}\n${sp})` : "Box";

    if (this.children.length === 0) {
      return `${sp}${header} {\n${sp}}`;
    }

    const body = this.children.map((c) => c.toKotlin(indent + 4)).join("\n");
    return `${sp}${header} {\n${body}\n${sp}}`;
  }

  toReact(indent = 0): string {
    const sp = " ".repeat(indent);
    const extra: Record<string, any> = {
      position: "relative",
      display: "grid",
    };
    if (this.props.contentAlignment === "center") {
      extra.placeItems = "center";
    }

    const styleStr = this.reactStyleToString(extra);
    const attr = styleStr ? ` ${styleStr}` : "";

    if (this.children.length === 0) {
      return `${sp}<div${attr} />`;
    }

    const body = this.children.map((c) => c.toReact(indent + 2)).join("\n");
    return `${sp}<div${attr}>\n${body}\n${sp}</div>`;
  }
}

export class LazyColumnNode extends ComposeNode {
  toKotlin(indent = 0): string {
    const sp = " ".repeat(indent);
    const mod = this.modifierToKotlin();
    const p = this.props.contentPadding;
    const gap = this.props.gap;
    const rev = this.props.reverseLayout;

    const args: string[] = [];
    if (mod !== "Modifier") args.push(`modifier = ${mod}`);
    if (p != null && p > 0) args.push(`contentPadding = PaddingValues(${p}.dp)`);
    if (gap != null && gap > 0) args.push(`verticalArrangement = Arrangement.spacedBy(${gap}.dp)`);
    if (rev) args.push("reverseLayout = true");

    const header = args.length > 0 ? `LazyColumn(\n${sp}    ${args.join(`,\n${sp}    `)}\n${sp})` : "LazyColumn";

    const body = this.children.map((c) => `${sp}    item {\n${c.toKotlin(indent + 8)}\n${sp}    }`).join("\n");
    return `${sp}${header} {\n${body}\n${sp}}`;
  }

  toReact(indent = 0): string {
    const sp = " ".repeat(indent);
    const extra: Record<string, any> = {
      display: "flex",
      flexDirection: this.props.reverseLayout ? "column-reverse" : "column",
      overflowY: "auto",
      gap: `${this.props.gap ?? 8}px`,
      padding: `${this.props.contentPadding ?? 16}px`,
    };

    const styleStr = this.reactStyleToString(extra);
    const attr = styleStr ? ` ${styleStr}` : "";
    const body = this.children.map((c) => c.toReact(indent + 2)).join("\n");
    return `${sp}<div${attr}>\n${body}\n${sp}</div>`;
  }
}

export class LazyRowNode extends ComposeNode {
  toKotlin(indent = 0): string {
    const sp = " ".repeat(indent);
    const mod = this.modifierToKotlin();
    const p = this.props.contentPadding;
    const gap = this.props.gap;
    const rev = this.props.reverseLayout;

    const args: string[] = [];
    if (mod !== "Modifier") args.push(`modifier = ${mod}`);
    if (p != null && p > 0) args.push(`contentPadding = PaddingValues(${p}.dp)`);
    if (gap != null && gap > 0) args.push(`horizontalArrangement = Arrangement.spacedBy(${gap}.dp)`);
    if (rev) args.push("reverseLayout = true");

    const header = args.length > 0 ? `LazyRow(\n${sp}    ${args.join(`,\n${sp}    `)}\n${sp})` : "LazyRow";

    const body = this.children.map((c) => `${sp}    item {\n${c.toKotlin(indent + 8)}\n${sp}    }`).join("\n");
    return `${sp}${header} {\n${body}\n${sp}}`;
  }

  toReact(indent = 0): string {
    const sp = " ".repeat(indent);
    const extra: Record<string, any> = {
      display: "flex",
      flexDirection: this.props.reverseLayout ? "row-reverse" : "row",
      overflowX: "auto",
      gap: `${this.props.gap ?? 8}px`,
      padding: `${this.props.contentPadding ?? 16}px`,
    };

    const styleStr = this.reactStyleToString(extra);
    const attr = styleStr ? ` ${styleStr}` : "";
    const body = this.children.map((c) => c.toReact(indent + 2)).join("\n");
    return `${sp}<div${attr}>\n${body}\n${sp}</div>`;
  }
}

export class TextNode extends ComposeNode {
  toKotlin(indent = 0): string {
    const sp = " ".repeat(indent);
    const mod = this.modifierToKotlin();
    const text = (this.props.text ?? "").replace(/"/g, '\\"');
    const size = this.props.size;
    const weight = this.props.weight;
    const color = this.props.color;
    const maxLines = this.props.maxLines;

    const args: string[] = [`text = "${text}"`];
    if (mod !== "Modifier") args.push(`modifier = ${mod}`);
    if (size) args.push(`fontSize = ${size}.sp`);
    if (weight === "bold") args.push("fontWeight = FontWeight.Bold");
    else if (weight === "medium") args.push("fontWeight = FontWeight.Medium");
    if (color) args.push(`color = ${hexToComposeColor(color)}`);
    if (maxLines && maxLines > 1) args.push(`maxLines = ${maxLines}`);

    return `${sp}Text(${args.join(", ")})`;
  }

  toReact(indent = 0): string {
    const sp = " ".repeat(indent);
    const extra: Record<string, any> = {
      margin: 0,
      fontSize: `${this.props.size ?? 16}px`,
      fontWeight: this.props.weight === "bold" ? 700 : this.props.weight === "medium" ? 500 : 400,
      color: this.props.color ?? "#1D1B20",
    };
    const styleStr = this.reactStyleToString(extra);
    const attr = styleStr ? ` ${styleStr}` : "";
    return `${sp}<p${attr}>${this.props.text ?? ""}</p>`;
  }
}

export class ButtonNode extends ComposeNode {
  toKotlin(indent = 0): string {
    const sp = " ".repeat(indent);
    const mod = this.modifierToKotlin();
    const label = (this.props.label ?? "Button").replace(/"/g, '\\"');
    const variant = this.props.variant ?? "filled";
    const enabled = this.props.enabled ?? true;

    let compName = "Button";
    if (variant === "tonal") compName = "FilledTonalButton";
    else if (variant === "outlined") compName = "OutlinedButton";
    else if (variant === "elevated") compName = "ElevatedButton";
    else if (variant === "text") compName = "TextButton";

    const args: string[] = ["onClick = { /* onClick */ }"];
    if (mod !== "Modifier") args.push(`modifier = ${mod}`);
    if (!enabled) args.push("enabled = false");

    return `${sp}${compName}(${args.join(", ")}) {\n${sp}    Text("${label}")\n${sp}}`;
  }

  toReact(indent = 0): string {
    const sp = " ".repeat(indent);
    const extra: Record<string, any> = {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "10px 24px",
      borderRadius: "20px",
      fontWeight: 500,
      fontSize: "14px",
      cursor: "pointer",
      border: this.props.variant === "outlined" ? "1px solid #79747E" : "none",
    };
    const styleStr = this.reactStyleToString(extra);
    const attr = styleStr ? ` ${styleStr}` : "";
    const dis = this.props.enabled === false ? " disabled" : "";
    return `${sp}<button${attr}${dis}>${this.props.label ?? "Button"}</button>`;
  }
}

export class TextFieldNode extends ComposeNode {
  toKotlin(indent = 0): string {
    const sp = " ".repeat(indent);
    const mod = this.modifierToKotlin();
    const val = (this.props.value ?? "").replace(/"/g, '\\"');
    const label = (this.props.label ?? "").replace(/"/g, '\\"');
    const placeholder = (this.props.placeholder ?? "").replace(/"/g, '\\"');

    const args: string[] = [
      `value = "${val}"`,
      "onValueChange = { /* onChange */ }",
    ];
    if (mod !== "Modifier") args.push(`modifier = ${mod}`);
    if (label) args.push(`label = { Text("${label}") }`);
    if (placeholder) args.push(`placeholder = { Text("${placeholder}") }`);

    return `${sp}OutlinedTextField(${args.join(", ")})`;
  }

  toReact(indent = 0): string {
    const sp = " ".repeat(indent);
    const extra: Record<string, any> = {
      padding: "12px 16px",
      borderRadius: "4px",
      border: "1px solid #79747E",
      fontSize: "14px",
      outline: "none",
      boxSizing: "border-box",
    };
    const styleStr = this.reactStyleToString(extra);
    const attr = styleStr ? ` ${styleStr}` : "";
    return `${sp}<input${attr} placeholder="${this.props.placeholder ?? ""}" defaultValue="${this.props.value ?? ""}" />`;
  }
}

export class ImageNode extends ComposeNode {
  toKotlin(indent = 0): string {
    const sp = " ".repeat(indent);
    const mod = this.modifierToKotlin();
    const src = (this.props.source ?? "").replace(/"/g, '\\"');
    const scale = this.props.contentScale;

    const scaleMap: Record<string, string> = {
      crop: "ContentScale.Crop",
      fit: "ContentScale.Fit",
      fillBounds: "ContentScale.FillBounds",
    };

    const args: string[] = [
      `model = "${src}"`,
      'contentDescription = null',
    ];
    if (mod !== "Modifier") args.push(`modifier = ${mod}`);
    if (scale && scaleMap[scale]) args.push(`contentScale = ${scaleMap[scale]}`);

    return `${sp}AsyncImage(${args.join(", ")})`;
  }

  toReact(indent = 0): string {
    const sp = " ".repeat(indent);
    const fitMap: Record<string, string> = {
      crop: "cover",
      fit: "contain",
      fillBounds: "fill",
    };
    const extra: Record<string, any> = {
      objectFit: fitMap[this.props.contentScale] ?? "cover",
      display: "block",
    };
    const styleStr = this.reactStyleToString(extra);
    const attr = styleStr ? ` ${styleStr}` : "";
    return `${sp}<img${attr} src="${this.props.source ?? ""}" alt="" />`;
  }
}

export class SpacerNode extends ComposeNode {
  toKotlin(indent = 0): string {
    const sp = " ".repeat(indent);
    const size = this.props.size ?? 16;
    return `${sp}Spacer(modifier = Modifier.size(${size}.dp))`;
  }

  toReact(indent = 0): string {
    const sp = " ".repeat(indent);
    const size = this.props.size ?? 16;
    return `${sp}<div style={{ width: ${size}, height: ${size}, flexShrink: 0 }} />`;
  }
}

export class DividerNode extends ComposeNode {
  toKotlin(indent = 0): string {
    const sp = " ".repeat(indent);
    const thick = this.props.thickness ?? 1;
    const color = this.props.color;
    const args: string[] = [];
    if (thick !== 1) args.push(`thickness = ${thick}.dp`);
    if (color) args.push(`color = ${hexToComposeColor(color)}`);
    return `${sp}HorizontalDivider(${args.join(", ")})`;
  }

  toReact(indent = 0): string {
    const sp = " ".repeat(indent);
    const thick = this.props.thickness ?? 1;
    const color = this.props.color ?? "#CAC4D0";
    return `${sp}<hr style={{ border: "none", borderTop: "${thick}px solid ${color}", margin: 0, width: "100%" }} />`;
  }
}

export class CustomComponentNode extends ComposeNode {
  toKotlin(indent = 0): string {
    const sp = " ".repeat(indent);
    const name = this.props.name ?? "CustomComponent";
    const mod = this.modifierToKotlin();
    if (mod !== "Modifier") {
      return `${sp}${name}(modifier = ${mod})`;
    }
    return `${sp}${name}()`;
  }

  toReact(indent = 0): string {
    const sp = " ".repeat(indent);
    const name = this.props.name ?? "CustomComponent";
    const styleStr = this.reactStyleToString();
    const attr = styleStr ? ` ${styleStr}` : "";
    return `${sp}<${name}${attr} />`;
  }
}

export function createNodeInstance(data: NodeData): ComposeNode {
  switch (data.type) {
    case "Column":
      return new ColumnNode(data);
    case "Row":
      return new RowNode(data);
    case "Box":
      return new BoxNode(data);
    case "LazyColumn":
      return new LazyColumnNode(data);
    case "LazyRow":
      return new LazyRowNode(data);
    case "Text":
      return new TextNode(data);
    case "Button":
      return new ButtonNode(data);
    case "TextField":
      return new TextFieldNode(data);
    case "Image":
      return new ImageNode(data);
    case "Spacer":
      return new SpacerNode(data);
    case "Divider":
      return new DividerNode(data);
    case "Custom":
      return new CustomComponentNode(data);
    default:
      return new BoxNode(data);
  }
}
