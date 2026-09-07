import type { Doc, Group, Item, Palette } from "@/lib/tokens";
import { ComposeDoc, NodeData } from "./schema";
import { createDefaultNode } from "./hydrate";

export function convertItemToNode(it: Item): NodeData {
  switch (it.kind) {
    case "button":
    case "iconButton":
    case "fab":
    case "extendedFab":
    case "splitButton": {
      const node = createDefaultNode("Button", it.id);
      node.props.label = it.label || (it.kind === "iconButton" ? (it.icon ?? "Action") : "Button");
      node.props.variant = it.variant === "outlined" ? "outlined" : it.variant === "text" ? "text" : "filled";
      return node;
    }
    case "textField":
    case "searchBar":
    case "select": {
      const node = createDefaultNode("TextField", it.id);
      node.props.label = it.label || "Input";
      node.props.placeholder = it.supporting || "Enter text...";
      return node;
    }
    case "text":
    case "badge": {
      const node = createDefaultNode("Text", it.id);
      node.props.text = it.label || "Text";
      node.props.weight = it.bold ? "bold" : "normal";
      if (it.size) node.props.size = it.size;
      return node;
    }
    case "image":
    case "camera":
    case "map": {
      const node = createDefaultNode("Image", it.id);
      node.props.source = (it as any).src || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600";
      node.modifiers.height = it.size2 || 180;
      return node;
    }
    case "divider": {
      const node = createDefaultNode("Divider", it.id);
      return node;
    }
    case "card":
    case "box":
    case "dialog":
    case "snackbar": {
      const type = (it as any).composeType === "Row" || it.label === "Row"
        ? "Row"
        : (it as any).composeType === "Column" || it.label === "Column"
          ? "Column"
          : "Box";
      const node = createDefaultNode(type, it.id);
      node.modifiers.width = "fillMax";
      node.modifiers.height = it.size2 || (type === "Row" ? 120 : 220);
      node.modifiers.clip = { radius: 16 };
      node.modifiers.padding = { all: 16 };
      node.modifiers.background = { color: "#F3EDF7" };
      return node;
    }
    default: {
      const node = createDefaultNode("Text", it.id);
      node.props.text = it.label || it.kind;
      return node;
    }
  }
}

export function convertDocToComposeDoc(doc: Doc, palette?: Palette): ComposeDoc {
  const rootCol = createDefaultNode("Column", "root_screen");
  rootCol.modifiers = {
    width: "fillMax",
    height: "fillMax",
    padding: { all: 16 },
    background: { color: palette?.surface || "#FAF9FD" },
  };
  rootCol.props = {
    verticalArrangement: "top",
    horizontalAlignment: "start",
    gap: 12,
  };

  const nodes: Record<string, NodeData> = {
    [rootCol.id]: rootCol,
  };

  const childIds: string[] = [];

  // Sort groups by y position
  const sortedGroups = [...(doc.groups || [])].sort((a, b) => a.y - b.y);

  for (const g of sortedGroups) {
    if (!g.items || g.items.length === 0) continue;

    if (g.items.length === 1 && !g.free) {
      const itemNode = convertItemToNode(g.items[0]);
      nodes[itemNode.id] = itemNode;
      childIds.push(itemNode.id);
    } else {
      const isHorizontal = g.axis === "x" && !g.free;
      const groupNode = createDefaultNode(isHorizontal ? "Row" : g.free ? "Box" : "Column", g.id);
      groupNode.modifiers.width = "fillMax";
      groupNode.modifiers.height = "wrap";
      groupNode.props.gap = 8;
      if (isHorizontal) {
        groupNode.props.verticalAlignment = "center";
        groupNode.props.horizontalArrangement = "start";
      }

      const itemIds: string[] = [];
      for (const it of g.items) {
        const itemNode = convertItemToNode(it);
        nodes[itemNode.id] = itemNode;
        itemIds.push(itemNode.id);
      }
      groupNode.children = itemIds;
      nodes[groupNode.id] = groupNode;
      childIds.push(groupNode.id);
    }
  }

  rootCol.children = childIds;

  return {
    rootId: rootCol.id,
    nodes,
  };
}
