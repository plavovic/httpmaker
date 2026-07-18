"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import EditorSidebar, { type ChatMessage, type PromptHistoryItem } from "@/components/editor/EditorSidebar";
import EditorToolbar, { type DeviceMode, type EditorTab } from "@/components/editor/EditorToolbar";
import DesignPresetPanel from "@/components/editor/presets/DesignPresetPanel";
import ThemePanel from "@/components/editor/theme/ThemePanel";
import SectionProperties from "@/components/editor/SectionProperties";
import PreviewDashboard from "@/components/editor/PreviewDashboard";
import { initialWebsite } from "@/data/initialWebsite";
import WebsiteRenderer from "@/renderer/WebsiteRenderer";
import type { ColorMode, EditableElementKey, EditableElementStyle, EditorSelection, ViewMode, WebsiteJSON } from "@/types/website";
import { EDITOR_THEME_STORAGE_KEY, isLightStudioTheme, readStoredEditorTheme, readStoredWebsite, saveStoredWebsite } from "@/utils/editorStorage";
import { useWebsiteHistory } from "@/hooks/useWebsiteHistory";
import { requestAiProposal, AiClientError } from "@/services/ai/client";
import { applyWebsiteDesignPatchSafely } from "@/services/ai/applyWebsiteDesignPatchSafely";
import type { AiMode, AiPatchProposal } from "@/types/ai";
import AssetLibrary from "@/components/editor/assets/AssetLibrary";
import type { UploadedImageAsset } from "@/types/uploadedAsset";
import { compactWebsiteAssetReferences, createAssetReference, createImageAsset, deleteImageAsset, listImageAssets, resolveWebsiteAssetReferences, saveImageAsset } from "@/utils/assetStorage";
import { exportWebsiteZip } from "@/utils/exportWebsiteZip";
import { safelyParseWebsiteData } from "@/schemas/website.schema";

type PendingProposal = { proposal: AiPatchProposal; previewWebsite: WebsiteJSON; mode: AiMode; selectedSectionId?: string };
const modeForPrompt = (message: string): AiMode => /\b(add|insert|create)\b.*\b(section|hero|navbar|about|carousel|features|contact|footer)\b/i.test(message) ? "add-section" : /\b(restyle|theme|palette|colors?|dark|light|design)\b/i.test(message) ? "restyle-website" : /\b(rewrite|copy|content)\b/i.test(message) ? "rewrite-content" : "edit-selected-section";

