"use client";

import { useEffect, useRef, useState, type PointerEvent } from "react";
import type { ColorMode } from "@/types/website";
import { isLightStudioTheme, readStoredEditorTheme } from "@/utils/editorStorage";

export default function HttpmakerLoadingScreen({ label = "Building your workspace", delayMs = 3000 }: { label?: string; delayMs?: number }) {
  const [theme, setTheme] = useState<ColorMode>("sky");
  const [visible, setVisible] = useState(false);
  const loaderRef = useRef<HTMLElement>(null);

  useEffect(() => setTheme(readStoredEditorTheme()), []);
  useEffect(() => {
    const timer = window.setTimeout(() => setVisible(true), delayMs);
    return () => window.clearTimeout(timer);
  }, [delayMs]);

  const followPointer = (event: PointerEvent<HTMLElement>) => {
    if (event.pointerType === "touch") return;
    const loader = loaderRef.current;
    if (!loader) return;
    loader.style.setProperty("--loader-pointer-x", `${event.clientX}px`);
    loader.style.setProperty("--loader-pointer-y", `${event.clientY}px`);
    loader.dataset.pointerActive = "true";
  };

  if (!visible) return null;

  return <main
    ref={loaderRef}
    className="httpmaker-loader"
    data-color-theme={theme}
    data-theme={isLightStudioTheme(theme) ? "light" : "dark"}
    role="status"
    aria-live="polite"
    aria-label={label}
    onPointerMove={followPointer}
    onPointerLeave={() => loaderRef.current?.removeAttribute("data-pointer-active")}
  >
    <div className="httpmaker-loader-pointer-glow" aria-hidden="true" />
    <div className="httpmaker-loader-content">
      <div className="httpmaker-loader-logo" aria-label="httpmaker">{"{httpmaker"}</div>
      <h1>{label}</h1>
      <div className="httpmaker-loader-track" aria-hidden="true"><span /></div>
      <p className="httpmaker-loader-status"><span /> Preparing everything</p>
    </div>
  </main>;
}
