import { RequestBodyTooLargeError } from "@/lib/server/request";

export function mapResolverInputErrorStatus(error: unknown): 400 | 413 | null {
  if (error instanceof RequestBodyTooLargeError) return 413;
  if (error instanceof SyntaxError) return 400;
  return null;
}
