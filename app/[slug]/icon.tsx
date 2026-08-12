import { ImageResponse } from "next/og";
import { notFound } from "next/navigation";
import { loadPublishedSite } from "@/features/publishing/server/public-site";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default async function PublishedSiteIcon({ params }: { params: Promise<{ slug: string }> }) {
  const data = await loadPublishedSite((await params).slug);
  if (!data) notFound();
  if (data.project.publicationIconUrl) return Response.redirect(data.project.publicationIconUrl, 307);
  const navbar = data.website.sections.find((section) => section.type === "navbar");
  const hero = data.website.sections.find((section) => section.type === "hero");
  const name = data.project.publicationTitle?.trim() || navbar?.props.title.trim() || hero?.props.title.trim() || data.project.name || "Website";
  const mark = name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase().slice(0, 2) || "W";
  const theme = data.website.theme;

  return new ImageResponse(
    <div style={{ width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center",background:theme.primaryColor,color:theme.surfaceColor,border:`4px solid ${theme.accentColor}`,borderRadius:Math.min(theme.borderRadius,16),fontSize:mark.length===1?36:28,fontWeight:800,fontFamily:"Arial, sans-serif",letterSpacing:"-0.06em" }}>{mark}</div>,
    size,
  );
}
