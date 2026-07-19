import type { WebsiteSectionComponentProps } from "@/types/website";
import { getAlignmentClasses } from "@/utils/alignment";
import { EditableImage, EditableText } from "./EditableContent";

export default function HeroBrutalist(props: WebsiteSectionComponentProps) {
  const content = props.section.props;
  const alignment = getAlignmentClasses(content.alignment);
  return <section style={{ height: `${props.section.heightVh ?? 100}vh` }} className="grid bg-black text-white">
    <div className="grid gap-8 p-8 lg:grid-cols-[1.15fr_.85fr]">
      <div className={`flex flex-col justify-center ${alignment.container}`}>
        <p className="mb-4 text-sm uppercase text-yellow-400"><EditableText {...props} elementKey="statLabel">{content.statLabel}</EditableText></p>
        <h1 className="text-5xl font-black uppercase"><EditableText {...props} elementKey="title">{content.title}</EditableText></h1>
        <p className="mt-6 text-lg text-zinc-300"><EditableText {...props} elementKey="subtitle">{content.subtitle}</EditableText></p>
        <div className={`mt-8 flex gap-3 ${alignment.actions}`}>
          {content.buttonText && <button type="button"><EditableText {...props} elementKey="buttonText">{content.buttonText}</EditableText></button>}
          {content.secondaryButtonText && <button type="button"><EditableText {...props} elementKey="secondaryButtonText">{content.secondaryButtonText}</EditableText></button>}
        </div>
      </div>
      <EditableImage {...props} src={content.imageUrl} alt={content.altText ?? content.title} className="h-full min-h-[300px] w-full rounded-2xl object-cover" />
    </div>
  </section>;
}
