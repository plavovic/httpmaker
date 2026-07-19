import JSZip from "jszip";

import type { WebsiteJSON, WebsiteSection } from "@/types/website";

const escapeHtml = (value: string) => value.replace(
  /[&<>"']/g,
  (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[character] ?? character,
);

const extension = (mime: string) => mime === "image/jpeg" ? "jpg" : mime === "image/png" ? "png" : mime === "image/gif" ? "gif" : "webp";

function imageMarkup(source: string, alt: string, section: WebsiteSection) {
  if (!source) return "";
  const style = section.elementStyles?.imageUrl;
  return `<img src="${escapeHtml(source)}" alt="${escapeHtml(alt)}" class="section-image" style="width:${style?.widthPercent ?? 100}%;object-fit:${style?.objectFit ?? "cover"}" loading="lazy">`;
}

function sectionMarkup(section: WebsiteSection) {
  const properties = section.props;
  const height = ` style="height:${section.heightVh ?? 100}vh;overflow:auto"`;
  const image = imageMarkup(properties.imageUrl, properties.altText ?? properties.title, section);
  const actions = `<div class="actions"><a href="#">${escapeHtml(properties.buttonText)}</a>${properties.secondaryButtonText ? `<a class="secondary" href="#">${escapeHtml(properties.secondaryButtonText)}</a>` : ""}</div>`;
  if (section.type === "navbar") {
    const appearance = section.navbarAppearance ?? "colored";
    const behavior = section.navbarScrollBehavior ?? "sticky";
    const color = appearance === "colored" && section.backgroundColor ? ` style="--navbar-color:${escapeHtml(section.backgroundColor)}"` : "";
    return `<nav class="site-navbar ${section.variant} navbar-${appearance}" data-scroll-behavior="${behavior}"${color}><div class="navbar-brand"><small>${escapeHtml(properties.subtitle)}</small><strong>${escapeHtml(properties.title)}</strong></div><button class="navbar-burger" type="button" aria-label="Toggle navigation menu" aria-expanded="false"><span></span><span></span><span></span></button><div class="navbar-actions"><a href="#">${escapeHtml(properties.buttonText)}</a>${properties.secondaryButtonText ? `<a class="secondary" href="#">${escapeHtml(properties.secondaryButtonText)}</a>` : ""}</div></nav>`;
  }
  if (section.type === "footer") return `<footer class="section ${section.variant}"${height}><div><small>${escapeHtml(properties.statLabel)}</small><h2>${escapeHtml(properties.title)}</h2><p>${escapeHtml(properties.subtitle)}</p></div>${actions}</footer>`;
  return `<section class="section ${section.variant} type-${section.type}"${height}><div class="copy"><small>${escapeHtml(properties.statLabel)}</small><h${section.type === "hero" ? "1" : "2"}>${escapeHtml(properties.title)}</h${section.type === "hero" ? "1" : "2"}><p>${escapeHtml(properties.subtitle)}</p>${actions}</div>${image}</section>`;
}

function stylesheet(website: WebsiteJSON) {
  const theme = website.theme;
  return `*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:${theme.backgroundColor};color:${theme.textColor};font-family:${JSON.stringify(theme.bodyFont)},sans-serif}main{width:min(1200px,100%);margin:auto;padding:clamp(12px,3vw,36px)}.section{display:grid;grid-template-columns:minmax(0,1.1fr) minmax(0,.9fr);gap:clamp(24px,5vw,64px);align-items:center;margin:0;padding:clamp(32px,7vw,90px);border-radius:${theme.borderRadius}px;background:${theme.surfaceColor};overflow:hidden}.section+ .section{margin-top:18px}.section.brutalist{border:3px solid ${theme.textColor};border-radius:0;box-shadow:8px 8px 0 ${theme.primaryColor}}footer.section{grid-template-columns:1fr auto;padding:24px clamp(24px,5vw,60px)}h1,h2{max-width:18ch;margin:.2em 0;font-family:${JSON.stringify(theme.headingFont)},serif;line-height:.98;overflow-wrap:anywhere}h1{font-size:clamp(2.5rem,8vw,7rem)}h2{font-size:clamp(2rem,5vw,4.5rem)}p{max-width:60ch;color:${theme.mutedTextColor};font-size:clamp(1rem,2vw,1.25rem);line-height:1.65}.section-image{display:block;max-width:100%;height:auto;max-height:650px;margin-inline:auto;border-radius:${theme.borderRadius}px}.actions,.navbar-actions{display:flex;flex-wrap:wrap;gap:10px}.actions{margin-top:28px}.actions a,.navbar-actions a{display:inline-block;border:1px solid ${theme.primaryColor};border-radius:${theme.borderRadius}px;padding:12px 18px;background:${theme.primaryColor};color:${theme.backgroundColor};text-decoration:none}.actions a.secondary,.navbar-actions a.secondary{background:transparent;color:${theme.textColor}}small{color:${theme.accentColor};font-weight:700;letter-spacing:.12em;text-transform:uppercase}.site-navbar{position:relative;z-index:50;display:flex;align-items:center;justify-content:space-between;gap:24px;width:100%;padding:16px clamp(20px,5vw,60px);color:${theme.textColor};transition:background-color .25s ease}.site-navbar[data-scroll-behavior="sticky"]{position:sticky;top:0}.site-navbar.navbar-transparent{background:transparent}.site-navbar.navbar-glass{border-bottom:1px solid color-mix(in srgb,${theme.textColor} 15%,transparent);background:color-mix(in srgb,${theme.surfaceColor} 68%,transparent);backdrop-filter:blur(18px) saturate(150%);-webkit-backdrop-filter:blur(18px) saturate(150%);box-shadow:0 8px 32px rgba(0,0,0,.08)}.site-navbar.navbar-colored{background:var(--navbar-color,${theme.surfaceColor})}.navbar-brand{display:grid;gap:3px}.navbar-brand strong{font-family:${JSON.stringify(theme.headingFont)},serif;font-size:1.25rem}.navbar-burger{display:none;width:44px;height:40px;border:1px solid currentColor;border-radius:${theme.borderRadius}px;padding:8px;background:transparent;color:inherit}.navbar-burger span{display:block;height:2px;margin:4px;background:currentColor}@media(max-width:850px){main{padding:0}.section{grid-template-columns:1fr;border-radius:0;padding:36px 20px}.section-image{grid-row:1}footer.section{grid-template-columns:1fr}.section+.section{margin-top:0}.site-navbar{flex-wrap:wrap}.navbar-burger{display:block}.navbar-actions{display:none;flex-basis:100%;flex-direction:column}.navbar-actions.open{display:flex}.navbar-actions a{text-align:center}}`;
}

const navbarScript = `<script>(()=>{const nav=document.querySelector('.site-navbar');if(!nav)return;const burger=nav.querySelector('.navbar-burger');const actions=nav.querySelector('.navbar-actions');burger?.addEventListener('click',()=>{const open=actions?.classList.toggle('open')??false;burger.setAttribute('aria-expanded',String(open))});actions?.addEventListener('click',()=>{actions.classList.remove('open');burger?.setAttribute('aria-expanded','false')})})()</script>`;

export type WebsiteExportFiles = {
  "index.html": string;
  "styles.css": string;
  "website.json": string;
  "README.md": string;
};

export function buildWebsiteFiles(website: WebsiteJSON): WebsiteExportFiles {
  const title = website.sections.find((section) => section.type === "hero")?.props.title ?? "Website";
  const description = website.sections.find((section) => section.type === "hero")?.props.subtitle ?? "Exported website";
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="${escapeHtml(description)}"><title>${escapeHtml(title)}</title><link rel="stylesheet" href="styles.css"></head><body><main>${website.sections.map(sectionMarkup).join("")}</main>${website.sections.some((section) => section.type === "navbar") ? navbarScript : ""}</body></html>`;

  return {
    "index.html": html,
    "styles.css": stylesheet(website),
    "website.json": JSON.stringify(website, null, 2),
    "README.md": "# HTTPMAKER website\n\nOpen `index.html` in a browser or deploy these files to any static host. No HTTPMAKER editor or AI code is included.\n",
  };
}

export async function buildWebsiteZip(website: WebsiteJSON): Promise<Uint8Array> {
  const zip = new JSZip();
  let imageIndex = 0;
  const sources = new Map<string, string>();

  for (const section of website.sections) {
    for (const source of [section.props.imageUrl, ...(section.props.items ?? [])]) {
      if (!source.startsWith("data:image/") || sources.has(source)) continue;
      const match = source.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
      if (!match) continue;
      const path = `assets/image-${++imageIndex}.${extension(match[1])}`;
      zip.file(path, match[2], { base64: true });
      sources.set(source, path);
    }
  }

  const portable: WebsiteJSON = {
    ...website,
    sections: website.sections.map((section) => ({
      ...section,
      props: {
        ...section.props,
        imageUrl: sources.get(section.props.imageUrl) ?? section.props.imageUrl,
        items: section.props.items?.map((item) => sources.get(item) ?? item),
      },
    })),
  };
  const files = buildWebsiteFiles(portable);
  for (const [path, contents] of Object.entries(files)) zip.file(path, contents);

  return zip.generateAsync({ type: "uint8array", compression: "DEFLATE", compressionOptions: { level: 6 } });
}

export async function exportWebsiteZip(website: WebsiteJSON) {
  const bytes = await buildWebsiteZip(website);
  const blob = new Blob([bytes.buffer as ArrayBuffer], { type: "application/zip" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "httpmaker-website.zip";
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
