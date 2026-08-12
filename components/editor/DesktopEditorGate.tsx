"use client";

import { useEffect, useState, type ReactNode } from "react";
import type { ColorMode } from "@/types/website";
import { isLightStudioTheme, readStoredEditorTheme } from "@/utils/editorStorage";

const isDesktopDevice = () => {
  const navigatorWithData = navigator as Navigator & { userAgentData?: { mobile?: boolean } };
  const mobileOrTablet = navigatorWithData.userAgentData?.mobile === true
    || /Android|iPhone|iPad|iPod|Mobile|Tablet/i.test(navigator.userAgent)
    || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

  return !mobileOrTablet && window.innerWidth >= 1024;
};

export default function DesktopEditorGate({ children }: { children: ReactNode }) {
  const [deviceAllowed, setDeviceAllowed] = useState<boolean | null>(null);
  const [colorMode, setColorMode] = useState<ColorMode>("sky");

  useEffect(() => {
    setColorMode(readStoredEditorTheme());
    const updateDeviceAccess = () => setDeviceAllowed(isDesktopDevice());
    updateDeviceAccess();
    window.addEventListener("resize", updateDeviceAccess);
    return () => window.removeEventListener("resize", updateDeviceAccess);
  }, []);

  if (deviceAllowed === null) return null;
  if (deviceAllowed) return children;

  return (
    <main
      className="desktop-editor-gate"
      data-theme={isLightStudioTheme(colorMode) ? "light" : "dark"}
      data-color-theme={colorMode}
    >
      <div className="desktop-editor-gate-grid" aria-hidden="true" />
      <a className="desktop-editor-gate-brand" href="/dashboard" aria-label="HTTPMAKER dashboard">
        <span>{"{"}</span>HTTPMAKER
      </a>
      <section className="desktop-editor-gate-card">
        <div className="desktop-editor-gate-device" aria-hidden="true">
          <span className="desktop-editor-gate-screen"><i /><i /><i /></span>
          <span className="desktop-editor-gate-stand" />
        </div>
        <p className="desktop-editor-gate-kicker">DESKTOP WORKSPACE</p>
        <h1>Your ideas need a little more room.</h1>
        <p className="desktop-editor-gate-copy">
          The HTTPMAKER editor is built for a desktop screen. Open this project on a computer to design, preview, and publish your website.
        </p>
        <a className="desktop-editor-gate-action" href="/dashboard">Back to dashboard <span>→</span></a>
        <p className="desktop-editor-gate-note"><span /> Your work is safe and waiting for you.</p>
      </section>
    </main>
  );
}
