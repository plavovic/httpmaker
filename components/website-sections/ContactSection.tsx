import type { WebsiteSectionComponentProps } from "@/types/website";
import { extractGoogleMapsEmbedUrl } from "@/utils/googleMaps";
import { EditableFormField, EditableText } from "./EditableContent";

export default function ContactSection(props: WebsiteSectionComponentProps) {
  const content = props.section.props;
  const fields = content.formFields ?? [];
  const mapUrl = extractGoogleMapsEmbedUrl(content.mapEmbedUrl ?? "");

  return <section style={{ height: `${props.section.heightVh ?? 100}vh` }} className={`site-contact-section rounded-[28px] p-8 ${props.section.variant === "brutalist" ? "bg-zinc-950 text-white" : "bg-white text-zinc-900"}`}>
    <div className="site-contact-copy">
      <p className="text-xs uppercase text-blue-500"><EditableText {...props} elementKey="statLabel">{content.statLabel}</EditableText></p>
      <h2 className="mt-3 text-4xl font-bold"><EditableText {...props} elementKey="title">{content.title}</EditableText></h2>
      <p className="mt-4 opacity-70"><EditableText {...props} elementKey="subtitle">{content.subtitle}</EditableText></p>
    </div>
    {fields.length > 0 && <form className="site-contact-form" onSubmit={(event) => event.preventDefault()}>
      {fields.map((field) => <EditableFormField key={field.id} {...props} field={field} />)}
      {content.buttonText && <button type="submit"><EditableText {...props} elementKey="buttonText">{content.buttonText}</EditableText></button>}
    </form>}
    {fields.length === 0 && content.buttonText && <button type="button" className="mt-8"><EditableText {...props} elementKey="buttonText">{content.buttonText}</EditableText></button>}
    {mapUrl && <div className="site-map-view"><iframe src={mapUrl} title={content.title || "Map"} loading="lazy" referrerPolicy="no-referrer-when-downgrade" /></div>}
  </section>;
}
