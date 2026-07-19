import type { WebsiteSectionComponentProps } from "@/types/website";
import { EditableImage, EditableText } from "./EditableContent";

export default function CarouselSection(props: WebsiteSectionComponentProps) {
  const content = props.section.props;
  return <section style={{ height: `${props.section.heightVh ?? 100}vh` }} className={`rounded-[28px] p-8 ${props.section.variant === "brutalist" ? "bg-black text-white" : "bg-white text-zinc-900"}`}>
    <p className="text-xs uppercase text-blue-500"><EditableText {...props} elementKey="statLabel">{content.statLabel}</EditableText></p>
    <h2 className="mt-2 text-4xl font-bold"><EditableText {...props} elementKey="title">{content.title}</EditableText></h2>
    <p className="mt-3 opacity-60"><EditableText {...props} elementKey="subtitle">{content.subtitle}</EditableText></p>
    <EditableImage {...props} src={content.imageUrl} alt={content.altText ?? content.title} className="mt-6 h-[420px] w-full rounded-2xl object-cover" />
  </section>;
}
