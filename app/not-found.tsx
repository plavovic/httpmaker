"use client";

import { useEffect, useState } from "react";
import type { ColorMode } from "@/types/website";
import { isLightStudioTheme, readStoredEditorTheme } from "@/utils/editorStorage";

export default function NotFound() {
  const [colorMode, setColorMode] = useState<ColorMode>("sky");

  useEffect(() => {
    setColorMode(readStoredEditorTheme());
  }, []);

  return (
    <main className="httpmaker-not-found" data-theme={isLightStudioTheme(colorMode) ? "light" : "dark"} data-color-theme={colorMode}>
      <div className="httpmaker-not-found-grid" aria-hidden="true" />
      <a className="httpmaker-not-found-brand" href="/" aria-label="HTTPMAKER home"><span>{"{"}</span>HTTPMAKER</a>
      <section className="httpmaker-not-found-content">
        <div className="httpmaker-not-found-code" aria-label="Error 404"><span>4</span><i aria-hidden="true"><b /></i><span>4</span></div>
        <p className="httpmaker-not-found-kicker">PAGE_NOT_FOUND</p>
        <h1>This page never made it to production.</h1>
        <p className="httpmaker-not-found-copy">The address may be incorrect, or the page may have moved somewhere new.</p>
        <a className="httpmaker-not-found-action" href="/">Return home <span aria-hidden="true">→</span></a>
        <p className="httpmaker-not-found-status"><span /> HTTP 404 · Nothing is broken</p>
      </section>
    </main>
  );
}