export default function EditorPage() {
  const { website: websiteJSON, setWebsite: setWebsiteJSON, replaceWebsite, undo, redo, canUndo, canRedo, undoLabel, redoLabel } = useWebsiteHistory(initialWebsite);
  const [selection, setSelection] = useState<EditorSelection>({ sectionId: initialWebsite.sections[1].id });
  const [viewMode, setViewMode] = useState<ViewMode>("preview");
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([{ id: "welcome", role: "assistant", text: "Tell me what you would like to change on the page." }]);
  const [history, setHistory] = useState<PromptHistoryItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [autoMode, setAutoMode] = useState(true);
  const [colorMode, setColorMode] = useState<ColorMode>("sky");
  const [storageReady, setStorageReady] = useState(false);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [projectName, setProjectName] = useState("Untitled site");
  const [saveState, setSaveState] = useState("All changes saved");
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [profileName, setProfileName] = useState("User");
  const [ownerId, setOwnerId] = useState<string | null>(null);
  const [editorTab, setEditorTab] = useState<EditorTab>("ai");
  const [device, setDevice] = useState<DeviceMode>("desktop");
  const [pendingProposal, setPendingProposal] = useState<PendingProposal | null>(null);
  const [assets,setAssets]=useState<UploadedImageAsset[]>([]);
  const [assetLibraryOpen,setAssetLibraryOpen]=useState(false);
  const [assetTarget,setAssetTarget]=useState<string>();
  const [assetBusy,setAssetBusy]=useState(false);
  const [assetError,setAssetError]=useState("");
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const aiRequestRef = useRef<AbortController | null>(null);
  const dragStateRef = useRef<{ isDragging: boolean; startX: number; startY: number }>({ isDragging: false, startX: 0, startY: 0 });

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setColorMode(readStoredEditorTheme());
      const projectId = new URLSearchParams(window.location.search).get("projectId");
      if (projectId) {
        try {
          const response = await fetch(`/api/projects/${encodeURIComponent(projectId)}`);
          if (response.status === 401) { window.location.assign("/login"); return; }
          const body = await response.json();
          if (!response.ok) throw new Error(body.error ?? "Unable to load project.");
          const websiteResult = safelyParseWebsiteData(body.project.website);
          if (!websiteResult.success) throw new Error("The saved project contains invalid website data.");
          if (!cancelled) {
            replaceWebsite(websiteResult.data);
            setActiveProjectId(projectId);
            setProjectName(body.project.name);
          }
        } catch (reason) {
          if (!cancelled) setAssetError(reason instanceof Error ? reason.message : "Unable to load project.");
        }
      } else {
        const storedWebsite = readStoredWebsite();
        if (storedWebsite && !cancelled) replaceWebsite(storedWebsite);
      }
      if (!cancelled) setStorageReady(true);
    };
    void load();
    return () => { cancelled = true; };
  }, [replaceWebsite]);

  useEffect(() => {
    fetch("/api/profile")
      .then(async (response) => {
        if (response.status === 401) { window.location.assign("/login"); return null; }
        return response.ok ? response.json() : null;
      })
      .then((profile) => {
        if (!profile) return;
        setOwnerId(profile.id);
        setProfileImage(profile.image ?? null);
        setProfileName(profile.name ?? "User");
      })
      .catch(() => { /* The editor can use the initial fallback without profile data. */ });
  }, []);

  useEffect(() => {
    const handleHistoryShortcut = (event: KeyboardEvent) => {
      const target = event.target instanceof Element ? event.target : null;
      if (target?.matches("input, textarea, select, [contenteditable]:not([contenteditable='false'])") || target?.closest("[contenteditable]:not([contenteditable='false'])")) return;
      const key = event.key.toLowerCase();
      const undoShortcut = (event.ctrlKey || event.metaKey) && !event.shiftKey && key === "z";
      const redoShortcut = ((event.ctrlKey || event.metaKey) && event.shiftKey && key === "z") || (event.ctrlKey && !event.metaKey && !event.shiftKey && key === "y");
      if (event.altKey || (!undoShortcut && !redoShortcut)) return;
      event.preventDefault();
      if (redoShortcut) redo(); else undo();
    };
    window.addEventListener("keydown", handleHistoryShortcut);
    return () => window.removeEventListener("keydown", handleHistoryShortcut);
  }, [redo, undo]);

  useEffect(() => {
    setSelection((current) => {
      const section = websiteJSON.sections.find((item) => item.id === current.sectionId);
      if (!section) return websiteJSON.sections[0] ? { sectionId: websiteJSON.sections[0].id } : current;
      if (!current.elementKey) return current;
      const isValidElement = current.elementKey.startsWith("content.")
        ? Object.prototype.hasOwnProperty.call(section.content ?? {}, current.elementKey)
        : Object.prototype.hasOwnProperty.call(section.props, current.elementKey);
      return isValidElement ? current : { sectionId: current.sectionId };
    });
  }, [websiteJSON]);

  useEffect(() => {
    if (!storageReady) return;
    saveStoredWebsite(compactWebsiteAssetReferences(websiteJSON,assets));
    try { localStorage.setItem(EDITOR_THEME_STORAGE_KEY, colorMode); } catch { /* The editor remains usable when browser storage is unavailable. */ }
  }, [assets, colorMode, storageReady, websiteJSON]);

  useEffect(() => {
    if (!storageReady || !activeProjectId) return;
    setSaveState("Saving…");
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/projects/${encodeURIComponent(activeProjectId)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ website: compactWebsiteAssetReferences(websiteJSON, assets) }),
        });
        if (!response.ok) throw new Error();
        setSaveState("All changes saved");
      } catch {
        setSaveState("Save failed");
      }
    }, 700);
    return () => window.clearTimeout(timer);
  }, [activeProjectId, assets, storageReady, websiteJSON]);

  useEffect(() => {
    if (editorTab === "ai") return;
    const dismissPanel = (event: PointerEvent) => {
      const target = event.target as Element | null;
      if (target?.closest(".editor-control-drawer, .editor-tabs")) return;
      setEditorTab("ai");
    };
    document.addEventListener("pointerdown", dismissPanel);
    return () => document.removeEventListener("pointerdown", dismissPanel);
  }, [editorTab]);

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

  useEffect(() => () => aiRequestRef.current?.abort(), []);
  useEffect(()=>{if(!ownerId)return;listImageAssets(ownerId).then(setAssets).catch(()=>setAssetError("The asset library could not be opened."))},[ownerId]);

  const uploadFiles=async(files:File[])=>{if(!files.length||!ownerId)return;setAssetBusy(true);setAssetError("");try{const uploaded=[] as UploadedImageAsset[];for(const file of files){const asset=await createImageAsset(file,ownerId);await saveImageAsset(asset,ownerId);uploaded.push(asset)}setAssets(current=>[...uploaded,...current]);setAssetLibraryOpen(true)}catch(reason){setAssetError(reason instanceof Error?reason.message:"Image upload failed.")}finally{setAssetBusy(false)}};
  const chooseAsset=(asset:UploadedImageAsset)=>{if(!assetTarget)return;const reference=createAssetReference(asset.id);if(assetTarget==="__background__"){setWebsiteJSON(current=>({...current,isThemeCustomized:true,theme:{...current.theme,backgroundImageUrl:reference}}),{label:"Set page background"});setAssetLibraryOpen(false);return}setWebsiteJSON(current=>({...current,sections:current.sections.map(section=>section.id===assetTarget?{...section,props:{...section.props,imageUrl:reference}}:section)}),{label:"Replace image"});setSelection({sectionId:assetTarget,elementKey:"imageUrl"});setAssetLibraryOpen(false)};
  const removeAsset=async(id:string)=>{if(!ownerId)return;await deleteImageAsset(id,ownerId);setAssets(current=>current.filter(asset=>asset.id!==id))};
  const setAssetAsBackground=(asset:UploadedImageAsset)=>{setWebsiteJSON(current=>({...current,isThemeCustomized:true,theme:{...current.theme,backgroundImageUrl:createAssetReference(asset.id)}}),{label:"Set page background"});setAssetLibraryOpen(false)};

  const updateElement = (sectionId: string, elementKey: EditableElementKey, value: string) => setWebsiteJSON((current) => {
    const section=current.sections.find(item=>item.id===sectionId);const oldValue=elementKey.startsWith("content.")?section?.content?.[elementKey]:section?.props[elementKey as keyof typeof section.props];
    if(String(oldValue??"")===value)return current;
    return { ...current, sections: current.sections.map((item) => item.id !== sectionId ? item : elementKey.startsWith("content.") ? { ...item, content: { ...item.content, [elementKey]: value } } : { ...item, props: { ...item.props, [elementKey]: value } }) };
  }, { label: `Edit ${elementKey.replace("content.", "")}`, group: `content:${sectionId}:${elementKey}` });
  const updateElementStyle = (sectionId: string, elementKey: EditableElementKey, patch: Partial<EditableElementStyle>) => setWebsiteJSON((current) => {
    const oldStyle=current.sections.find(item=>item.id===sectionId)?.elementStyles?.[elementKey]??{};
    if(Object.entries(patch).every(([name,value])=>oldStyle[name as keyof EditableElementStyle]===value))return current;
    return { ...current, sections: current.sections.map((section) => section.id === sectionId ? { ...section, elementStyles: { ...section.elementStyles, [elementKey]: { ...section.elementStyles?.[elementKey], ...patch } } } : section) };
  }, { label: `Style ${elementKey.replace("content.", "")}`, group: `style:${sectionId}:${elementKey}:${Object.keys(patch).sort().join(",")}` });
  const updateElementLink = (sectionId: string, elementKey: EditableElementKey, value: string) => setWebsiteJSON((current) => ({ ...current, sections: current.sections.map((section) => section.id === sectionId ? { ...section, elementLinks: { ...section.elementLinks, [elementKey]: value } } : section) }), { label: `Edit ${elementKey.replace("content.", "")} link`, group: `link:${sectionId}:${elementKey}` });
  const removeSection = (sectionId: string) => {const index=websiteJSON.sections.findIndex(section=>section.id===sectionId);if(index<0)return;const sections=websiteJSON.sections.filter(section=>section.id!==sectionId);setWebsiteJSON({...websiteJSON,sections},{label:"Delete section"});const fallback=sections[Math.min(index,sections.length-1)];if(fallback)setSelection({sectionId:fallback.id})};
  const duplicateSection = (sectionId: string) => {const index=websiteJSON.sections.findIndex(section=>section.id===sectionId);if(index<0)return;const source=websiteJSON.sections[index];const copy={...source,id:`${source.type}-${crypto.randomUUID()}`,props:{...source.props},content:source.content?{...source.content}:undefined,elementStyles:source.elementStyles?structuredClone(source.elementStyles):undefined,elementLinks:source.elementLinks?{...source.elementLinks}:undefined};const sections=[...websiteJSON.sections];sections.splice(index+1,0,copy);setWebsiteJSON({...websiteJSON,sections},{label:"Duplicate section"});setSelection({sectionId:copy.id})};
  const changeVariant = (sectionId: string, variant: "luxury"|"brutalist") => setWebsiteJSON((current)=>({...current,sections:current.sections.map((section)=>section.id===sectionId?{...section,variant}:section)}), { label: `Change section variant to ${variant}` });
  const updateSectionBackground = (sectionId:string, backgroundColor:string|undefined) => setWebsiteJSON(current=>({...current,sections:current.sections.map(section=>section.id===sectionId?{...section,backgroundColor}:section)}),{label:"Change section background",group:`section-background:${sectionId}`});
  const moveSection = (sourceId:string,targetId:string)=>setWebsiteJSON((current)=>{const from=current.sections.findIndex(s=>s.id===sourceId);const to=current.sections.findIndex(s=>s.id===targetId);if(from<0||to<0||from===to)return current;const sections=[...current.sections];const [moved]=sections.splice(from,1);sections.splice(to,0,moved);return {...current,sections}}, { label: "Move section" });

  const openPreview = () => {
    saveStoredWebsite(compactWebsiteAssetReferences(websiteJSON,assets));
    window.open("/preview", "_blank", "noopener,noreferrer");
  };

  const handleSend = async (event: FormEvent) => {
    event.preventDefault();
    const message = prompt.trim();
    if (!message || isProcessing) return;
    const id = crypto.randomUUID();
    setPrompt("");
    setIsProcessing(true);
    setMessages((current) => [...current, { id, role: "user", text: message }]);
    setHistory((current) => [{ id, prompt: message, createdAt: new Date().toISOString() }, ...current]);
    setPendingProposal(null);
    aiRequestRef.current?.abort();
    const controller = new AbortController();
    aiRequestRef.current = controller;
    const mode = modeForPrompt(message);
    const selectedSectionId = mode === "edit-selected-section" || mode === "rewrite-content" ? selection.sectionId : undefined;
    try {
      const response = await requestAiProposal({ mode, instruction: message, website: websiteJSON, selectedSectionId }, controller.signal);
      const previewResult = applyWebsiteDesignPatchSafely({ website: websiteJSON, patch: response.proposal.patch, mode, selectedSectionId });
      if (!previewResult.success) throw new AiClientError(`The proposal cannot be previewed: ${previewResult.error.message}`);
      setPendingProposal({ proposal: response.proposal, previewWebsite: previewResult.website, mode, selectedSectionId });
      setEditorTab("ai");
      setViewMode("preview");
      setMessages((current) => [...current, { id: `${id}-reply`, role: "assistant", text: "The proposed changes are now visible on the canvas. Apply them or discard the preview." }]);
    } catch (reason) {
      if (controller.signal.aborted) return;
      const detail = reason instanceof AiClientError ? reason.message : "The proposal could not be generated.";
      setMessages((current) => [...current, { id: `${id}-error`, role: "assistant", text: detail }]);
    } finally {
      if (aiRequestRef.current === controller) aiRequestRef.current = null;
      setIsProcessing(false);
    }
  };

  const applyProposal = () => {
    if (!pendingProposal) return;
    const label = pendingProposal.proposal.summary[0]?.title ?? "Apply AI proposal";
    setWebsiteJSON(pendingProposal.previewWebsite, { label: `AI: ${label}`, source: "ai" });
    setPendingProposal(null);
    setMessages((current) => [...current, { id: crypto.randomUUID(), role: "assistant", text: "Proposal applied. You can undo it as one operation." }]);
  };

  const discardProposal = () => {
    setPendingProposal(null);
    setMessages((current) => [...current, { id: crypto.randomUUID(), role: "assistant", text: "Proposal discarded. No website changes were made." }]);
  };

  const displayedWebsite = useMemo(()=>resolveWebsiteAssetReferences(pendingProposal?.previewWebsite ?? websiteJSON,assets),[assets,pendingProposal,websiteJSON]);
  const websiteLocked = isProcessing || Boolean(pendingProposal);

  if (!storageReady) return <main data-theme="light" className="ide-shell h-screen" aria-label="Loading editor" />;

  return (
    <main data-theme={isLightStudioTheme(colorMode) ? "light" : "dark"} data-color-theme={colorMode} className="ide-shell studio-shell flex h-screen min-h-0 flex-col overflow-hidden">
      <EditorToolbar profileImage={profileImage} profileName={profileName} projectName={projectName} saveState={saveState} colorMode={colorMode} onColorModeChange={setColorMode} viewMode={viewMode} onViewModeChange={setViewMode} onOpenPreview={openPreview} onExport={()=>void exportWebsiteZip(resolveWebsiteAssetReferences(websiteJSON,assets))} editorTab={editorTab} onEditorTabChange={setEditorTab} device={device} onDeviceChange={setDevice} canUndo={canUndo} canRedo={canRedo} undoLabel={undoLabel} redoLabel={redoLabel} onUndo={undo} onRedo={redo} />
      <div className="studio-body flex min-h-0 flex-1">
        <EditorSidebar messages={messages} history={history} isProcessing={isProcessing} prompt={prompt} onPromptChange={setPrompt} autoMode={autoMode} onToggleAutoMode={() => setAutoMode((value) => !value)} onSubmit={handleSend} proposal={pendingProposal?.proposal ?? null} onApplyProposal={applyProposal} onDiscardProposal={discardProposal} />
        <section className="ide-workspace flex-1 min-h-0 overflow-hidden">
        <div className="flex h-full flex-col">
          <div ref={viewportRef} className="editor-viewport studio-viewport flex-1 min-h-0 overflow-auto cursor-grab" onDragOver={event=>{if(event.dataTransfer.types.includes("Files"))event.preventDefault()}} onDrop={event=>{if(!event.dataTransfer.files.length)return;event.preventDefault();void uploadFiles(Array.from(event.dataTransfer.files))}}>
            <button type="button" className="asset-library-trigger" onClick={()=>setAssetLibraryOpen(true)}>Assets <span>{assets.length}</span></button>
            <PreviewDashboard visible={viewMode === "dashboard"} website={displayedWebsite} aiActions={history.length} onWebsiteChange={(website) => { if (!websiteLocked) setWebsiteJSON(website, { label: "Apply website JSON" }); }} />
            {!websiteLocked&&editorTab==="design"&&<aside className="editor-control-drawer"><DesignPresetPanel website={websiteJSON} onChange={(website,label) => setWebsiteJSON(website,{label})}/></aside>}
            {!websiteLocked&&editorTab==="theme"&&<aside className="editor-control-drawer"><ThemePanel website={websiteJSON} onChange={(website,options) => setWebsiteJSON(website,options)} onChooseBackground={()=>{setAssetTarget("__background__");setAssetLibraryOpen(true)}}/></aside>}
            {!websiteLocked&&editorTab==="layers"&&<aside className="editor-control-drawer editor-panel"><h2>Layers</h2>{websiteJSON.sections.map(section=><button type="button" key={section.id} onClick={()=>{setSelection({sectionId:section.id});setViewMode("edit")}}>{section.type} · {section.variant}</button>)}</aside>}
            {!websiteLocked&&editorTab==="properties"&&websiteJSON.sections.find(s=>s.id===selection.sectionId)&&<aside className="editor-control-drawer"><SectionProperties selectedSection={websiteJSON.sections.find(s=>s.id===selection.sectionId)!} defaultBackgroundColor={websiteJSON.theme.surfaceColor} onUpdateProp={(key,value)=>updateElement(selection.sectionId,key as EditableElementKey,value)} onUpdateBackgroundColor={value=>updateSectionBackground(selection.sectionId,value)}/></aside>}
            {viewMode!=="dashboard"&&<div className={`device-canvas ${pendingProposal?"ai-preview-active":""}`} style={{width:device==="desktop"?"100%":device==="tablet"?"768px":"390px"}}><WebsiteRenderer website={displayedWebsite} renderMode={websiteLocked?"preview":viewMode==="edit"?"edit":"preview"} selection={selection} onSelectionChange={setSelection} onUpdateElement={updateElement} onUpdateElementStyle={updateElementStyle} onUpdateElementLink={updateElementLink} onRemoveSection={removeSection} onDuplicateSection={duplicateSection} onChangeVariant={changeVariant} onMoveSection={moveSection} onRequestImagePicker={sectionId=>{setAssetTarget(sectionId);setAssetLibraryOpen(true)}} /></div>}
          </div>
        </div>
        </section>
      </div>
      <AssetLibrary assets={assets} open={assetLibraryOpen} hasTarget={Boolean(assetTarget)} busy={assetBusy} error={assetError} onClose={()=>setAssetLibraryOpen(false)} onFiles={files=>void uploadFiles(files)} onSelect={chooseAsset} onSetBackground={setAssetAsBackground} onDelete={id=>void removeAsset(id)}/>
    </main>
  );
}
