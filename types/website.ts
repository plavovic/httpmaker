export type SectionType = "navbar" | "hero" | "about" | "carousel" | "features" | "contact" | "footer";

export type SectionVariant = "luxury" | "brutalist";

export type Alignment = "left" | "center" | "right";
export type NavbarAppearance = "transparent" | "glass" | "colored";
export type NavbarScrollBehavior = "sticky" | "hide-on-scroll";

import type { DesignPresetId, ImageTreatment, SpacingScale, VisualDensity } from "@/types/designPreset";
export type WebsiteTheme = { backgroundColor:string; backgroundImageUrl?:string; backgroundImageFit?:"cover"|"contain"; surfaceColor:string; primaryColor:string; secondaryColor:string; accentColor:string; textColor:string; mutedTextColor:string; headingFont:string; bodyFont:string; borderRadius:number; spacingScale:SpacingScale; visualDensity:VisualDensity; imageTreatment:ImageTreatment; fontFamily?:string };

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
  formFields?: WebsiteFormField[];
  mapEmbedUrl?: string;
};

export type WebsiteFormField = {
  id: string;
  label: string;
  type: "text" | "email" | "tel" | "textarea";
  placeholder: string;
  required: boolean;
};

export type WebsiteSection = {
  id: string;
  type: SectionType;
  variant: SectionVariant;
  backgroundColor?: string;
  backgroundImageUrl?: string;
  backgroundImageFit?: "cover" | "contain";
  navbarAppearance?: NavbarAppearance;
  navbarScrollBehavior?: NavbarScrollBehavior;
  heightVh?: number;
  props: WebsiteSectionProps;
  elementStyles?: ElementStyleMap;
  elementLinks?: ElementLinkMap;
  animation?: "none" | "fade" | "slide-up" | "slide-left" | "slide-right" | "scale";
  animationSpeed?: "slow" | "normal" | "fast";
  content?: Record<string, string>;
};

export type WebsiteJSON = {
  schemaVersion: 1;
  presetId?: DesignPresetId;
  isThemeCustomized?: boolean;
  theme: WebsiteTheme;
  sections: WebsiteSection[];
};

export type ViewMode = "preview" | "dashboard" | "edit";

export type ColorMode = "sky" | "matcha" | "iris" | "midnight" | "macao" | "vice";

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
  widthPercent?: number;
  offsetX?: number;
  offsetY?: number;
  buttonStyle?: "filled" | "outline" | "text";
  backgroundColor?: string;
  borderColor?: string;
  borderRadius?: number;
  hoverEffect?: "none" | "glow" | "lift" | "scale" | "invert";
  hoverColor?: string;
  hoverTextColor?: string;
  animation?: "none" | "fade" | "slide-up" | "slide-left" | "slide-right" | "scale" | "float" | "pulse";
  animationSpeed?: "slow" | "normal" | "fast";
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
  onRequestImagePicker?: () => void;
};
