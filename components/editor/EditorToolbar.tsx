import EditorTabs from "@/components/editor/EditorTabs";
import type { ViewMode } from "@/types/website";

export type EditorTab = "ai" | "layers" | "design" | "theme" | "properties";
export type DeviceMode = "desktop" | "tablet" | "mobile";

type Props = { viewMode: ViewMode; onViewModeChange: (mode: ViewMode) => void; onOpenPreview: () => void; editorTab: EditorTab; onEditorTabChange: (tab: EditorTab) => void; device: DeviceMode; onDeviceChange: (device: DeviceMode) => void };

export default function EditorToolbar(props: Props) {
  return <header className="studio-toolbar">
    <div className="studio-project"><div className="studio-project-mark">H</div><div><div className="studio-project-path"><span>Projects</span><b>/</b> Untitled site</div><div className="studio-save-state"><i /> All changes saved</div></div></div>
    <div className="studio-panel-nav"><EditorTabs value={props.editorTab} onChange={props.onEditorTabChange} /></div>
    <div className="studio-actions">
      <div className="studio-device-switch" aria-label="Preview device">{(["desktop", "tablet", "mobile"] as DeviceMode[]).map((device) => <button type="button" key={device} title={`${device} preview`} aria-label={`${device} preview`} className={props.device === device ? "selected" : ""} onClick={() => props.onDeviceChange(device)}><span className={`device-icon device-icon-${device}`} /></button>)}</div>
      <div className="studio-view-switch">{(["preview", "edit", "dashboard"] as ViewMode[]).map((mode) => <button type="button" key={mode} onClick={() => props.onViewModeChange(mode)} className={props.viewMode === mode ? "selected" : ""}>{mode}</button>)}</div>
      <button type="button" className="studio-preview-button" onClick={props.onOpenPreview} title="Open full preview">↗</button>
      <button type="button" className="studio-publish-button"><span>Publish</span><b>⌄</b></button>
    </div>
  </header>;
}
