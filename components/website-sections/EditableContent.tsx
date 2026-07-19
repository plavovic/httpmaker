import type { CSSProperties, MouseEvent, ReactNode } from "react";
import type { EditableElementKey, WebsiteFormField, WebsiteSectionComponentProps } from "@/types/website";
import { getImageTreatmentStyle } from "@/utils/getImageTreatmentStyle";

type EditorProps = Pick<WebsiteSectionComponentProps, "section" | "theme" | "editable" | "selectedElementKey" | "onSelectElement" | "elementStyles" | "onRequestImagePicker">;
type EditableTextProps = EditorProps & { elementKey: EditableElementKey; children: ReactNode; className?: string };

function visualStyle(props: EditorProps, key: EditableElementKey): CSSProperties {
  const configured = props.elementStyles?.[key] ?? {};
  const { buttonStyle, backgroundColor, borderColor, borderRadius, hoverEffect: _hoverEffect, hoverColor, hoverTextColor, animation: _animation, animationSpeed: _animationSpeed, widthPercent, offsetX, offsetY, ...style } = configured;
  const imageUsesGridTrack = key === "imageUrl" && (props.section.type === "hero" || props.section.type === "about");
  const isButton = key === "buttonText" || key === "secondaryButtonText";
  const isFormInput = /^content\.formField\..+\.placeholder$/.test(key);
  const resolvedButtonStyle = buttonStyle ?? (key === "buttonText" ? "filled" : "outline");
  const filled = resolvedButtonStyle === "filled";
  const textOnly = resolvedButtonStyle === "text";
  const buttonVisual = isButton ? { backgroundColor: filled ? backgroundColor ?? props.theme.primaryColor : "transparent", borderColor: textOnly ? "transparent" : borderColor ?? props.theme.primaryColor, borderRadius: textOnly ? "0" : `${borderRadius ?? props.theme.borderRadius}px`, color: style.color ?? (filled ? props.theme.backgroundColor : props.theme.textColor), padding: textOnly ? "0.35rem 0" : undefined, "--button-hover-color": hoverColor ?? props.theme.accentColor, "--button-hover-text": hoverTextColor ?? props.theme.backgroundColor } as CSSProperties : {};
  const formVisual = isFormInput ? { backgroundColor, borderColor, borderRadius: borderRadius === undefined ? undefined : `${borderRadius}px` } : {};
  return { ...style, ...buttonVisual, ...formVisual, position:offsetX||offsetY?"relative":undefined, left:offsetX?`${offsetX}px`:undefined, top:offsetY?`${offsetY}px`:undefined, ...(widthPercent ? { width: imageUsesGridTrack ? "100%" : `${widthPercent}%`, maxWidth: "100%" } : {}) };
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
  if (!props.src && !props.editable) return null;
  const selected = props.editable && props.selectedElementKey === "imageUrl";
  return <img {...motion(props, "imageUrl")} data-editor-element="imageUrl" onClick={select(props, "imageUrl")} onDoubleClick={(event)=>{if(!props.editable)return;event.preventDefault();event.stopPropagation();props.onSelectElement?.("imageUrl");props.onRequestImagePicker?.()}} src={props.src} alt={props.alt} style={{...(!props.editable?getImageTreatmentStyle(props.theme.imageTreatment):{}),...visualStyle(props, "imageUrl")}} className={`${props.className} editable-site-element ${props.editable ? "cursor-pointer outline outline-2 outline-offset-4" : ""} ${selected ? "outline-blue-500" : props.editable ? "outline-transparent hover:outline-blue-300" : ""}`} />;
}

type EditableFormFieldProps = EditorProps & { field: WebsiteFormField };

export function EditableFormField(props: EditableFormFieldProps) {
  const labelKey = `content.formField.${props.field.id}.label` as EditableElementKey;
  const inputKey = `content.formField.${props.field.id}.placeholder` as EditableElementKey;
  const selected = props.editable && props.selectedElementKey === inputKey;
  const inputProps = {
    placeholder: props.field.placeholder,
    required: props.field.required,
    "data-editor-element": inputKey,
    onClick: select(props, inputKey),
    style: visualStyle(props, inputKey),
    className: `editable-site-element ${props.editable ? "cursor-move outline outline-2 outline-offset-2" : ""} ${selected ? "outline-blue-500" : props.editable ? "outline-transparent hover:outline-blue-300" : ""}`,
  };

  return <label className="site-editable-form-field">
    <EditableText {...props} elementKey={labelKey}>{props.field.label}</EditableText>
    {props.field.type === "textarea" ? <textarea {...inputProps} /> : <input {...inputProps} type={props.field.type} />}
  </label>;
}
