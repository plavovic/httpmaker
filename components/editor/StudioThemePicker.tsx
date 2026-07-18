"use client";

import { useRef } from "react";

import type { ColorMode } from "@/types/website";
import { STUDIO_THEMES } from "@/utils/editorStorage";

import styles from "./StudioThemePicker.module.css";

const PALETTES: Record<ColorMode, { base: string; surface: string; accent: string }> = {
  sky: { base: "#eaf5fc", surface: "#f8fcff", accent: "#69aeda" },
  matcha: { base: "#edf6ec", surface: "#fbfef9", accent: "#79ad78" },
  iris: { base: "#f1edfa", surface: "#fdfbff", accent: "#a084d1" },
  midnight: { base: "#0b1420", surface: "#182a3d", accent: "#68aeda" },
  macao: { base: "#0d1712", surface: "#1b3023", accent: "#70b67c" },
  vice: { base: "#15101e", surface: "#2d213d", accent: "#ae82d7" },
};

function AppearanceIcon({ dark }: { dark: boolean }) {
  return dark ? (
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.3 15.3A8.5 8.5 0 0 1 8.7 3.7 8.5 8.5 0 1 0 20.3 15.3Z" /></svg>
  ) : (
    <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3.5" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>
  );
}

export default function StudioThemePicker({ value, onChange }: { value: ColorMode; onChange: (theme: ColorMode) => void }) {
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const active = STUDIO_THEMES.find((theme) => theme.value === value) ?? STUDIO_THEMES[0];
  const activePalette = PALETTES[active.value];

  return <details ref={detailsRef} className={styles.picker}>
    <summary aria-label={`Studio theme: ${active.label}`}>
      <span className={styles.icon} style={{ color: activePalette.accent }}><AppearanceIcon dark={active.appearance === "dark"} /></span>
      <span>{active.label}</span><i aria-hidden="true" />
    </summary>
    <div className={styles.menu} role="menu" aria-label="Studio themes">
      <div className={styles.heading}>Choose appearance</div>
      <div className={styles.options}>
        {STUDIO_THEMES.map((theme) => {
          const palette = PALETTES[theme.value];
          return <button key={theme.value} type="button" role="menuitemradio" aria-checked={theme.value === value} className={theme.value === value ? styles.selected : ""} onClick={() => { onChange(theme.value); detailsRef.current?.removeAttribute("open"); }} style={{ "--theme-base": palette.base, "--theme-surface": palette.surface, "--theme-accent": palette.accent } as React.CSSProperties}>
            <span className={styles.preview}><span /><span /><AppearanceIcon dark={theme.appearance === "dark"} /></span>
            <span className={styles.label}><strong>{theme.label}</strong><small>{theme.appearance === "dark" ? "Dark" : "Light"}</small></span>
            <span className={styles.check}>✓</span>
          </button>;
        })}
      </div>
    </div>
  </details>;
}
