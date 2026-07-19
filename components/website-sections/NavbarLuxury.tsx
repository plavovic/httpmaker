import type { WebsiteSectionComponentProps } from "@/types/website";
import ResponsiveNavbar from "./ResponsiveNavbar";

export default function NavbarLuxury(props: WebsiteSectionComponentProps) {
  return <ResponsiveNavbar {...props} variant="luxury" />;
}
