import { ComponentType, ModifierProps } from "./schema";

export type PropFieldType = "string" | "number" | "boolean" | "select" | "color";

export interface PropOption {
  label: string;
  value: string;
}

export interface PropDefinition {
  name: string;
  label: string;
  type: PropFieldType;
  options?: PropOption[];
  defaultValue: any;
}

export interface ComponentSpec {
  type: ComponentType;
  label: string;
  icon: string;
  category: "layout" | "basic" | "scroll" | "reusable";
  isContainer: boolean;
  defaultModifiers: ModifierProps;
  defaultProps: Record<string, any>;
  propDefinitions: PropDefinition[];
}

export const COMPONENT_REGISTRY: Record<ComponentType, ComponentSpec> = {
  Column: {
    type: "Column",
    label: "Column",
    icon: "view_column",
    category: "layout",
    isContainer: true,
    defaultModifiers: {
      width: "fillMax",
      height: "wrap",
    },
    defaultProps: {
      verticalArrangement: "top",
      horizontalAlignment: "start",
      gap: 8,
    },
    propDefinitions: [
      {
        name: "verticalArrangement",
        label: "Vertical Arrangement",
        type: "select",
        options: [
          { label: "Top", value: "top" },
          { label: "Center", value: "center" },
          { label: "Bottom", value: "bottom" },
          { label: "Space Between", value: "spaceBetween" },
          { label: "Space Around", value: "spaceAround" },
          { label: "Space Evenly", value: "spaceEvenly" },
        ],
        defaultValue: "top",
      },
      {
        name: "horizontalAlignment",
        label: "Horizontal Alignment",
        type: "select",
        options: [
          { label: "Start", value: "start" },
          { label: "Center", value: "center" },
          { label: "End", value: "end" },
        ],
        defaultValue: "start",
      },
      {
        name: "gap",
        label: "Item Gap (dp)",
        type: "number",
        defaultValue: 8,
      },
    ],
  },
  Row: {
    type: "Row",
    label: "Row",
    icon: "view_stream",
    category: "layout",
    isContainer: true,
    defaultModifiers: {
      width: "fillMax",
      height: "wrap",
    },
    defaultProps: {
      horizontalArrangement: "start",
      verticalAlignment: "center",
      gap: 8,
    },
    propDefinitions: [
      {
        name: "horizontalArrangement",
        label: "Horizontal Arrangement",
        type: "select",
        options: [
          { label: "Start", value: "start" },
          { label: "Center", value: "center" },
          { label: "End", value: "end" },
          { label: "Space Between", value: "spaceBetween" },
          { label: "Space Around", value: "spaceAround" },
          { label: "Space Evenly", value: "spaceEvenly" },
        ],
        defaultValue: "start",
      },
      {
        name: "verticalAlignment",
        label: "Vertical Alignment",
        type: "select",
        options: [
          { label: "Top", value: "top" },
          { label: "Center", value: "center" },
          { label: "Bottom", value: "bottom" },
        ],
        defaultValue: "center",
      },
      {
        name: "gap",
        label: "Item Gap (dp)",
        type: "number",
        defaultValue: 8,
      },
    ],
  },
  Box: {
    type: "Box",
    label: "Box",
    icon: "check_box_outline_blank",
    category: "layout",
    isContainer: true,
    defaultModifiers: {
      width: "wrap",
      height: "wrap",
    },
    defaultProps: {
      contentAlignment: "topStart",
    },
    propDefinitions: [
      {
        name: "contentAlignment",
        label: "Content Alignment",
        type: "select",
        options: [
          { label: "Top Start", value: "topStart" },
          { label: "Top Center", value: "topCenter" },
          { label: "Top End", value: "topEnd" },
          { label: "Center Start", value: "centerStart" },
          { label: "Center", value: "center" },
          { label: "Center End", value: "centerEnd" },
          { label: "Bottom Start", value: "bottomStart" },
          { label: "Bottom Center", value: "bottomCenter" },
          { label: "Bottom End", value: "bottomEnd" },
        ],
        defaultValue: "topStart",
      },
    ],
  },
  LazyColumn: {
    type: "LazyColumn",
    label: "LazyColumn",
    icon: "view_day",
    category: "scroll",
    isContainer: true,
    defaultModifiers: {
      width: "fillMax",
      height: "fillMax",
    },
    defaultProps: {
      contentPadding: 16,
      gap: 8,
      reverseLayout: false,
    },
    propDefinitions: [
      {
        name: "contentPadding",
        label: "Content Padding (dp)",
        type: "number",
        defaultValue: 16,
      },
      {
        name: "gap",
        label: "Item Gap (dp)",
        type: "number",
        defaultValue: 8,
      },
      {
        name: "reverseLayout",
        label: "Reverse Layout",
        type: "boolean",
        defaultValue: false,
      },
    ],
  },
  LazyRow: {
    type: "LazyRow",
    label: "LazyRow",
    icon: "view_carousel",
    category: "scroll",
    isContainer: true,
    defaultModifiers: {
      width: "fillMax",
      height: "wrap",
    },
    defaultProps: {
      contentPadding: 16,
      gap: 8,
      reverseLayout: false,
    },
    propDefinitions: [
      {
        name: "contentPadding",
        label: "Content Padding (dp)",
        type: "number",
        defaultValue: 16,
      },
      {
        name: "gap",
        label: "Item Gap (dp)",
        type: "number",
        defaultValue: 8,
      },
      {
        name: "reverseLayout",
        label: "Reverse Layout",
        type: "boolean",
        defaultValue: false,
      },
    ],
  },
  Text: {
    type: "Text",
    label: "Text",
    icon: "text_fields",
    category: "basic",
    isContainer: false,
    defaultModifiers: {
      width: "wrap",
      height: "wrap",
    },
    defaultProps: {
      text: "Hello Compose",
      size: 16,
      weight: "normal",
      color: "#1D1B20",
      maxLines: 1,
    },
    propDefinitions: [
      {
        name: "text",
        label: "Content",
        type: "string",
        defaultValue: "Hello Compose",
      },
      {
        name: "size",
        label: "Font Size (sp)",
        type: "number",
        defaultValue: 16,
      },
      {
        name: "weight",
        label: "Font Weight",
        type: "select",
        options: [
          { label: "Normal", value: "normal" },
          { label: "Medium", value: "medium" },
          { label: "Bold", value: "bold" },
        ],
        defaultValue: "normal",
      },
      {
        name: "color",
        label: "Color",
        type: "color",
        defaultValue: "#1D1B20",
      },
      {
        name: "maxLines",
        label: "Max Lines",
        type: "number",
        defaultValue: 1,
      },
    ],
  },
  Button: {
    type: "Button",
    label: "Button",
    icon: "smart_button",
    category: "basic",
    isContainer: false,
    defaultModifiers: {
      width: "wrap",
      height: "wrap",
    },
    defaultProps: {
      label: "Button",
      enabled: true,
      variant: "filled",
    },
    propDefinitions: [
      {
        name: "label",
        label: "Label",
        type: "string",
        defaultValue: "Button",
      },
      {
        name: "variant",
        label: "Variant",
        type: "select",
        options: [
          { label: "Filled", value: "filled" },
          { label: "Tonal", value: "tonal" },
          { label: "Outlined", value: "outlined" },
          { label: "Elevated", value: "elevated" },
          { label: "Text", value: "text" },
        ],
        defaultValue: "filled",
      },
      {
        name: "enabled",
        label: "Enabled",
        type: "boolean",
        defaultValue: true,
      },
    ],
  },
  TextField: {
    type: "TextField",
    label: "TextField",
    icon: "edit_note",
    category: "basic",
    isContainer: false,
    defaultModifiers: {
      width: "fillMax",
      height: "wrap",
    },
    defaultProps: {
      label: "Label",
      placeholder: "Hint text",
      value: "",
    },
    propDefinitions: [
      {
        name: "label",
        label: "Label",
        type: "string",
        defaultValue: "Label",
      },
      {
        name: "placeholder",
        label: "Placeholder",
        type: "string",
        defaultValue: "Hint text",
      },
      {
        name: "value",
        label: "Value",
        type: "string",
        defaultValue: "",
      },
    ],
  },
  Image: {
    type: "Image",
    label: "Image",
    icon: "image",
    category: "basic",
    isContainer: false,
    defaultModifiers: {
      width: "fillMax",
      height: 180,
    },
    defaultProps: {
      source: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600",
      contentScale: "crop",
    },
    propDefinitions: [
      {
        name: "source",
        label: "Image URL",
        type: "string",
        defaultValue: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600",
      },
      {
        name: "contentScale",
        label: "Content Scale",
        type: "select",
        options: [
          { label: "Crop", value: "crop" },
          { label: "Fit", value: "fit" },
          { label: "Fill Bounds", value: "fillBounds" },
        ],
        defaultValue: "crop",
      },
    ],
  },
  Spacer: {
    type: "Spacer",
    label: "Spacer",
    icon: "space_bar",
    category: "basic",
    isContainer: false,
    defaultModifiers: {
      height: 16,
      width: "wrap",
    },
    defaultProps: {
      size: 16,
    },
    propDefinitions: [
      {
        name: "size",
        label: "Size (dp)",
        type: "number",
        defaultValue: 16,
      },
    ],
  },
  Divider: {
    type: "Divider",
    label: "Divider",
    icon: "horizontal_rule",
    category: "basic",
    isContainer: false,
    defaultModifiers: {
      width: "fillMax",
      height: "wrap",
    },
    defaultProps: {
      thickness: 1,
      color: "#CAC4D0",
    },
    propDefinitions: [
      {
        name: "thickness",
        label: "Thickness (dp)",
        type: "number",
        defaultValue: 1,
      },
      {
        name: "color",
        label: "Color",
        type: "color",
        defaultValue: "#CAC4D0",
      },
    ],
  },
  Custom: {
    type: "Custom",
    label: "Custom Component",
    icon: "extension",
    category: "reusable",
    isContainer: false,
    defaultModifiers: {
      width: "wrap",
      height: "wrap",
    },
    defaultProps: {
      componentId: "",
      name: "CustomComponent",
    },
    propDefinitions: [
      {
        name: "name",
        label: "Component Name",
        type: "string",
        defaultValue: "CustomComponent",
      },
    ],
  },
};
