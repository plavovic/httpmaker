import type { Alignment } from "@/types/website";

export function getAlignmentClasses(alignment: Alignment) {
  switch (alignment) {
    case "center":
      return { container: "items-center text-center", actions: "justify-center" };
    case "right":
      return { container: "items-end text-right", actions: "justify-end" };
    default:
      return { container: "items-start text-left", actions: "justify-start" };
  }
}
