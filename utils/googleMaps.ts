export function extractGoogleMapsEmbedUrl(value: string): string {
  const sourceMatch = value.match(/\bsrc\s*=\s*["']([^"']+)["']/i);
  const candidate = (sourceMatch?.[1] ?? value).trim().replaceAll("&amp;", "&");
  if (!candidate) return "";
  try {
    const url = new URL(candidate);
    const googleHost = url.hostname === "google.com" || url.hostname.endsWith(".google.com");
    return url.protocol === "https:" && googleHost && url.pathname.includes("/maps/embed") ? url.toString() : "";
  } catch {
    return "";
  }
}
