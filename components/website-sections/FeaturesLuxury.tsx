import type { WebsiteSectionComponentProps } from "@/types/website";
import { EditableText } from "./EditableContent";

export default function FeaturesLuxury(props: WebsiteSectionComponentProps) {
  const content = props.section.props;
  const dark = props.section.variant === "brutalist";
  return <section style={{ height: `${props.section.heightVh ?? 100}vh` }} className={`rounded-[28px] p-8 ${dark ? "bg-zinc-950 text-white" : "bg-white text-zinc-900"}`}>
    <p className="text-sm uppercase tracking-[.3em] text-blue-500"><EditableText {...props} elementKey="statLabel">{content.statLabel}</EditableText></p>
    <div className="mt-3 flex flex-wrap items-end justify-between gap-6">
      <div>
        <h2 className="text-4xl font-black"><EditableText {...props} elementKey="title">{content.title}</EditableText></h2>
        <p className="mt-4 text-lg opacity-70"><EditableText {...props} elementKey="subtitle">{content.subtitle}</EditableText></p>
      </div>
      {content.buttonText && <button type="button"><EditableText {...props} elementKey="buttonText">{content.buttonText}</EditableText></button>}
    </div>
  </section>;
}
