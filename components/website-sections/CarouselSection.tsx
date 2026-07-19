"use client";

import { useEffect, useState } from "react";
import type { WebsiteSectionComponentProps } from "@/types/website";
import { EditableImage, EditableText } from "./EditableContent";

export default function CarouselSection(props: WebsiteSectionComponentProps) {
  const content = props.section.props;
  const images = (content.items ?? []).filter(Boolean);
  const slides = images.length ? images : content.imageUrl ? [content.imageUrl] : [];
  const [index, setIndex] = useState(0);
  useEffect(() => setIndex((current) => Math.min(current, Math.max(0, slides.length - 1))), [slides.length]);
  const move = (amount: number) => setIndex((current) => (current + amount + slides.length) % slides.length);

  return <section style={{ height: `${props.section.heightVh ?? 100}vh` }} className={`site-carousel rounded-[28px] p-8 ${props.section.variant === "brutalist" ? "bg-black text-white" : "bg-white text-zinc-900"}`}>
    <p className="text-xs uppercase text-blue-500"><EditableText {...props} elementKey="statLabel">{content.statLabel}</EditableText></p>
    <h2 className="mt-2 text-4xl font-bold"><EditableText {...props} elementKey="title">{content.title}</EditableText></h2>
    <p className="mt-3 opacity-60"><EditableText {...props} elementKey="subtitle">{content.subtitle}</EditableText></p>
    {slides.length > 0 && <div className="site-carousel-stage">
      <EditableImage {...props} src={slides[index]} alt={`${content.altText ?? content.title} ${index + 1}`} className="h-[420px] w-full rounded-2xl object-cover" />
      {slides.length > 1 && <div className="site-carousel-controls">
        <button type="button" aria-label="Previous image" onClick={(event) => { event.stopPropagation(); move(-1); }}>←</button>
        <div className="site-carousel-index" aria-label="Choose image">{slides.map((_, slideIndex) => <button type="button" key={slideIndex} className={slideIndex === index ? "active" : ""} aria-label={`Image ${slideIndex + 1}`} onClick={(event) => { event.stopPropagation(); setIndex(slideIndex); }}>{slideIndex + 1}</button>)}</div>
        <button type="button" aria-label="Next image" onClick={(event) => { event.stopPropagation(); move(1); }}>→</button>
      </div>}
    </div>}
  </section>;
}
