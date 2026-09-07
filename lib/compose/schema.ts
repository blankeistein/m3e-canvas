export type ComponentType =
  | "Column"
  | "Row"
  | "Box"
  | "LazyColumn"
  | "LazyRow"
  | "Text"
  | "Button"
  | "TextField"
  | "Image"
  | "Spacer"
  | "Divider"
  | "Custom";

export type DimensionValue = "fillMax" | "wrap" | number;

export interface PaddingValue {
  all?: number;
  horizontal?: number;
  vertical?: number;
  top?: number;
  bottom?: number;
  start?: number;
  end?: number;
}

export interface BackgroundValue {
  color?: string;
}

export interface ClipValue {
  radius?: number;
  shape?: "rounded" | "circle";
}

export interface ModifierProps {
  padding?: PaddingValue;
  width?: DimensionValue;
  height?: DimensionValue;
  background?: BackgroundValue;
  clip?: ClipValue;
  weight?: number | null;
  clickable?: boolean | null;
}

export interface NodeData {
  id: string;
  type: ComponentType;
  modifiers: ModifierProps;
  props: Record<string, any>;
  children?: string[];
}

export interface CustomComponentDef {
  id: string;
  name: string;
  rootId: string;
  nodes: Record<string, NodeData>;
}

export interface ComposeDoc {
  rootId: string;
  nodes: Record<string, NodeData>;
  customComponents?: Record<string, CustomComponentDef>;
}
