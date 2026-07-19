import type { WebsiteSectionComponentProps } from "@/types/website";
import { getAlignmentClasses } from "@/utils/alignment";
import { EditableText } from "./EditableContent";

export default function FooterLuxury(props: WebsiteSectionComponentProps) {
  const content = props.section.props;
  const alignment = getAlignmentClasses(content.alignment);
  return <footer style={{ height: `${props.section.heightVh ?? 100}vh` }} className="bg-zinc-900 px-8 py-10 text-white">
    <div className={`flex h-full flex-col justify-center gap-6 lg:flex-row lg:items-center lg:justify-between ${alignment.container}`}>
      <div>
        <p className="text-sm uppercase tracking-[.3em] text-white/60"><EditableText {...props} elementKey="statLabel">{content.statLabel}</EditableText></p>
        <h3 className="mt-2 text-3xl font-semibold"><EditableText {...props} elementKey="title">{content.title}</EditableText></h3>
        <p className="mt-3 max-w-xl text-white/70"><EditableText {...props} elementKey="subtitle">{content.subtitle}</EditableText></p>
      </div>
      <div className={`flex gap-3 ${alignment.actions}`}>
        {content.buttonText && <button type="button"><EditableText {...props} elementKey="buttonText">{content.buttonText}</EditableText></button>}
        {content.secondaryButtonText && <button type="button"><EditableText {...props} elementKey="secondaryButtonText">{content.secondaryButtonText}</EditableText></button>}
      </div>
    </div>
  </footer>;
}
