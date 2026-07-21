import { useEffect, useState } from "react";
import type { Alignment, EditableElementStyle, NavbarAppearance, NavbarScrollBehavior, WebsiteFormField, WebsiteSection, WebsiteSectionProps } from "@/types/website";
import { extractGoogleMapsEmbedUrl, isGoogleMapsShortUrl } from "@/utils/googleMaps";

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
  onUpdateStructuredProps: (patch: Partial<WebsiteSectionProps>) => void;
};

const fields: { label: string; key: "title" | "subtitle" | "imageUrl" }[] = [{ label: "Title", key: "title" }, { label: "Subtitle", key: "subtitle" }, { label: "Image URL", key: "imageUrl" }];
const colorValue = (value: string | undefined, fallback: string) => /^#[\da-f]{6}$/i.test(value ?? "") ? value! : fallback;

export default function SectionProperties(p: Props) {
  const section = p.selectedSection;
  const [mapDraft,setMapDraft]=useState(section.props.mapEmbedUrl??"");
  const [mapBusy,setMapBusy]=useState(false);
  const [mapError,setMapError]=useState("");
  useEffect(()=>setMapDraft(section.props.mapEmbedUrl??""),[section.id,section.props.mapEmbedUrl]);
  const parsedMapUrl=extractGoogleMapsEmbedUrl(mapDraft);
  const shortMapUrl=isGoogleMapsShortUrl(mapDraft);
  const addMap=async()=>{setMapError("");if(parsedMapUrl){p.onUpdateStructuredProps({mapEmbedUrl:parsedMapUrl});return}if(!shortMapUrl)return;setMapBusy(true);try{const response=await fetch("/api/maps/resolve",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({url:mapDraft})});const body=await response.json();if(!response.ok)throw new Error(body.error??"The link could not be resolved.");setMapDraft(body.embedUrl);p.onUpdateStructuredProps({mapEmbedUrl:body.embedUrl})}catch(reason){setMapError(reason instanceof Error?reason.message:"The link could not be resolved.")}finally{setMapBusy(false)}};
  const backgroundColor = section.backgroundColor ?? p.defaultBackgroundColor;
  const addButton = (key: ButtonKey, fallback: string) => p.onUpdateProp(key, section.props[key].trim() || fallback);
  const updateField = (id: string, patch: Partial<WebsiteFormField>) => p.onUpdateStructuredProps({ formFields: (section.props.formFields ?? []).map((field) => field.id === id ? { ...field, ...patch } : field) });

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

    {section.type === "carousel" && <fieldset><legend>Carousel images</legend>
      <small>Add image URLs, then drag the numbered rows to reorder them.</small>
      <div className="property-sort-list">{(section.props.items ?? []).map((url, index) => <div key={`${index}-${url}`} className="property-sort-item" draggable onDragStart={(event) => event.dataTransfer.setData("text/carousel-index", String(index))} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); const from = Number(event.dataTransfer.getData("text/carousel-index")); if (!Number.isInteger(from) || from === index) return; const items = [...(section.props.items ?? [])]; const [moved] = items.splice(from, 1); items.splice(index, 0, moved); p.onUpdateStructuredProps({ items }); }}><span>{index + 1}</span><input aria-label={`Image ${index + 1} URL`} value={url} placeholder="https://…" onChange={(event) => { const items = [...(section.props.items ?? [])]; items[index] = event.target.value; p.onUpdateStructuredProps({ items }); }} /><button type="button" onClick={() => p.onUpdateStructuredProps({ items: (section.props.items ?? []).filter((_, itemIndex) => itemIndex !== index) })}>Remove</button></div>)}</div>
      <button type="button" onClick={() => p.onUpdateStructuredProps({ items: [...(section.props.items ?? []), ""] })}>Add image</button>
    </fieldset>}

    {section.type === "contact" && <fieldset><legend>Form inputs</legend>
      <small>Every field label, type, placeholder, and required state is editable.</small>
      {(section.props.formFields ?? []).map((field) => <div className="property-form-field" key={field.id}>
        <input aria-label="Field label" value={field.label} placeholder="Label" onChange={(event) => updateField(field.id, { label: event.target.value })} />
        <select aria-label="Field type" value={field.type} onChange={(event) => updateField(field.id, { type: event.target.value as WebsiteFormField["type"] })}><option value="text">Text</option><option value="email">Email</option><option value="tel">Phone</option><option value="textarea">Long text</option></select>
        <input aria-label="Field placeholder" value={field.placeholder} placeholder="Placeholder" onChange={(event) => updateField(field.id, { placeholder: event.target.value })} />
        <label className="property-check"><input type="checkbox" checked={field.required} onChange={(event) => updateField(field.id, { required: event.target.checked })} />Required</label>
        <button type="button" onClick={() => p.onUpdateStructuredProps({ formFields: (section.props.formFields ?? []).filter((item) => item.id !== field.id) })}>Remove field</button>
      </div>)}
      <button type="button" onClick={() => p.onUpdateStructuredProps({ formFields: [...(section.props.formFields ?? []), { id: crypto.randomUUID(), label: "New field", type: "text", placeholder: "Enter your answer", required: false }] })}>Add form input</button>
    </fieldset>}

    {section.type === "contact" && <fieldset><legend>Google Maps view</legend>
      <label>Embed code or URL<textarea rows={5} value={mapDraft} placeholder={'Paste the Google Maps <iframe …> code or its https://www.google.com/maps/embed URL'} onChange={(event) => setMapDraft(event.target.value)} /></label>
      <small>{mapError||(!mapDraft?"Paste an embed URL, iframe code, or a maps.app.goo.gl share link.":parsedMapUrl?"Ready to add.":shortMapUrl?"This short link will be converted into an embeddable map.":"This is not a valid Google Maps link. In Google Maps choose Share → Embed a map.")}</small>
      <div className="property-inline"><button type="button" disabled={mapBusy||(!parsedMapUrl&&!shortMapUrl)} onClick={()=>void addMap()}>{mapBusy?"Resolving…":section.props.mapEmbedUrl?"Update map":"Add map"}</button>{section.props.mapEmbedUrl&&<button type="button" onClick={()=>{setMapDraft("");setMapError("");p.onUpdateStructuredProps({mapEmbedUrl:""})}}>Remove map</button>}</div>
    </fieldset>}

    {(["buttonText", "secondaryButtonText"] as ButtonKey[]).map((key, index) => {
      const style = section.elementStyles?.[key] ?? {};
      const link = section.elementLinks?.[key] ?? "";
      return <fieldset key={key}><legend>{index ? "Secondary button" : "Primary button"}</legend>
        <label>Label<div className="property-inline"><input value={section.props[key]} placeholder={index ? "Learn more" : "Get started"} onChange={(event) => p.onUpdateProp(key, event.target.value)} /><button type="button" onClick={() => section.props[key] ? p.onUpdateProp(key, "") : addButton(key, index ? "Learn more" : "Get started")}>{section.props[key] ? "Remove" : "Add"}</button></div></label>
        {section.props[key] && <>
          <label>Style<select value={style.buttonStyle ?? (index ? "outline" : "filled")} onChange={(event) => p.onUpdateButtonStyle(key, { buttonStyle: event.target.value as "filled" | "outline" | "text" })}><option value="filled">Color box</option><option value="outline">Outline box</option><option value="text">Clickable text</option></select></label>
          <div className="property-color-grid"><label>Button color<input type="color" value={colorValue(style.backgroundColor, "#2563eb")} onChange={(event) => p.onUpdateButtonStyle(key, { backgroundColor: event.target.value })} /></label><label>Text color<input type="color" value={colorValue(style.color, "#ffffff")} onChange={(event) => p.onUpdateButtonStyle(key, { color: event.target.value })} /></label><label>Border color<input type="color" value={colorValue(style.borderColor, "#2563eb")} onChange={(event) => p.onUpdateButtonStyle(key, { borderColor: event.target.value })} /></label></div>
          <label>Border radius <output>{style.borderRadius ?? 12}px</output><input type="range" min="0" max="50" value={style.borderRadius ?? 12} onChange={(event) => p.onUpdateButtonStyle(key, { borderRadius: Number(event.target.value) })} /></label>
          <label>Hover animation<select value={style.hoverEffect ?? "none"} onChange={(event) => p.onUpdateButtonStyle(key, { hoverEffect: event.target.value as EditableElementStyle["hoverEffect"] })}><option value="none">None</option><option value="glow">Glow</option><option value="lift">Lift</option><option value="scale">Scale</option><option value="invert">Invert colors</option></select></label>
          <label>Navigate to<input list={`section-targets-${key}`} value={link} placeholder="#section-id, /page, or https://…" onChange={(event) => p.onUpdateButtonLink(key, event.target.value)} /><datalist id={`section-targets-${key}`}>{p.sections.map((target) => <option key={target.id} value={`#${target.id}`}>{target.type}</option>)}</datalist><small>Use a section ID, site path, or complete external URL.</small></label>
        </>}
      </fieldset>;
    })}
  </div>;
}
