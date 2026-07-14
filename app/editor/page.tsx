"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import EditorSidebar, { type ChatMessage, type PromptHistoryItem } from "@/components/editor/EditorSidebar";
import EditorToolbar, { type DeviceMode, type EditorTab } from "@/components/editor/EditorToolbar";
import DesignPresetPanel from "@/components/editor/presets/DesignPresetPanel";
import ThemePanel from "@/components/editor/theme/ThemePanel";
import SectionProperties from "@/components/editor/SectionProperties";
import PreviewDashboard from "@/components/editor/PreviewDashboard";
import { initialWebsite } from "@/data/initialWebsite";
import WebsiteRenderer from "@/renderer/WebsiteRenderer";
import type { ColorMode, EditableElementKey, EditableElementStyle, EditorSelection, ViewMode, WebsiteJSON } from "@/types/website";
import { applyPromptCommand } from "@/utils/applyPromptCommand";
import { EDITOR_THEME_STORAGE_KEY, readStoredEditorTheme, readStoredWebsite, WEBSITE_STORAGE_KEY } from "@/utils/editorStorage";

export default function EditorPage() {
  const [websiteJSON, setWebsiteJSON] = useState<WebsiteJSON>(initialWebsite);
  const [selection, setSelection] = useState<EditorSelection>({ sectionId: initialWebsite.sections[1].id });
  const [viewMode, setViewMode] = useState<ViewMode>("preview");
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([{ id: "welcome", role: "assistant", text: "Tell me what you would like to change on the page." }]);
  const [history, setHistory] = useState<PromptHistoryItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [autoMode, setAutoMode] = useState(true);
  const [colorMode, setColorMode] = useState<ColorMode>("light");
  const [storageReady, setStorageReady] = useState(false);
  const [editorTab, setEditorTab] = useState<EditorTab>("ai");
  const [device, setDevice] = useState<DeviceMode>("desktop");
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const dragStateRef = useRef<{ isDragging: boolean; startX: number; startY: number }>({ isDragging: false, startX: 0, startY: 0 });

  useEffect(() => {
    const storedWebsite = readStoredWebsite();
    if (storedWebsite) setWebsiteJSON(storedWebsite);
    setColorMode(readStoredEditorTheme());
    setStorageReady(true);
  }, []);

  useEffect(() => {
    if (!storageReady) return;
    localStorage.setItem(WEBSITE_STORAGE_KEY, JSON.stringify(websiteJSON));
    localStorage.setItem(EDITOR_THEME_STORAGE_KEY, colorMode);
  }, [colorMode, storageReady, websiteJSON]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const resetDrag = () => {
      dragStateRef.current.isDragging = false;
      viewport.classList.remove("cursor-grabbing");
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    const handleMouseDown = (event: MouseEvent) => {
      if (event.button !== 1) return;

      event.preventDefault();
      dragStateRef.current = { isDragging: true, startX: event.clientX, startY: event.clientY };
      viewport.classList.add("cursor-grabbing");
      document.body.style.cursor = "grabbing";
      document.body.style.userSelect = "none";
    };

    const handleMouseMove = (event: MouseEvent) => {
      if (!dragStateRef.current.isDragging) return;

      event.preventDefault();
      const deltaX = event.clientX - dragStateRef.current.startX;
      const deltaY = event.clientY - dragStateRef.current.startY;
      viewport.scrollLeft += deltaX;
      viewport.scrollTop += deltaY;
      dragStateRef.current.startX = event.clientX;
      dragStateRef.current.startY = event.clientY;
    };

    const handleAuxClick = (event: MouseEvent) => {
      if (event.button === 1) event.preventDefault();
    };

    viewport.addEventListener("mousedown", handleMouseDown);
    viewport.addEventListener("auxclick", handleAuxClick);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", resetDrag);
    window.addEventListener("mouseleave", resetDrag);

    return () => {
      viewport.removeEventListener("mousedown", handleMouseDown);
      viewport.removeEventListener("auxclick", handleAuxClick);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", resetDrag);
      window.removeEventListener("mouseleave", resetDrag);
      resetDrag();
    };
  }, []);

  const updateElement = (sectionId: string, elementKey: EditableElementKey, value: string) => setWebsiteJSON((current) => ({ ...current, sections: current.sections.map((section) => section.id !== sectionId ? section : elementKey.startsWith("content.") ? { ...section, content: { ...section.content, [elementKey]: value } } : { ...section, props: { ...section.props, [elementKey]: value } }) }));
  const updateElementStyle = (sectionId: string, elementKey: EditableElementKey, patch: Partial<EditableElementStyle>) => setWebsiteJSON((current) => ({ ...current, sections: current.sections.map((section) => section.id === sectionId ? { ...section, elementStyles: { ...section.elementStyles, [elementKey]: { ...section.elementStyles?.[elementKey], ...patch } } } : section) }));
  const updateElementLink = (sectionId: string, elementKey: EditableElementKey, value: string) => setWebsiteJSON((current) => ({ ...current, sections: current.sections.map((section) => section.id === sectionId ? { ...section, elementLinks: { ...section.elementLinks, [elementKey]: value } } : section) }));
  const removeSection = (sectionId: string) => setWebsiteJSON((current) => ({ ...current, sections: current.sections.filter((section) => section.id !== sectionId) }));
  const duplicateSection = (sectionId: string) => setWebsiteJSON((current) => { const index=current.sections.findIndex((section)=>section.id===sectionId);if(index<0)return current;const copy={...current.sections[index],id:`${current.sections[index].type}-${crypto.randomUUID()}`,props:{...current.sections[index].props}};const sections=[...current.sections];sections.splice(index+1,0,copy);setSelection({sectionId:copy.id});return {...current,sections}; });
  const changeVariant = (sectionId: string, variant: "luxury"|"brutalist") => setWebsiteJSON((current)=>({...current,sections:current.sections.map((section)=>section.id===sectionId?{...section,variant}:section)}));
  const moveSection = (sourceId:string,targetId:string)=>setWebsiteJSON((current)=>{const from=current.sections.findIndex(s=>s.id===sourceId);const to=current.sections.findIndex(s=>s.id===targetId);if(from<0||to<0||from===to)return current;const sections=[...current.sections];const [moved]=sections.splice(from,1);sections.splice(to,0,moved);return {...current,sections}});

  const openPreview = () => {
    localStorage.setItem(WEBSITE_STORAGE_KEY, JSON.stringify(websiteJSON));
    window.open("/preview", "_blank", "noopener,noreferrer");
  };

  const handleSend = (event: FormEvent) => {
    event.preventDefault();
    const message = prompt.trim();
    if (!message || isProcessing) return;
    const id = crypto.randomUUID();
    setPrompt("");
    setIsProcessing(true);
    setMessages((current) => [...current, { id, role: "user", text: message }]);
    setHistory((current) => [{ id, prompt: message, createdAt: new Date().toISOString() }, ...current]);
    setTimeout(() => {
      setWebsiteJSON((current) => applyPromptCommand(current, message, selection.sectionId));
      setMessages((current) => [...current, { id: `${id}-reply`, role: "assistant", text: "I applied that direction to the live preview." }]);
      setIsProcessing(false);
    }, 700);
  };

  if (!storageReady) return <main data-theme="light" className="ide-shell h-screen" aria-label="Loading editor" />;

  return (
    <main data-theme={colorMode} className="ide-shell flex h-screen min-h-0 flex-col overflow-hidden lg:flex-row">
      <EditorSidebar colorMode={colorMode} onToggleColorMode={() => setColorMode((mode) => mode === "dark" ? "light" : "dark")} messages={messages} history={history} isProcessing={isProcessing} prompt={prompt} onPromptChange={setPrompt} autoMode={autoMode} onToggleAutoMode={() => setAutoMode((value) => !value)} onSubmit={handleSend} />
      <section className="ide-workspace flex-1 min-h-0 overflow-hidden">
        <div className="flex h-full flex-col">
          <EditorToolbar viewMode={viewMode} onViewModeChange={setViewMode} onOpenPreview={openPreview} editorTab={editorTab} onEditorTabChange={setEditorTab} device={device} onDeviceChange={setDevice} />
          <div ref={viewportRef} className="editor-viewport flex-1 min-h-0 overflow-auto cursor-grab">
            <PreviewDashboard visible={viewMode === "dashboard"} website={websiteJSON} aiActions={history.length} onWebsiteChange={setWebsiteJSON} />
            {editorTab==="design"&&<aside className="editor-control-drawer"><DesignPresetPanel website={websiteJSON} onChange={setWebsiteJSON}/></aside>}
            {editorTab==="theme"&&<aside className="editor-control-drawer"><ThemePanel website={websiteJSON} onChange={setWebsiteJSON}/></aside>}
            {editorTab==="layers"&&<aside className="editor-control-drawer editor-panel"><h2>Layers</h2>{websiteJSON.sections.map(section=><button type="button" key={section.id} onClick={()=>{setSelection({sectionId:section.id});setViewMode("edit")}}>{section.type} · {section.variant}</button>)}</aside>}
            {editorTab==="properties"&&websiteJSON.sections.find(s=>s.id===selection.sectionId)&&<aside className="editor-control-drawer"><SectionProperties selectedSection={websiteJSON.sections.find(s=>s.id===selection.sectionId)!} onUpdateProp={(key,value)=>updateElement(selection.sectionId,key as EditableElementKey,value)}/></aside>}
            {viewMode!=="dashboard"&&<div className="device-canvas" style={{width:device==="desktop"?"100%":device==="tablet"?"768px":"390px"}}><WebsiteRenderer website={websiteJSON} renderMode={viewMode==="edit"?"edit":"preview"} selection={selection} onSelectionChange={setSelection} onUpdateElement={updateElement} onUpdateElementStyle={updateElementStyle} onUpdateElementLink={updateElementLink} onRemoveSection={removeSection} onDuplicateSection={duplicateSection} onChangeVariant={changeVariant} onMoveSection={moveSection} /></div>}
          </div>
        </div>
      </section>
    </main>
  );
}
