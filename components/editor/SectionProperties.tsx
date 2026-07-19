import type { Alignment, EditableElementStyle, NavbarAppearance, NavbarScrollBehavior, WebsiteSection, WebsiteSectionProps } from "@/types/website";

type ButtonKey = "buttonText" | "secondaryButtonText";
type Props = {
  sections: WebsiteSection[];
  selectedSection: WebsiteSection;
  defaultBackgroundColor: string;
  onSelectSection: (sectionId: string) => void;
  onUpdateProp: (key: keyof WebsiteSectionProps, value: string) => void;
  onUpdateBackgroundColor: (value: string | undefined) => void;
  onChooseBackgroundImage: () => void;
  onUpdateBackgroundImage: (patch: { backgroundImageUrl?: string; backgroundImageFit?: "cover" | "contain" }) => void;
  onUpdateButtonStyle: (key: ButtonKey, patch: Partial<EditableElementStyle>) => void;
  onUpdateButtonLink: (key: ButtonKey, value: string) => void;
  onUpdateNavbar: (patch: { navbarAppearance?: NavbarAppearance; navbarScrollBehavior?: NavbarScrollBehavior }) => void;
};

const fields: { label: string; key: "title" | "subtitle" | "imageUrl" }[] = [{ label: "Title", key: "title" }, { label: "Subtitle", key: "subtitle" }, { label: "Image URL", key: "imageUrl" }];
const colorValue = (value: string | undefined, fallback: string) => /^#[\da-f]{6}$/i.test(value ?? "") ? value! : fallback;

export default function SectionProperties(p: Props) {
  const section = p.selectedSection;
  const backgroundColor = section.backgroundColor ?? p.defaultBackgroundColor;
  const addButton = (key: ButtonKey, fallback: string) => p.onUpdateProp(key, section.props[key].trim() || fallback);

  return <div className="section-properties">
    <div className="section-properties-heading"><span>Selected section</span><h2>Section & actions</h2></div>
    <label>Section<select value={section.id} onChange={(event) => p.onSelectSection(event.target.value)}>{p.sections.map((item) => <option key={item.id} value={item.id}>{item.type} · {item.variant}</option>)}</select></label>

    {section.type === "navbar" && <fieldset><legend>Navbar behavior</legend>
      <label>Appearance<select value={section.navbarAppearance ?? "colored"} onChange={(event) => p.onUpdateNavbar({ navbarAppearance: event.target.value as NavbarAppearance })}><option value="transparent">Transparent</option><option value="glass">Glass effect</option><option value="colored">Colored</option></select></label>
      <label>While scrolling<select value={section.navbarScrollBehavior ?? "sticky"} onChange={(event) => p.onUpdateNavbar({ navbarScrollBehavior: event.target.value as NavbarScrollBehavior })}><option value="sticky">Always visible on top</option><option value="hide-on-scroll">Scroll away with the page</option></select></label>
      <small>The colored option uses the section background color below.</small>
    </fieldset>}

    <fieldset><legend>Section background</legend>
      <label>Color<div className="property-inline"><input type="color" value={colorValue(backgroundColor, "#ffffff")} onChange={(event) => p.onUpdateBackgroundColor(event.target.value)} /><input value={backgroundColor} onChange={(event) => p.onUpdateBackgroundColor(event.target.value)} /><button type="button" onClick={() => p.onUpdateBackgroundColor(undefined)}>Reset</button></div></label>
      <div className="property-inline"><button type="button" onClick={p.onChooseBackgroundImage}>{section.backgroundImageUrl ? "Replace background image" : "Choose background image"}</button>{section.backgroundImageUrl && <button type="button" onClick={() => p.onUpdateBackgroundImage({ backgroundImageUrl: "" })}>Remove image</button>}</div>
      {section.backgroundImageUrl && <label>Image fit<select value={section.backgroundImageFit ?? "cover"} onChange={(event) => p.onUpdateBackgroundImage({ backgroundImageFit: event.target.value as "cover" | "contain" })}><option value="cover">Cover section</option><option value="contain">Fit inside section</option></select></label>}
    </fieldset>

    <fieldset><legend>Content</legend>{fields.map((field) => <label key={field.key}>{field.label}<input value={section.props[field.key]} onChange={(event) => p.onUpdateProp(field.key, event.target.value)} /></label>)}<label>Alignment<div className="property-segments">{(["left", "center", "right"] as Alignment[]).map((value) => <button type="button" key={value} className={section.props.alignment === value ? "selected" : ""} onClick={() => p.onUpdateProp("alignment", value)}>{value}</button>)}</div></label></fieldset>

    {(["buttonText", "secondaryButtonText"] as ButtonKey[]).map((key, index) => {
      const style = section.elementStyles?.[key] ?? {};
      const link = section.elementLinks?.[key] ?? "";
      return <fieldset key={key}><legend>{index ? "Secondary button" : "Primary button"}</legend>
        <label>Label<div className="property-inline"><input value={section.props[key]} placeholder={index ? "Learn more" : "Get started"} onChange={(event) => p.onUpdateProp(key, event.target.value)} /><button type="button" onClick={() => section.props[key] ? p.onUpdateProp(key, "") : addButton(key, index ? "Learn more" : "Get started")}>{section.props[key] ? "Remove" : "Add"}</button></div></label>
        {section.props[key] && <>
          <label>Style<select value={style.buttonStyle ?? (index ? "outline" : "filled")} onChange={(event) => p.onUpdateButtonStyle(key, { buttonStyle: event.target.value as "filled" | "outline" })}><option value="filled">Filled</option><option value="outline">Outline</option></select></label>
          <div className="property-color-grid"><label>Button color<input type="color" value={colorValue(style.backgroundColor, "#2563eb")} onChange={(event) => p.onUpdateButtonStyle(key, { backgroundColor: event.target.value })} /></label><label>Text color<input type="color" value={colorValue(style.color, "#ffffff")} onChange={(event) => p.onUpdateButtonStyle(key, { color: event.target.value })} /></label><label>Border color<input type="color" value={colorValue(style.borderColor, "#2563eb")} onChange={(event) => p.onUpdateButtonStyle(key, { borderColor: event.target.value })} /></label></div>
          <label>Border radius <output>{style.borderRadius ?? 12}px</output><input type="range" min="0" max="50" value={style.borderRadius ?? 12} onChange={(event) => p.onUpdateButtonStyle(key, { borderRadius: Number(event.target.value) })} /></label>
          <label>Hover animation<select value={style.hoverEffect ?? "none"} onChange={(event) => p.onUpdateButtonStyle(key, { hoverEffect: event.target.value as EditableElementStyle["hoverEffect"] })}><option value="none">None</option><option value="glow">Glow</option><option value="lift">Lift</option><option value="scale">Scale</option><option value="invert">Invert colors</option></select></label>
          <label>Navigate to<input list={`section-targets-${key}`} value={link} placeholder="#section-id, /page, or https://…" onChange={(event) => p.onUpdateButtonLink(key, event.target.value)} /><datalist id={`section-targets-${key}`}>{p.sections.map((target) => <option key={target.id} value={`#${target.id}`}>{target.type}</option>)}</datalist><small>Use a section ID, site path, or complete external URL.</small></label>
        </>}
      </fieldset>;
    })}
  </div>;
}
