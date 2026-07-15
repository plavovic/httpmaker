import type { CSSProperties, MouseEvent, ReactNode } from "react";
import type { EditableElementKey, WebsiteSectionComponentProps } from "@/types/website";
import { getImageTreatmentStyle } from "@/utils/getImageTreatmentStyle";

type EditorProps = Pick<WebsiteSectionComponentProps, "section" | "theme" | "editable" | "selectedElementKey" | "onSelectElement" | "elementStyles" | "onRequestImagePicker">;
type EditableTextProps = EditorProps & { elementKey: EditableElementKey; children: ReactNode; className?: string };

function visualStyle(props: EditorProps, key: EditableElementKey): CSSProperties {
  const { buttonStyle: _buttonStyle, widthPercent, ...style } = props.elementStyles?.[key] ?? {};
  const imageUsesGridTrack = key === "imageUrl" && (props.section.type === "hero" || props.section.type === "about");
  return { ...style, ...(widthPercent ? { width: imageUsesGridTrack ? "100%" : `${widthPercent}%` } : {}) };
}

function select(props: EditorProps, key: EditableElementKey) {
  return (event: MouseEvent<HTMLElement>) => {
    if (!props.editable) return;
    event.preventDefault();
    event.stopPropagation();
    props.onSelectElement?.(key);
  };
}

export function EditableText(props: EditableTextProps) {
  const selected = props.editable && props.selectedElementKey === props.elementKey;
  const value = props.elementKey.startsWith("content.") ? props.section.content?.[props.elementKey] ?? props.children : props.children;
  return <span data-editor-element={props.elementKey} onClick={select(props, props.elementKey)} style={visualStyle(props, props.elementKey)} className={`${props.className ?? ""} ${props.editable ? "cursor-text rounded-sm outline outline-2 outline-offset-2" : ""} ${selected ? "outline-blue-500" : props.editable ? "outline-transparent hover:outline-blue-300" : ""}`}>{value}</span>;
}

type EditableImageProps = EditorProps & { src: string; alt: string; className: string };
export function EditableImage(props: EditableImageProps) {
  const selected = props.editable && props.selectedElementKey === "imageUrl";
  return <img data-editor-element="imageUrl" onClick={select(props, "imageUrl")} onDoubleClick={(event)=>{if(!props.editable)return;event.preventDefault();event.stopPropagation();props.onSelectElement?.("imageUrl");props.onRequestImagePicker?.()}} src={props.src} alt={props.alt} style={{...(!props.editable?getImageTreatmentStyle(props.theme.imageTreatment):{}),...visualStyle(props, "imageUrl")}} className={`${props.className} ${props.editable ? "cursor-pointer outline outline-2 outline-offset-4" : ""} ${selected ? "outline-blue-500" : props.editable ? "outline-transparent hover:outline-blue-300" : ""}`} />;
}
