import type { WebsiteSectionComponentProps } from "@/types/website";
import { EditableImage, EditableText } from "./EditableContent";

export default function AboutSection(props: WebsiteSectionComponentProps) {
  const dark = props.section.variant === "brutalist";
  const content = props.section.props;
  return <section style={{ height: `${props.section.heightVh ?? 100}vh` }} className={`grid gap-8 rounded-[28px] p-8 lg:grid-cols-[.9fr_1.1fr] ${dark ? "bg-zinc-950 text-white" : "bg-white text-zinc-900"}`}>
    <EditableImage {...props} src={content.imageUrl} alt={content.altText ?? content.title} className="h-full min-h-72 w-full rounded-2xl object-cover" />
    <div className="flex flex-col justify-center">
      <p className="text-xs font-bold uppercase tracking-[.25em] text-blue-500"><EditableText {...props} elementKey="statLabel">{content.statLabel}</EditableText></p>
      <h2 className="mt-3 text-4xl font-bold"><EditableText {...props} elementKey="title">{content.title}</EditableText></h2>
      <p className="mt-4 text-lg opacity-70"><EditableText {...props} elementKey="subtitle">{content.subtitle}</EditableText></p>
      <div className="mt-8 flex flex-wrap items-center gap-3">
        <strong className="text-2xl"><EditableText {...props} elementKey="statValue">{content.statValue}</EditableText></strong>
        {content.buttonText && <button type="button"><EditableText {...props} elementKey="buttonText">{content.buttonText}</EditableText></button>}
      </div>
    </div>
  </section>;
}
