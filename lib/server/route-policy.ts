import "server-only";

export const PUBLIC_PAGE_PATTERNS = ["/", "/login", "/[slug]", "/[slug]/icon", "/sites/[slug]"] as const;
export const PRIVATE_PAGE_PREFIXES = ["/dashboard", "/editor", "/preview"] as const;
export const PUBLIC_API_PATTERNS = ["/api/auth/**", "/api/github/webhook"] as const;
export const PRIVATE_API_PREFIXES = ["/api/profile", "/api/projects", "/api/assets", "/api/ai", "/api/maps", "/api/github/installations", "/api/sessions"] as const;

export function safeCallbackPath(value: string | null | undefined) {
  if (!value) return "/dashboard";
  let decoded: string;
  try { decoded = decodeURIComponent(value); } catch { return "/dashboard"; }
  if (!decoded.startsWith("/") || decoded.startsWith("//") || decoded.includes("\\") || /[\u0000-\u001f\u007f]/.test(decoded)) return "/dashboard";
  return decoded;
}
