"use client";

import { useRef, type PointerEvent } from "react";

type Props = {
  sectionId: string;
  heightVh: number;
  onCommit: (heightVh: number) => void;
};

const clamp = (value: number) => Math.max(25, Math.min(100, value));

export default function SectionHeightHandle({ sectionId, heightVh, onCommit }: Props) {
  const handleRef = useRef<HTMLButtonElement>(null);

  const startResize = (event: PointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const handle = handleRef.current;
    const section = handle?.closest<HTMLElement>(".site-section");
    if (!handle || !section) return;
    const viewportHeight = Math.max(1, window.innerHeight);
    const startY = event.clientY;
    let nextHeight = heightVh;
    handle.setPointerCapture(event.pointerId);

    const move = (moveEvent: globalThis.PointerEvent) => {
      nextHeight = clamp(heightVh + ((moveEvent.clientY - startY) / viewportHeight) * 100);
      section.style.setProperty("--section-height", `${nextHeight}vh`);
      handle.querySelector("output")!.textContent = `${Math.round(nextHeight)}vh`;
    };
    const finish = () => {
      handle.removeEventListener("pointermove", move);
      handle.removeEventListener("pointerup", finish);
      handle.removeEventListener("pointercancel", finish);
      onCommit(Math.round(nextHeight));
    };
    handle.addEventListener("pointermove", move);
    handle.addEventListener("pointerup", finish);
    handle.addEventListener("pointercancel", finish);
  };

  return <button ref={handleRef} type="button" className="section-height-handle" aria-label={`Resize section ${sectionId}`} onPointerDown={startResize} onClick={(event) => event.stopPropagation()}>
    <span /><output>{Math.round(heightVh)}vh</output>
  </button>;
}
