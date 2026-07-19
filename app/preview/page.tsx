"use client";

import { useEffect, useState } from "react";
import { initialWebsite } from "@/data/initialWebsite";
import WebsiteRenderer from "@/renderer/WebsiteRenderer";
import type { WebsiteJSON } from "@/types/website";
import { readStoredWebsite } from "@/utils/editorStorage";
import { listImageAssets, resolveWebsiteAssetReferences } from "@/utils/assetStorage";

export default function PreviewPage() {
  const [website, setWebsite] = useState<WebsiteJSON | null>(null);

  useEffect(() => {
    document.documentElement.classList.add("website-preview-document");
    document.body.classList.add("website-preview-document");
    return () => {
      document.documentElement.classList.remove("website-preview-document");
      document.body.classList.remove("website-preview-document");
    };
  }, []);

  useEffect(() => {
    const stored = readStoredWebsite() ?? initialWebsite;
    fetch("/api/profile")
      .then(async (response) => {
        if (response.status === 401) {
          window.location.assign("/login");
          return null;
        }
        return response.ok ? response.json() : null;
      })
      .then((profile) => profile ? listImageAssets(profile.id) : [])
      .then((assets) => setWebsite(resolveWebsiteAssetReferences(stored, assets)))
      .catch(() => setWebsite(stored));
  }, []);

  if (!website) return <main className="min-h-screen bg-white" />;
  return <WebsiteRenderer website={website} renderMode="preview" />;
}
