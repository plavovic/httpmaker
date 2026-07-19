import type { WebsiteSectionComponentProps } from "@/types/website";
import { EditableText } from "./EditableContent";

export default function ContactSection(props: WebsiteSectionComponentProps) {
  const content = props.section.props;
  return <section style={{ height: `${props.section.heightVh ?? 100}vh` }} className={`rounded-[28px] p-8 ${props.section.variant === "brutalist" ? "bg-zinc-950 text-white" : "bg-white text-zinc-900"}`}>
    <p className="text-xs uppercase text-blue-500"><EditableText {...props} elementKey="statLabel">{content.statLabel}</EditableText></p>
    <h2 className="mt-3 text-4xl font-bold"><EditableText {...props} elementKey="title">{content.title}</EditableText></h2>
    <p className="mt-4 opacity-70"><EditableText {...props} elementKey="subtitle">{content.subtitle}</EditableText></p>
    {content.buttonText && <button type="button" className="mt-8"><EditableText {...props} elementKey="buttonText">{content.buttonText}</EditableText></button>}
  </section>;
}
