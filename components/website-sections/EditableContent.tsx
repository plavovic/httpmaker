import type { CSSProperties, MouseEvent, ReactNode } from "react";
import type { EditableElementKey, WebsiteSectionComponentProps } from "@/types/website";
import { getImageTreatmentStyle } from "@/utils/getImageTreatmentStyle";

type EditorProps = Pick<WebsiteSectionComponentProps, "section" | "theme" | "editable" | "selectedElementKey" | "onSelectElement" | "elementStyles" | "onRequestImagePicker">;
type EditableTextProps = EditorProps & { elementKey: EditableElementKey; children: ReactNode; className?: string };

function visualStyle(props: EditorProps, key: EditableElementKey): CSSProperties {
  const configured = props.elementStyles?.[key] ?? {};
  const { buttonStyle, backgroundColor, borderColor, borderRadius, hoverEffect: _hoverEffect, hoverColor, hoverTextColor, animation: _animation, animationSpeed: _animationSpeed, widthPercent, offsetX, offsetY, ...style } = configured;
  const imageUsesGridTrack = key === "imageUrl" && (props.section.type === "hero" || props.section.type === "about");
  const isButton = key === "buttonText" || key === "secondaryButtonText";
  const filled = (buttonStyle ?? (key === "buttonText" ? "filled" : "outline")) === "filled";
  const buttonVisual = isButton ? { backgroundColor: filled ? backgroundColor ?? props.theme.primaryColor : "transparent", borderColor: borderColor ?? props.theme.primaryColor, borderRadius: `${borderRadius ?? props.theme.borderRadius}px`, color: style.color ?? (filled ? props.theme.backgroundColor : props.theme.textColor), "--button-hover-color": hoverColor ?? props.theme.accentColor, "--button-hover-text": hoverTextColor ?? props.theme.backgroundColor } as CSSProperties : {};
  return { ...style, ...buttonVisual, position:offsetX||offsetY?"relative":undefined, left:offsetX?`${offsetX}px`:undefined, top:offsetY?`${offsetY}px`:undefined, ...(widthPercent ? { width: imageUsesGridTrack ? "100%" : `${widthPercent}%`, maxWidth: "100%" } : {}) };
}

function motion(props: EditorProps, key: EditableElementKey) {
  const style = props.elementStyles?.[key];
  return {
    "data-element-animation": style?.animation && style.animation !== "none" ? style.animation : undefined,
    "data-animation-speed": style?.animationSpeed ?? "normal",
  };
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
  const isButton = props.elementKey === "buttonText" || props.elementKey === "secondaryButtonText";
  const hoverEffect = props.elementStyles?.[props.elementKey]?.hoverEffect ?? "none";
  const value = props.elementKey.startsWith("content.") ? props.section.content?.[props.elementKey] ?? props.children : props.children;
  return <span {...motion(props, props.elementKey)} data-editor-element={props.elementKey} data-button-hover={isButton ? hoverEffect : undefined} onClick={select(props, props.elementKey)} style={visualStyle(props, props.elementKey)} className={`${props.className ?? ""} editable-site-element ${isButton ? "editable-site-button" : ""} ${props.editable ? "cursor-text rounded-sm outline outline-2 outline-offset-2" : ""} ${selected ? "outline-blue-500" : props.editable ? "outline-transparent hover:outline-blue-300" : ""}`}>{value}</span>;
}

type EditableImageProps = EditorProps & { src: string; alt: string; className: string };
export function EditableImage(props: EditableImageProps) {
  const selected = props.editable && props.selectedElementKey === "imageUrl";
  return <img {...motion(props, "imageUrl")} data-editor-element="imageUrl" onClick={select(props, "imageUrl")} onDoubleClick={(event)=>{if(!props.editable)return;event.preventDefault();event.stopPropagation();props.onSelectElement?.("imageUrl");props.onRequestImagePicker?.()}} src={props.src} alt={props.alt} style={{...(!props.editable?getImageTreatmentStyle(props.theme.imageTreatment):{}),...visualStyle(props, "imageUrl")}} className={`${props.className} editable-site-element ${props.editable ? "cursor-pointer outline outline-2 outline-offset-4" : ""} ${selected ? "outline-blue-500" : props.editable ? "outline-transparent hover:outline-blue-300" : ""}`} />;
}
