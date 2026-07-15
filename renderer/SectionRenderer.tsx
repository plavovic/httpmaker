import { sectionRegistry } from "@/renderer/sectionRegistry";
import type { EditableElementKey, ElementLinkMap, ElementStyleMap, WebsiteSection, WebsiteTheme } from "@/types/website";

type SectionRendererProps = { section: WebsiteSection; theme: WebsiteTheme; editable?: boolean; selectedElementKey?: EditableElementKey; onSelectElement?: (elementKey: EditableElementKey) => void; elementStyles?: ElementStyleMap; elementLinks?: ElementLinkMap; onUpdateElement?: (elementKey: EditableElementKey, value: string) => void; onRequestImagePicker?:()=>void };

export default function SectionRenderer({ section, theme, editable, selectedElementKey, onSelectElement, elementStyles, elementLinks, onUpdateElement,onRequestImagePicker }: SectionRendererProps) {
  const Component = sectionRegistry[section.type]?.[section.variant];
  if (!Component) return null;
  return <Component section={section} theme={theme} editable={editable} selectedElementKey={selectedElementKey} onSelectElement={onSelectElement} elementStyles={elementStyles} elementLinks={elementLinks} onUpdateElement={onUpdateElement} onRequestImagePicker={onRequestImagePicker} />;
}
