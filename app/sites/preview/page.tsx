"use client";

import { useEffect, useState } from "react";
import HttpmakerLoadingScreen from "@/components/HttpmakerLoadingScreen";
import { initialWebsite } from "@/data/initialWebsite";
import PublicWebsiteRenderer from "@/renderer/PublicWebsiteRenderer";
import type { WebsiteJSON } from "@/types/website";
import { readStoredWebsite } from "@/utils/editorStorage";

export default function WebsitePreviewPage() {
  const [website, setWebsite] = useState<WebsiteJSON | null>(null);
  useEffect(() => setWebsite(readStoredWebsite() ?? initialWebsite), []);
  if (!website) return <HttpmakerLoadingScreen label="Rendering your website" />;
  return <PublicWebsiteRenderer website={website} />;
}
