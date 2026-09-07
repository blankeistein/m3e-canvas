import { describe, expect, it } from "vitest";
import { createDefaultNode, hydrate, serialize } from "./hydrate";
import { NodeData } from "./schema";
import { convertDocToComposeDoc } from "./adapter";

describe("Compose Core System", () => {
  it("creates default nodes with expected props from registry", () => {
    const col = createDefaultNode("Column", "col_1");
    expect(col.type).toBe("Column");
    expect(col.props.verticalArrangement).toBe("top");
    expect(col.modifiers.width).toBe("fillMax");
    expect(col.children).toEqual([]);

    const txt = createDefaultNode("Text", "txt_1");
    expect(txt.type).toBe("Text");
    expect(txt.props.text).toBe("Hello Compose");
    expect(txt.children).toBeUndefined();
  });

  it("hydrates a 3+ level nested tree correctly", () => {
    // Column > Row > Box > Text
    const col: NodeData = {
      id: "col_1",
      type: "Column",
      modifiers: { width: "fillMax", padding: { all: 16 } },
      props: { verticalArrangement: "top", gap: 12 },
      children: ["row_1"],
    };

    const row: NodeData = {
      id: "row_1",
      type: "Row",
      modifiers: { width: "fillMax" },
      props: { horizontalArrangement: "spaceBetween", verticalAlignment: "center" },
      children: ["box_1"],
    };

    const box: NodeData = {
      id: "box_1",
      type: "Box",
      modifiers: { clip: { radius: 8 }, background: { color: "#FFFFFF" } },
      props: { contentAlignment: "center" },
      children: ["txt_1"],
    };

    const txt: NodeData = {
      id: "txt_1",
      type: "Text",
      modifiers: {},
      props: { text: "Deep nested text", size: 18, weight: "bold" },
    };

    const nodeMap: Record<string, NodeData> = {
      col_1: col,
      row_1: row,
      box_1: box,
      txt_1: txt,
    };

    const tree = hydrate("col_1", nodeMap);
    expect(tree.id).toBe("col_1");
    expect(tree.children.length).toBe(1);
    expect(tree.children[0].id).toBe("row_1");
    expect(tree.children[0].children.length).toBe(1);
    expect(tree.children[0].children[0].id).toBe("box_1");
    expect(tree.children[0].children[0].children.length).toBe(1);
    expect(tree.children[0].children[0].children[0].id).toBe("txt_1");

    // Test Kotlin generation
    const kotlinCode = tree.toKotlin(0);
    expect(kotlinCode).toContain("Column(");
    expect(kotlinCode).toContain("fillMaxWidth()");
    expect(kotlinCode).toContain("padding(16.dp)");
    expect(kotlinCode).toContain("Row(");
    expect(kotlinCode).toContain("Arrangement.SpaceBetween");
    expect(kotlinCode).toContain("Box(");
    expect(kotlinCode).toContain("Alignment.Center");
    expect(kotlinCode).toContain('Text(text = "Deep nested text", fontSize = 18.sp, fontWeight = FontWeight.Bold)');

    // Test React generation
    const reactCode = tree.toReact(0);
    expect(reactCode).toContain("<div");
    expect(reactCode).toContain("flexDirection: \"column\"");
    expect(reactCode).toContain("flexDirection: \"row\"");
    expect(reactCode).toContain("placeItems: \"center\"");
    expect(reactCode).toContain("<p");
    expect(reactCode).toContain("Deep nested text</p>");
  });

  it("translates modifiers to Kotlin and React accurately", () => {
    const box: NodeData = {
      id: "box_mod",
      type: "Box",
      modifiers: {
        width: "fillMax",
        height: 200,
        padding: { horizontal: 16, vertical: 8 },
        background: { color: "#6750A4" },
        clip: { radius: 14 },
        weight: 1,
        clickable: true,
      },
      props: { contentAlignment: "center" },
      children: [],
    };

    const node = hydrate("box_mod", { box_mod: box });

    const kotlin = node.toKotlin(0);
    expect(kotlin).toContain(".fillMaxWidth()");
    expect(kotlin).toContain(".height(200.dp)");
    expect(kotlin).toContain(".weight(1f)");
    expect(kotlin).toContain(".padding(horizontal = 16.dp, vertical = 8.dp)");
    expect(kotlin).toContain(".clip(RoundedCornerShape(14.dp))");
    expect(kotlin).toContain(".background(Color(0xFF6750A4))");
    expect(kotlin).toContain(".clickable { /* onClick */ }");

    const reactStyle = node.modifierToReactStyle();
    expect(reactStyle.width).toBe("100%");
    expect(reactStyle.height).toBe("200px");
    expect(reactStyle.flex).toBe(1);
    expect(reactStyle.backgroundColor).toBe("#6750A4");
    expect(reactStyle.borderRadius).toBe("14px");
    expect(reactStyle.cursor).toBe("pointer");
  });

  it("serializes tree back to normalized JSON format without loss", () => {
    const col: NodeData = {
      id: "c1",
      type: "Column",
      modifiers: { width: "fillMax" },
      props: { gap: 10 },
      children: ["t1", "b1"],
    };
    const t1: NodeData = {
      id: "t1",
      type: "Text",
      modifiers: {},
      props: { text: "Title" },
    };
    const b1: NodeData = {
      id: "b1",
      type: "Button",
      modifiers: {},
      props: { label: "Click" },
    };

    const originalMap = { c1: col, t1, b1 };
    const tree = hydrate("c1", originalMap);
    const serialized = serialize(tree);

    expect(serialized.rootId).toBe("c1");
    expect(Object.keys(serialized.nodes)).toHaveLength(3);
    expect(serialized.nodes.c1.children).toEqual(["t1", "b1"]);
    expect(serialized.nodes.t1.props.text).toBe("Title");
    expect(serialized.nodes.b1.props.label).toBe("Click");
  });

  it("converts m3e Doc items and groups to ComposeDoc correctly", () => {
    const mockDoc: any = {
      groups: [
        {
          id: "g1",
          x: 0,
          y: 0,
          axis: "x",
          items: [
            { id: "i1", kind: "button", label: "Save", variant: "filled" },
            { id: "i2", kind: "textField", label: "Username", supporting: "Enter name" },
          ],
        },
      ],
      frames: [],
      frame: "phone",
      paletteKey: "purple",
    };

    const doc = convertDocToComposeDoc(mockDoc);
    expect(doc.rootId).toBe("root_screen");
    expect(doc.nodes.root_screen.type).toBe("Column");
    expect(doc.nodes.g1.type).toBe("Row");
    expect(doc.nodes.i1.type).toBe("Button");
    expect(doc.nodes.i1.props.label).toBe("Save");
    expect(doc.nodes.i2.type).toBe("TextField");
    expect(doc.nodes.i2.props.placeholder).toBe("Enter name");
  });

  it("converts Column and Row containment items to their respective node types", () => {
    const mockDoc: any = {
      groups: [
        {
          id: "g_col",
          x: 0,
          y: 0,
          axis: "y",
          items: [
            { id: "item_col", kind: "box", label: "Column", composeType: "Column" },
          ],
        },
        {
          id: "g_row",
          x: 0,
          y: 100,
          axis: "x",
          items: [
            { id: "item_row", kind: "box", label: "Row", composeType: "Row" },
          ],
        },
      ],
      frames: [],
      frame: "phone",
    };

    const doc = convertDocToComposeDoc(mockDoc);
    expect(doc.nodes.item_col.type).toBe("Column");
    expect(doc.nodes.item_row.type).toBe("Row");
  });
});
