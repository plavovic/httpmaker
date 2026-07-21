export function extractGoogleMapsEmbedUrl(value: string): string {
  const sourceMatch = value.match(/\bsrc\s*=\s*["']([^"']+)["']/i);
  const candidate = (sourceMatch?.[1] ?? value).trim().replaceAll("&amp;", "&");
  if (!candidate) return "";
  try {
    const url = new URL(candidate);
    // Google serves Maps embeds from localized domains too (for example google.pl).
    const googleHost = /^(?:[a-z0-9-]+\.)*google\.(?:com|[a-z]{2,3}|(?:com|co)\.[a-z]{2})$/i.test(url.hostname);
    if (url.protocol !== "https:" || !googleHost) return "";
    if (url.pathname.includes("/maps/embed")) return url.toString();
    // Google also supplies Maps URLs with output=embed instead of an /embed path.
    if (url.pathname.includes("/maps") && url.searchParams.get("output") === "embed") return url.toString();
    return "";
  } catch {
    return "";
  }
}

export function isGoogleMapsShortUrl(value: string): boolean {
  try { const url=new URL(value.trim());return url.protocol==="https:"&&url.hostname==="maps.app.goo.gl"&&url.pathname.length>1 } catch { return false }
}

export function createGoogleMapsEmbedUrl(value:string):string {
  const direct=extractGoogleMapsEmbedUrl(value);if(direct)return direct;
  try {
    const url=new URL(value);const googleHost=/^(?:[a-z0-9-]+\.)*google\.(?:com|[a-z]{2,3}|(?:com|co)\.[a-z]{2})$/i.test(url.hostname);if(url.protocol!=="https:"||!googleHost||!url.pathname.includes("/maps"))return "";
    const coordinates=url.pathname.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/)??url.href.match(/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/);
    const place=url.pathname.match(/\/maps\/place\/([^/]+)/)?.[1];const query=url.searchParams.get("q")??url.searchParams.get("query")??(coordinates?`${coordinates[1]},${coordinates[2]}`:place?decodeURIComponent(place.replaceAll("+"," ")):"");
    if(!query)return "";const embed=new URL("https://www.google.com/maps");embed.searchParams.set("q",query);embed.searchParams.set("output","embed");return embed.toString();
  } catch { return "" }
}
