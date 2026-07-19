import type { WebsiteSectionComponentProps } from "@/types/website";
import { getAlignmentClasses } from "@/utils/alignment";
import { EditableImage, EditableText } from "./EditableContent";

export default function HeroLuxury(props: WebsiteSectionComponentProps) {
  const content = props.section.props;
  const alignment = getAlignmentClasses(content.alignment);
  return <section className="grid overflow-hidden rounded-[30px]" style={{ height: `${props.section.heightVh ?? 100}vh`, backgroundColor: props.theme.backgroundColor, color: props.theme.textColor }}>
    <div className="grid gap-10 p-8 lg:grid-cols-[1.15fr_.85fr] lg:p-12">
      <div className={`flex flex-col justify-center ${alignment.container}`}>
        <p className="mb-4 text-sm font-medium uppercase tracking-[.3em] text-blue-600"><EditableText {...props} elementKey="statLabel">{content.statLabel}</EditableText></p>
        <h1 className="max-w-2xl text-5xl font-black leading-[.95] sm:text-6xl"><EditableText {...props} elementKey="title">{content.title}</EditableText></h1>
        <p className="mt-6 max-w-xl text-lg opacity-70"><EditableText {...props} elementKey="subtitle">{content.subtitle}</EditableText></p>
        <div className={`mt-8 flex flex-wrap gap-3 ${alignment.actions}`}>
          {content.buttonText && <button type="button"><EditableText {...props} elementKey="buttonText">{content.buttonText}</EditableText></button>}
          {content.secondaryButtonText && <button type="button"><EditableText {...props} elementKey="secondaryButtonText">{content.secondaryButtonText}</EditableText></button>}
        </div>
        <strong className="mt-10 text-2xl"><EditableText {...props} elementKey="statValue">{content.statValue}</EditableText></strong>
      </div>
      <div className="flex items-end">
        <EditableImage {...props} src={content.imageUrl} alt={content.altText ?? content.title} className="h-full min-h-[360px] w-full rounded-[24px] object-cover shadow-2xl" />
      </div>
    </div>
  </section>;
}
