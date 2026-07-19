import type { WebsiteTheme } from "@/types/website";

const fonts = [
  { label: "Geist", value: "Geist, Inter, sans-serif" },
  { label: "Inter", value: "Inter, Arial, sans-serif" },
  { label: "Modern system", value: "ui-sans-serif, system-ui, sans-serif" },
  { label: "Avenir style", value: "Avenir Next, Avenir, Helvetica Neue, sans-serif" },
  { label: "Helvetica", value: "Helvetica Neue, Helvetica, Arial, sans-serif" },
  { label: "Humanist", value: "Trebuchet MS, Lucida Sans Unicode, sans-serif" },
  { label: "Editorial serif", value: "Iowan Old Style, Baskerville, Times New Roman, serif" },
  { label: "Classic serif", value: "Georgia, Times New Roman, serif" },
  { label: "Modern serif", value: "Didot, Bodoni MT, Times New Roman, serif" },
  { label: "Rounded", value: "Arial Rounded MT Bold, ui-rounded, sans-serif" },
  { label: "Monospace", value: "SFMono-Regular, Consolas, Liberation Mono, monospace" },
];

function options(current: string) {
  const known = fonts.some((font) => font.value === current);
  return <>{!known && <option value={current}>{current}</option>}{fonts.map((font) => <option key={font.label} value={font.value}>{font.label}</option>)}</>;
}

export default function ThemeTypographyControl({ theme, onChange }: { theme: WebsiteTheme; onChange: (patch: Partial<WebsiteTheme>) => void }) {
  return <div className="theme-grid">
    <label>Heading font<select value={theme.headingFont} onChange={(event) => onChange({ headingFont: event.target.value })}>{options(theme.headingFont)}</select></label>
    <label>Body font<select value={theme.bodyFont} onChange={(event) => onChange({ bodyFont: event.target.value })}>{options(theme.bodyFont)}</select></label>
  </div>;
}
