import EditorTabs from "@/components/editor/EditorTabs";
import type { ColorMode, ViewMode } from "@/types/website";

export type EditorTab = "ai" | "layers" | "design" | "theme" | "properties";
export type DeviceMode = "desktop" | "tablet" | "mobile";
type Props = { profileImage: string | null; profileName: string; projectName: string; saveState: string; colorMode: ColorMode; onToggleColorMode: () => void; viewMode: ViewMode; onViewModeChange: (mode: ViewMode) => void; onOpenPreview: () => void; onExport:()=>void; editorTab: EditorTab; onEditorTabChange: (tab: EditorTab) => void; device: DeviceMode; onDeviceChange: (device: DeviceMode) => void; canUndo: boolean; canRedo: boolean; undoLabel?: string; redoLabel?: string; onUndo: () => void; onRedo: () => void };

export default function EditorToolbar(props: Props) {
  return <header className="studio-toolbar">
    <div className="studio-project"><a href="/dashboard" className="studio-project-mark studio-profile-mark" aria-label="Open dashboard" title="Open dashboard">{props.profileImage ? <img src={props.profileImage} alt="" /> : <span>{props.profileName.slice(0, 1).toUpperCase()}</span>}</a><div><div className="studio-project-path"><a href="/dashboard">Projects</a><b>/</b> {props.projectName}</div><div className="studio-save-state"><i /> {props.saveState}</div></div><span className="studio-project-divider" aria-hidden="true" /><button type="button" onClick={props.onToggleColorMode} className="studio-theme-toggle" aria-label={`Switch to ${props.colorMode === "dark" ? "light" : "dark"} mode`} title={`Switch to ${props.colorMode === "dark" ? "light" : "dark"} mode`}>{props.colorMode === "dark" ? "☀" : "◐"}</button></div>
    <div className="studio-panel-nav"><EditorTabs value={props.editorTab} onChange={props.onEditorTabChange} /></div>
    <div className="studio-actions">
      <div className="studio-history-controls" aria-label="Edit history"><button type="button" onClick={props.onUndo} disabled={!props.canUndo} aria-label={props.undoLabel ? `Undo: ${props.undoLabel}` : "Undo"} title={props.undoLabel ? `Undo: ${props.undoLabel} (Ctrl+Z)` : "Nothing to undo"}>↶</button><button type="button" onClick={props.onRedo} disabled={!props.canRedo} aria-label={props.redoLabel ? `Redo: ${props.redoLabel}` : "Redo"} title={props.redoLabel ? `Redo: ${props.redoLabel} (Ctrl+Shift+Z / Ctrl+Y)` : "Nothing to redo"}>↷</button></div>
      <div className="studio-device-switch" aria-label="Preview device">{(["desktop", "tablet", "mobile"] as DeviceMode[]).map((device) => <button type="button" key={device} title={`${device} preview`} aria-label={`${device} preview`} className={props.device === device ? "selected" : ""} onClick={() => props.onDeviceChange(device)}><span className={`device-icon device-icon-${device}`} /></button>)}</div>
      <div className="studio-view-switch">{(["preview", "edit", "dashboard"] as ViewMode[]).map((mode) => <button type="button" key={mode} onClick={() => props.onViewModeChange(mode)} className={props.viewMode === mode ? "selected" : ""}>{mode}</button>)}</div>
      <button type="button" className="studio-preview-button" onClick={props.onOpenPreview} title="Open full preview">↗</button>
      <button type="button" className="studio-export-button" onClick={props.onExport} title="Download visitor website ZIP">ZIP</button>
      <button type="button" className="studio-publish-button"><span>Publish</span></button>
    </div>
  </header>;
}
