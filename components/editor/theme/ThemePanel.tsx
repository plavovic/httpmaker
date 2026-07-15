import { designPresets } from "@/presets";
import type { WebsiteJSON, WebsiteTheme } from "@/types/website";
import ThemeColorControl from "./ThemeColorControl";
import ThemeTypographyControl from "./ThemeTypographyControl";
import ThemeSpacingControl from "./ThemeSpacingControl";
import ThemeImageTreatmentControl from "./ThemeImageTreatmentControl";
import ThemePalettePresets from "./ThemePalettePresets";
import type { SetWebsiteOptions } from "@/hooks/useWebsiteHistory";
type ColorKey="backgroundColor"|"surfaceColor"|"primaryColor"|"secondaryColor"|"accentColor"|"textColor"|"mutedTextColor";
const colors:Array<[string,ColorKey]>=[["Background","backgroundColor"],["Surface","surfaceColor"],["Primary","primaryColor"],["Secondary","secondaryColor"],["Accent","accentColor"],["Text","textColor"],["Muted text","mutedTextColor"]];
export default function ThemePanel({website,onChange}:{website:WebsiteJSON;onChange:(website:WebsiteJSON,options:SetWebsiteOptions)=>void}){
 const base=website.presetId?designPresets[website.presetId].theme:website.theme;
 const update=(patch:Partial<WebsiteTheme>)=>{const fields=Object.keys(patch).sort();onChange({...website,isThemeCustomized:true,theme:{...website.theme,...patch}},{label:fields.length===1?`Change theme ${fields[0]}`:"Apply theme palette",group:fields.length===1?`theme:${fields[0]}`:undefined})};
 return <div className="editor-panel"><h2>Theme</h2><p>Changes colors, fonts, radius, spacing, density, and image treatment without replacing the website layout.</p><p className="mt-2 text-xs uppercase">{website.presetId?designPresets[website.presetId].name:"Custom theme"}{website.isThemeCustomized?" · Customized":""}</p><h3>Palette presets</h3><ThemePalettePresets onApply={update}/><h3>Colors</h3><div className="space-y-2">{colors.map(([label,key])=><ThemeColorControl key={key} label={label} value={website.theme[key]} defaultValue={base[key]} onChange={value=>update({[key]:value})}/>)}</div><h3>Typography</h3><ThemeTypographyControl theme={website.theme} onChange={update}/><h3>Layout</h3><ThemeSpacingControl theme={website.theme} onChange={update}/><h3>Images</h3><ThemeImageTreatmentControl value={website.theme.imageTreatment} onChange={imageTreatment=>update({imageTreatment})}/></div>;
}
