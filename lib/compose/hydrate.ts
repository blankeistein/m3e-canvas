import { ComponentType, ComposeDoc, NodeData } from "./schema";
import { COMPONENT_REGISTRY } from "./registry";
import { ComposeNode, createNodeInstance } from "./nodes";

export function generateId(): string {
  return "node_" + Math.random().toString(36).slice(2, 9);
}

export function createDefaultNode(type: ComponentType, customId?: string): NodeData {
  const spec = COMPONENT_REGISTRY[type] || COMPONENT_REGISTRY.Box;
  return {
    id: customId || generateId(),
    type,
    modifiers: JSON.parse(JSON.stringify(spec.defaultModifiers)),
    props: JSON.parse(JSON.stringify(spec.defaultProps)),
    children: spec.isContainer ? [] : undefined,
  };
}

export function hydrate(rootId: string, nodeMap: Record<string, NodeData>): ComposeNode {
  const rootData = nodeMap[rootId];
  if (!rootData) {
    const fallback = createDefaultNode("Box", rootId);
    return createNodeInstance(fallback);
  }

  const instance = createNodeInstance(rootData);
  if (rootData.children && rootData.children.length > 0) {
    instance.children = rootData.children
      .map((childId) => hydrate(childId, nodeMap))
      .filter((n): n is ComposeNode => Boolean(n));
  }
  return instance;
}

export function serialize(root: ComposeNode): { rootId: string; nodes: Record<string, NodeData> } {
  const nodes: Record<string, NodeData> = {};

  function traverse(node: ComposeNode): string {
    const childIds: string[] = [];
    for (const child of node.children) {
      childIds.push(traverse(child));
    }

    nodes[node.id] = {
      id: node.id,
      type: node.type,
      modifiers: JSON.parse(JSON.stringify(node.modifiers)),
      props: JSON.parse(JSON.stringify(node.props)),
      children: childIds.length > 0 || COMPONENT_REGISTRY[node.type]?.isContainer ? childIds : undefined,
    };
    return node.id;
  }

  const rootId = traverse(root);
  return { rootId, nodes };
}

export function createInitialDocument(): ComposeDoc {
  const col = createDefaultNode("Column", "root_col");
  col.modifiers = {
    padding: { all: 16 },
    width: "fillMax",
    height: "wrap",
    background: { color: "#FEF7FF" },
  };
  col.props = {
    verticalArrangement: "top",
    horizontalAlignment: "start",
    gap: 12,
  };

  const titleText = createDefaultNode("Text", "text_title");
  titleText.props = {
    text: "Welcome to Visual Compose",
    size: 22,
    weight: "bold",
    color: "#1D1B20",
  };

  const subtitleText = createDefaultNode("Text", "text_subtitle");
  subtitleText.props = {
    text: "Design visually, export to React JSX & Kotlin Jetpack Compose",
    size: 14,
    weight: "normal",
    color: "#49454F",
  };

  const cardRow = createDefaultNode("Row", "row_actions");
  cardRow.modifiers = {
    width: "fillMax",
    height: "wrap",
    padding: { all: 8 },
    clip: { radius: 12 },
    background: { color: "#E8DEF8" },
  };
  cardRow.props = {
    horizontalArrangement: "spaceBetween",
    verticalAlignment: "center",
    gap: 8,
  };

  const btnPrimary = createDefaultNode("Button", "btn_primary");
  btnPrimary.props = {
    label: "Get Started",
    variant: "filled",
  };

  const btnOutlined = createDefaultNode("Button", "btn_outlined");
  btnOutlined.props = {
    label: "Docs",
    variant: "outlined",
  };

  cardRow.children = [btnPrimary.id, btnOutlined.id];
  col.children = [titleText.id, subtitleText.id, cardRow.id];

  const nodes: Record<string, NodeData> = {
    [col.id]: col,
    [titleText.id]: titleText,
    [subtitleText.id]: subtitleText,
    [cardRow.id]: cardRow,
    [btnPrimary.id]: btnPrimary,
    [btnOutlined.id]: btnOutlined,
  };

  return {
    rootId: col.id,
    nodes,
  };
}
