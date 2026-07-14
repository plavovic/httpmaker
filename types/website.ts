export type SectionType = "navbar" | "hero" | "about" | "carousel" | "features" | "contact" | "footer";

export type SectionVariant = "luxury" | "brutalist";

export type Alignment = "left" | "center" | "right";

export type WebsiteTheme = {
  backgroundColor: string;
  primaryColor: string;
  textColor: string;
  fontFamily: string;
};

export type WebsiteSectionProps = {
  title: string;
  subtitle: string;
  buttonText: string;
  secondaryButtonText: string;
  imageUrl: string;
  alignment: Alignment;
  statLabel: string;
  statValue: string;
  altText?: string;
  items?: string[];
};

export type WebsiteSection = {
  id: string;
  type: SectionType;
  variant: SectionVariant;
  props: WebsiteSectionProps;
  elementStyles?: ElementStyleMap;
  elementLinks?: ElementLinkMap;
  animation?: "none" | "fade" | "slide-up" | "slide-left" | "slide-right" | "scale";
  animationSpeed?: "slow" | "normal" | "fast";
  content?: Record<string, string>;
};

export type WebsiteJSON = {
  theme: WebsiteTheme;
  sections: WebsiteSection[];
};

export type ViewMode = "preview" | "dashboard" | "edit";

export type ColorMode = "dark" | "light";

export type EditableElementKey =
  | "title"
  | "subtitle"
  | "buttonText"
  | "secondaryButtonText"
  | "imageUrl"
  | "statLabel"
  | "statValue"
  | `content.${string}`;

export type SelectedElement = {
  sectionId: string;
  elementKey: EditableElementKey;
};

export type EditorSelection = {
  sectionId: string;
  elementKey?: EditableElementKey;
};

export type EditableElementStyle = {
  color?: string;
  fontFamily?: string;
  fontSize?: string;
  fontWeight?: string;
  fontStyle?: "normal" | "italic";
  textDecoration?: "none" | "underline";
  textAlign?: Alignment;
  lineHeight?: string;
  letterSpacing?: string;
  objectFit?: "cover" | "contain";
  buttonStyle?: "filled" | "outline";
};

export type ElementStyleMap = Partial<Record<EditableElementKey, EditableElementStyle>>;
export type ElementLinkMap = Partial<Record<EditableElementKey, string>>;

export type WebsiteSectionComponentProps = {
  section: WebsiteSection;
  theme: WebsiteTheme;
  editable?: boolean;
  selectedElementKey?: EditableElementKey;
  onSelectElement?: (elementKey: EditableElementKey) => void;
  elementStyles?: ElementStyleMap;
  elementLinks?: ElementLinkMap;
  onUpdateElement?: (elementKey: EditableElementKey, value: string) => void;
};
