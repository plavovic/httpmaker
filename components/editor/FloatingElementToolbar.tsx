"use client";

import { useLayoutEffect, useState, type CSSProperties } from "react";
import type { EditableElementKey, EditableElementStyle } from "@/types/website";

type FloatingElementToolbarProps = {
  sectionId: string;
  elementKey: EditableElementKey;
  style: EditableElementStyle;
  link: string;
  value: string;
  onStyleChange: (patch: Partial<EditableElementStyle>) => void;
  onLinkChange: (value: string) => void;
  onValueChange: (value: string) => void;
};

type ToolbarPosition = { left: number; top: number; placement: "above" | "below"; tone: "light" | "dark" };

const textKeys: EditableElementKey[] = ["title", "subtitle", "statLabel", "statValue"];
const buttonKeys: EditableElementKey[] = ["buttonText", "secondaryButtonText"];

export default function FloatingElementToolbar({ sectionId, elementKey, style, link, value, onStyleChange, onLinkChange, onValueChange }: FloatingElementToolbarProps) {
  const [position, setPosition] = useState<ToolbarPosition>();

  useLayoutEffect(() => {
    const updatePosition = () => {
      const element = document.querySelector<HTMLElement>(`[data-section-id="${CSS.escape(sectionId)}"] [data-editor-element="${CSS.escape(elementKey)}"]`);
      if (!element) return setPosition(undefined);
      const rect = element.getBoundingClientRect();
      const placement = rect.bottom + 190 < window.innerHeight ? "below" : "above";
      const background = getComputedStyle(element.parentElement ?? element).backgroundColor;
      const channels = background.match(/\d+/g)?.slice(0, 3).map(Number) ?? [255, 255, 255];
      const luminance = channels[0] * 0.299 + channels[1] * 0.587 + channels[2] * 0.114;
      setPosition({ left: Math.max(12, Math.min(rect.left, window.innerWidth - 560)), top: placement === "below" ? rect.bottom + 10 : rect.top - 10, placement, tone: luminance < 140 ? "light" : "dark" });
    };
    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => { window.removeEventListener("resize", updatePosition); window.removeEventListener("scroll", updatePosition, true); };
  }, [elementKey, sectionId]);

  if (!position) return null;
  const isText = textKeys.includes(elementKey) || elementKey.startsWith("content.");
  const isButton = buttonKeys.includes(elementKey);
  const positionStyle: CSSProperties = { left: position.left, top: position.top, transform: position.placement === "above" ? "translateY(-100%)" : undefined };

  return <div className={`element-toolbar element-toolbar-${position.tone}`} style={positionStyle} onClick={(event) => event.stopPropagation()}>
    <div className="element-toolbar-row">
      <span className="element-toolbar-label">{elementKey === "imageUrl" ? "Image" : isButton ? "Button" : "Text"}</span>
      {(isText || isButton) && <>
        <input aria-label="Text color" title="Text color" type="color" value={style.color ?? "#111111"} onChange={(event) => onStyleChange({ color: event.target.value })} />
        <select aria-label="Font family" value={style.fontFamily ?? "inherit"} onChange={(event) => onStyleChange({ fontFamily: event.target.value })}><option value="inherit">Default font</option><option value="Georgia, serif">Serif</option><option value="Arial, sans-serif">Sans</option><option value="monospace">Mono</option></select>
        <input className="toolbar-number" aria-label="Font size" title="Font size" value={style.fontSize ?? ""} placeholder="Size" onChange={(event) => onStyleChange({ fontSize: event.target.value })} />
        <button type="button" className={style.fontWeight === "700" ? "active" : ""} onClick={() => onStyleChange({ fontWeight: style.fontWeight === "700" ? "400" : "700" })}><strong>B</strong></button>
        <button type="button" className={style.fontStyle === "italic" ? "active" : ""} onClick={() => onStyleChange({ fontStyle: style.fontStyle === "italic" ? "normal" : "italic" })}><em>I</em></button>
        <button type="button" className={style.textDecoration === "underline" ? "active" : ""} onClick={() => onStyleChange({ textDecoration: style.textDecoration === "underline" ? "none" : "underline" })}><u>U</u></button>
        {(["left", "center", "right"] as const).map((alignment) => <button type="button" title={`Align ${alignment}`} key={alignment} className={style.textAlign === alignment ? "active" : ""} onClick={() => onStyleChange({ textAlign: alignment })}>{alignment[0].toUpperCase()}</button>)}
      </>}
      {elementKey === "imageUrl" && <><select aria-label="Image crop" value={style.objectFit ?? "cover"} onChange={(event) => onStyleChange({ objectFit: event.target.value as "cover" | "contain" })}><option value="cover">Crop to fill</option><option value="contain">Fit image</option></select></>}
      {isButton && <select aria-label="Button style" value={style.buttonStyle ?? "filled"} onChange={(event) => onStyleChange({ buttonStyle: event.target.value as "filled" | "outline" })}><option value="filled">Filled</option><option value="outline">Outline</option></select>}
      <select aria-label="Animation" value={style.animation ?? "none"} onChange={(event) => onStyleChange({ animation: event.target.value as EditableElementStyle["animation"] })}><option value="none">No animation</option><option value="fade">Fade in</option><option value="slide-up">Slide up</option><option value="slide-left">Slide left</option><option value="slide-right">Slide right</option><option value="scale">Scale in</option><option value="float">Float</option><option value="pulse">Pulse</option></select>
      <select aria-label="Animation speed" value={style.animationSpeed ?? "normal"} onChange={(event) => onStyleChange({ animationSpeed: event.target.value as EditableElementStyle["animationSpeed"] })}><option value="slow">Slow</option><option value="normal">Normal</option><option value="fast">Fast</option></select>
    </div>
    <div className="element-toolbar-row element-toolbar-fields">
      <input value={value} aria-label="Element content" placeholder={elementKey === "imageUrl" ? "Image URL" : "Content"} onChange={(event) => onValueChange(event.target.value)} />
      {(isText || isButton) && <><input className="toolbar-number" value={style.lineHeight ?? ""} aria-label="Line height" placeholder="Line height" onChange={(event) => onStyleChange({ lineHeight: event.target.value })} /><input className="toolbar-number" value={style.letterSpacing ?? ""} aria-label="Letter spacing" placeholder="Spacing" onChange={(event) => onStyleChange({ letterSpacing: event.target.value })} /><input value={link} aria-label="Link URL" placeholder="Link URL (optional)" onChange={(event) => onLinkChange(event.target.value)} /></>}
    </div>
  </div>;
}
