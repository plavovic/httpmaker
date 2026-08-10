export function findLegacyAssetReferences(value: unknown): string[] {
  const references = new Set<string>();
  const visit = (item: unknown) => {
    if (typeof item === "string" && item.startsWith("asset://")) references.add(item);
    else if (Array.isArray(item)) item.forEach(visit);
    else if (item && typeof item === "object") Object.values(item).forEach(visit);
  };
  visit(value);
  return [...references].sort();
}
