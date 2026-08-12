"use client";

import { useEffect } from "react";
import WebsiteRenderer from "@/renderer/WebsiteRenderer";
import type { WebsiteJSON } from "@/types/website";

export default function PublicWebsiteRenderer({ website }: { website: WebsiteJSON }) {
  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    const previousRootBackground = root.style.backgroundColor;
    const previousBackground = body.style.backgroundColor;
    const previousColor = body.style.color;

    root.classList.add("website-preview-document");
    body.classList.add("website-preview-document");
    root.style.backgroundColor = website.theme.backgroundColor;
    body.style.backgroundColor = website.theme.backgroundColor;
    body.style.color = website.theme.textColor;

    return () => {
      root.classList.remove("website-preview-document");
      body.classList.remove("website-preview-document");
      root.style.backgroundColor = previousRootBackground;
      body.style.backgroundColor = previousBackground;
      body.style.color = previousColor;
    };
  }, [website.theme.backgroundColor, website.theme.textColor]);

  return <div className="public-site-document" style={{ minHeight: "100vh", width: "100%", margin: 0, backgroundColor: website.theme.backgroundColor, color: website.theme.textColor }}><WebsiteRenderer website={website} renderMode="preview" /></div>;
}
