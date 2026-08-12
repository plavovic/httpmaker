"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import EditorSidebar, { type ChatMessage, type PromptHistoryItem } from "@/components/editor/EditorSidebar";
import EditorToolbar, { type DeviceMode, type EditorTab } from "@/components/editor/EditorToolbar";
import DesignPresetPanel from "@/components/editor/presets/DesignPresetPanel";
import ThemePanel from "@/components/editor/theme/ThemePanel";
import SectionProperties from "@/components/editor/SectionProperties";
import PreviewDashboard from "@/components/editor/PreviewDashboard";
import { initialWebsite } from "@/data/initialWebsite";
import WebsiteRenderer from "@/renderer/WebsiteRenderer";
import type { ColorMode, EditableElementKey, EditableElementStyle, EditorSelection, ViewMode, WebsiteJSON, WebsiteSection, WebsiteSectionProps } from "@/types/website";
import { EDITOR_THEME_STORAGE_KEY, isLightStudioTheme, readStoredEditorTheme, readStoredWebsite, saveStoredWebsite } from "@/utils/editorStorage";
import { useWebsiteHistory } from "@/hooks/useWebsiteHistory";
import { requestAiProposal, AiClientError } from "@/services/ai/client";
import { applyWebsiteDesignPatchSafely } from "@/services/ai/applyWebsiteDesignPatchSafely";
import type { AiMode, AiPatchProposal } from "@/types/ai";
import AssetLibrary from "@/components/editor/assets/AssetLibrary";
import type { UploadedImageAsset } from "@/types/uploadedAsset";
import { compactWebsiteAssetReferences, createAssetReference, deleteImageAsset, listImageAssets, replaceWebsiteAssetReferences, resolveWebsiteAssetReferences } from "@/utils/assetStorage";
import { exportWebsiteZip } from "@/utils/exportWebsiteZip";
import { safelyParseWebsiteData } from "@/schemas/website.schema";
import { findLegacyAssetReferences } from "@/features/publishing/assets";
import { createAutosaveCoordinator } from "@/utils/autosaveCoordinator";
import HttpmakerLoadingScreen from "@/components/HttpmakerLoadingScreen";
import { designPresetList } from "@/presets";
import DesignPresetPreview from "@/components/editor/presets/DesignPresetPreview";
import { readApiResponse } from "@/lib/api-response";
import type { DesignPresetId } from "@/types/designPreset";
import { upload } from "@vercel/blob/client";

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
  const [retrySave,setRetrySave]=useState(0);
  const [migrationProgress,setMigrationProgress]=useState("");
  const [setupRequired,setSetupRequired]=useState(false);
  const [setupProjectId,setSetupProjectId]=useState<string|null>(null);
  const [selectedPreset,setSelectedPreset]=useState<DesignPresetId|null>(null);
  const [setupBusy,setSetupBusy]=useState(false);
  const [setupError,setSetupError]=useState("");
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const aiRequestRef = useRef<AbortController | null>(null);
  const autosaveCoordinatorRef = useRef(createAutosaveCoordinator());
  const serverRevisionRef = useRef(0);
  const saveTimerRef = useRef<number | undefined>(undefined);
  const latestDraftRef = useRef(websiteJSON);
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
          const body = await readApiResponse<{project:{website:unknown;name:string;draftRevision:number;editorSetupCompletedAt:string|null}}>(response);
          if (!body) throw new Error("Unable to load project.");
          const websiteResult = safelyParseWebsiteData(body.project.website);
          if (!websiteResult.success) throw new Error("The saved project contains invalid website data.");
          if (!cancelled) {
            setSetupProjectId(projectId);
            setProjectName(body.project.name);
            serverRevisionRef.current = body.project.draftRevision;
            if (body.project.editorSetupCompletedAt) { replaceWebsite(websiteResult.data); setActiveProjectId(projectId); }
            else setSetupRequired(true);
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

  useEffect(() => { latestDraftRef.current = websiteJSON; }, [websiteJSON]);

  const persistDraft = useCallback(async (projectId: string, operation = autosaveCoordinatorRef.current.begin()) => {
    const response = await fetch(`/api/projects/${encodeURIComponent(projectId)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ website: compactWebsiteAssetReferences(latestDraftRef.current, assets), expectedRevision: serverRevisionRef.current }),
      signal: operation.signal,
    });
    const body = await response.json();
    if (response.status === 409) {
      serverRevisionRef.current = body.currentRevision;
      throw Object.assign(new Error("Draft conflict"), { conflict: true });
    }
    if (!response.ok) throw new Error(body.error ?? "Save failed");
    if (autosaveCoordinatorRef.current.isCurrent(operation)) {
      serverRevisionRef.current = body.project.draftRevision;
      setSaveState("All changes saved");
    }
  }, [assets]);

  useEffect(() => {
    if (!storageReady || !activeProjectId) return;
    const operation = autosaveCoordinatorRef.current.begin();
    setSaveState("Saving…");
    window.clearTimeout(saveTimerRef.current);
    saveTimerRef.current = window.setTimeout(async () => {
      try {
        await persistDraft(activeProjectId, operation);
      } catch (reason) {
        if (autosaveCoordinatorRef.current.isCurrent(operation)) {
          if (reason instanceof Error && "conflict" in reason) setSaveState("Save conflicted");
          else setSaveState("Save failed");
        }
      }
    }, 700);
    return () => window.clearTimeout(saveTimerRef.current);
  }, [activeProjectId, persistDraft, retrySave, storageReady, websiteJSON]);

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
  useEffect(()=>{if(!ownerId)return;Promise.all([listImageAssets(ownerId),fetch(`/api/assets${activeProjectId?`?projectId=${encodeURIComponent(activeProjectId)}`:""}`).then(async response=>response.ok?(await response.json()).assets:[])]).then(([local,server])=>setAssets([...server.map((asset:{id:string;projectId?:string|null;publicUrl:string;name:string;mimeType:string;size:number;width:number|null;height:number|null;createdAt:string})=>({id:asset.id,ownerId,name:asset.name,mimeType:asset.mimeType,size:asset.size,width:asset.width??0,height:asset.height??0,dataUrl:asset.publicUrl,createdAt:new Date(asset.createdAt).getTime(),synchronized:true,projectId:asset.projectId})),...local])).catch(()=>setAssetError("The asset library could not be opened."))},[activeProjectId,ownerId]);

const directUpload=async(file:File,migrationKey?:string)=>{const intentResponse=await fetch("/api/assets/upload-intent",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name:file.name,mimeType:file.type,size:file.size,...(activeProjectId?{projectId:activeProjectId}:{}),...(migrationKey?{migrationKey}:{})})});const intent=await intentResponse.json();if(!intentResponse.ok)throw new Error(intent.error??"Image upload could not be authorized.");if(intent.asset)return intent.asset;await upload(intent.storageKey,file,{access:"public",handleUploadUrl:"/api/assets/upload",clientPayload:intent.tokenPayload,contentType:file.type,onUploadProgress:()=>{}});for(let attempt=0;attempt<20;attempt+=1){const response=await fetch(`/api/assets?storageKey=${encodeURIComponent(intent.storageKey)}`,{cache:"no-store"});const body=await response.json();if(response.ok&&body.asset)return body.asset;await new Promise(resolve=>setTimeout(resolve,250))}throw new Error("The image was uploaded but validation has not completed. Reopen the library shortly.")};
const uploadFiles=async(files:File[])=>{if(!files.length||!ownerId)return;setAssetBusy(true);setAssetError("");try{const uploaded=[] as UploadedImageAsset[];for(const file of files){const asset=await directUpload(file);uploaded.push({id:asset.id,ownerId,name:asset.name,mimeType:asset.mimeType,size:asset.size,width:asset.width??0,height:asset.height??0,dataUrl:asset.publicUrl,createdAt:new Date(asset.createdAt).getTime(),synchronized:true,projectId:asset.projectId})}setAssets(current=>[...uploaded,...current]);setAssetLibraryOpen(true)}catch(reason){setAssetError(reason instanceof Error?reason.message:"Image upload failed.")}finally{setAssetBusy(false)}};
  const assetReference=(asset:UploadedImageAsset)=>asset.synchronized?asset.dataUrl:createAssetReference(asset.id);
  const chooseAsset=(asset:UploadedImageAsset)=>{if(!assetTarget)return;const reference=assetReference(asset);if(assetTarget==="__background__"){setWebsiteJSON(current=>({...current,isThemeCustomized:true,theme:{...current.theme,backgroundImageUrl:reference}}),{label:"Set page background"});setAssetLibraryOpen(false);return}if(assetTarget.startsWith("__section_background__:")){const sectionId=assetTarget.slice("__section_background__:".length);setWebsiteJSON(current=>({...current,sections:current.sections.map(section=>section.id===sectionId?{...section,backgroundImageUrl:reference,backgroundImageFit:section.backgroundImageFit??"cover"}:section)}),{label:"Set section background image"});setSelection({sectionId});setAssetLibraryOpen(false);return}setWebsiteJSON(current=>({...current,sections:current.sections.map(section=>section.id===assetTarget?{...section,props:{...section.props,imageUrl:reference}}:section)}),{label:"Replace image"});setSelection({sectionId:assetTarget,elementKey:"imageUrl"});setAssetLibraryOpen(false)};
  const removeAsset=async(id:string)=>{if(!ownerId)return;const asset=assets.find(item=>item.id===id);if(asset?.synchronized){const response=await fetch(`/api/assets/${encodeURIComponent(id)}`,{method:"DELETE"});if(!response.ok){const body=await response.json();throw new Error(body.error??"Asset deletion failed.")}}else await deleteImageAsset(id,ownerId);setAssets(current=>current.filter(item=>item.id!==id))};
  const setAssetAsBackground=(asset:UploadedImageAsset)=>{setWebsiteJSON(current=>({...current,isThemeCustomized:true,theme:{...current.theme,backgroundImageUrl:assetReference(asset)}}),{label:"Set page background"});setAssetLibraryOpen(false)};
  const legacyReferences=useMemo(()=>findLegacyAssetReferences(websiteJSON),[websiteJSON]);
const migrateLegacyAssets=async()=>{if(!activeProjectId||!ownerId||!legacyReferences.length)return;autosaveCoordinatorRef.current.begin();window.clearTimeout(saveTimerRef.current);setAssetBusy(true);setAssetError("");let working=websiteJSON;try{for(let index=0;index<legacyReferences.length;index+=1){const reference=legacyReferences[index];setMigrationProgress(`Uploading local asset ${index+1} of ${legacyReferences.length}…`);const local=assets.find(asset=>!asset.synchronized&&createAssetReference(asset.id)===reference);if(!local)throw new Error(`Local image ${reference} is unavailable in this browser.`);const blob=await fetch(local.dataUrl).then(response=>response.blob());const file=new File([blob],local.name,{type:local.mimeType});const asset=await directUpload(file,local.id);working=replaceWebsiteAssetReferences(latestDraftRef.current,new Map([[reference,asset.publicUrl]]));const saveResponse=await fetch(`/api/projects/${encodeURIComponent(activeProjectId)}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({website:working,expectedRevision:serverRevisionRef.current})});const saveBody=await saveResponse.json();if(!saveResponse.ok)throw new Error(saveBody.error??"Uploaded image, but could not save the migrated draft. Retry is safe.");serverRevisionRef.current=saveBody.project.draftRevision;setAssets(current=>current.some(item=>item.id===asset.id)?current:[{id:asset.id,ownerId,name:asset.name,mimeType:asset.mimeType,size:asset.size,width:asset.width??0,height:asset.height??0,dataUrl:asset.publicUrl,createdAt:new Date(asset.createdAt).getTime(),synchronized:true,projectId:asset.projectId},...current]);replaceWebsite(working)}setMigrationProgress("Local assets uploaded. Original browser copies were kept.");setSaveState("All changes saved")}catch(reason){setAssetError(reason instanceof Error?reason.message:"Local asset migration failed. Retry is safe.");setMigrationProgress("")}finally{setAssetBusy(false)}};

  const updateElement = (sectionId: string, elementKey: EditableElementKey, value: string) => setWebsiteJSON((current) => {
    const formMatch=elementKey.match(/^content\.formField\.(.+)\.(label|placeholder)$/);
    if(formMatch)return {...current,sections:current.sections.map(item=>item.id!==sectionId?item:{...item,props:{...item.props,formFields:(item.props.formFields??[]).map(field=>field.id===formMatch[1]?{...field,[formMatch[2]]:value}:field)}})};
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
  const deleteElement = (sectionId:string,elementKey:EditableElementKey) => setWebsiteJSON(current=>({...current,sections:current.sections.map(section=>{if(section.id!==sectionId)return section;const formMatch=elementKey.match(/^content\.formField\.(.+)\.(?:label|placeholder)$/);if(formMatch)return {...section,props:{...section.props,formFields:(section.props.formFields??[]).filter(field=>field.id!==formMatch[1])}};if(elementKey.startsWith("content."))return {...section,content:{...section.content,[elementKey]:""}};return {...section,props:{...section.props,[elementKey]:""}}})}),{label:`Delete ${elementKey.replace("content.","")}`});
  const removeSection = (sectionId: string) => {const index=websiteJSON.sections.findIndex(section=>section.id===sectionId);if(index<0)return;const sections=websiteJSON.sections.filter(section=>section.id!==sectionId);setWebsiteJSON({...websiteJSON,sections},{label:"Delete section"});const fallback=sections[Math.min(index,sections.length-1)];if(fallback)setSelection({sectionId:fallback.id})};
  const duplicateSection = (sectionId: string) => {const index=websiteJSON.sections.findIndex(section=>section.id===sectionId);if(index<0)return;const source=websiteJSON.sections[index];const copy={...source,id:`${source.type}-${crypto.randomUUID()}`,props:{...source.props},content:source.content?{...source.content}:undefined,elementStyles:source.elementStyles?structuredClone(source.elementStyles):undefined,elementLinks:source.elementLinks?{...source.elementLinks}:undefined};const sections=[...websiteJSON.sections];sections.splice(index+1,0,copy);setWebsiteJSON({...websiteJSON,sections},{label:"Duplicate section"});setSelection({sectionId:copy.id})};
  const changeVariant = (sectionId: string, variant: "luxury"|"brutalist") => setWebsiteJSON((current)=>({...current,sections:current.sections.map((section)=>section.id===sectionId?{...section,variant}:section)}), { label: `Change section variant to ${variant}` });
  const updateSectionBackground = (sectionId:string, backgroundColor:string|undefined) => setWebsiteJSON(current=>({...current,sections:current.sections.map(section=>section.id===sectionId?{...section,backgroundColor}:section)}),{label:"Change section background",group:`section-background:${sectionId}`});
  const updateSectionBackgroundImage = (sectionId:string, patch:{backgroundImageUrl?:string;backgroundImageFit?:"cover"|"contain"}) => setWebsiteJSON(current=>({...current,sections:current.sections.map(section=>section.id===sectionId?{...section,...patch,backgroundImageUrl:patch.backgroundImageUrl===""?undefined:patch.backgroundImageUrl??section.backgroundImageUrl}:section)}),{label:"Change section background image",group:`section-background-image:${sectionId}`});
  const updateNavbar = (sectionId:string, patch:Partial<Pick<WebsiteSection,"navbarAppearance"|"navbarScrollBehavior">>) => setWebsiteJSON(current=>({...current,sections:current.sections.map(section=>section.id===sectionId?{...section,...patch}:section)}),{label:"Change navbar",group:`navbar:${sectionId}:${Object.keys(patch).join(",")}`});
  const updateStructuredProps = (sectionId:string, patch:Partial<WebsiteSectionProps>) => setWebsiteJSON(current=>({...current,sections:current.sections.map(section=>section.id===sectionId?{...section,props:{...section.props,...patch}}:section)}),{label:"Edit section content",group:`structured:${sectionId}:${Object.keys(patch).join(",")}`});
  const updateSectionHeight = (sectionId:string, heightVh:number) => setWebsiteJSON(current=>({...current,sections:current.sections.map(section=>section.id===sectionId?{...section,heightVh}:section)}),{label:"Resize section",group:`section-height:${sectionId}`});
  const moveSection = (sourceId:string,targetId:string)=>setWebsiteJSON((current)=>{const from=current.sections.findIndex(s=>s.id===sourceId);const to=current.sections.findIndex(s=>s.id===targetId);if(from<0||to<0||from===to)return current;const sections=[...current.sections];const [moved]=sections.splice(from,1);sections.splice(to,0,moved);return {...current,sections}}, { label: "Move section" });

  const openPreview = async () => {
    saveStoredWebsite(compactWebsiteAssetReferences(websiteJSON,assets));
    if (activeProjectId) {
      window.clearTimeout(saveTimerRef.current);
      setSaveState("Saving…");
      try { await persistDraft(activeProjectId); }
      catch (reason) {
        setSaveState(reason instanceof Error && "conflict" in reason ? "Save conflicted" : "Save failed");
        setAssetError("Preview was not opened because the latest draft could not be saved. Resolve the save error and retry.");
        return;
      }
    }
    window.open(activeProjectId?`/preview/${encodeURIComponent(activeProjectId)}`:"/preview", "_blank", "noopener,noreferrer");
  };

  const openPublishing = async () => {
    if (!activeProjectId) return;
    window.clearTimeout(saveTimerRef.current);
    setSaveState("Saving…");
    try {
      await persistDraft(activeProjectId);
      window.location.assign(`/dashboard/projects/${encodeURIComponent(activeProjectId)}/publish`);
    } catch (reason) {
      setSaveState(reason instanceof Error && "conflict" in reason ? "Save conflicted" : "Save failed");
      setAssetError("Publishing was not opened because the latest draft could not be saved. Resolve the save error and retry.");
    }
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

  const confirmInitialPreset=async()=>{if(!selectedPreset||!setupProjectId||setupBusy)return;setSetupBusy(true);setSetupError("");try{const body=await readApiResponse<{project:{website:unknown;draftRevision:number;editorSetupCompletedAt:string|null}}>(await fetch(`/api/projects/${encodeURIComponent(setupProjectId)}/initialize`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({presetId:selectedPreset})}));const parsed=safelyParseWebsiteData(body?.project.website);if(!body||!parsed.success||!body.project.editorSetupCompletedAt)throw new Error("The saved preset could not be opened.");replaceWebsite(parsed.data);serverRevisionRef.current=body.project.draftRevision;setActiveProjectId(setupProjectId);setSetupRequired(false)}catch(reason){setSetupError(reason instanceof Error?reason.message:"Unable to save this preset. Please retry.")}finally{setSetupBusy(false)}};

  if (!storageReady) return <HttpmakerLoadingScreen label="Opening your studio" />;

  if(setupRequired)return <main className="preset-onboarding"><div className="preset-onboarding-header"><a href="/dashboard">← Back to dashboard</a><strong>{'{'}HTTPMAKER</strong></div><section><p className="preset-onboarding-kicker">New project setup</p><h1>Choose your starting design</h1><p className="preset-onboarding-copy">Select the preset that should create the first version of your website. You can change the design later from the Design panel in the editor.</p><div className="preset-onboarding-grid" role="radiogroup" aria-label="Starting design preset">{designPresetList.map(preset=><button type="button" role="radio" aria-checked={selectedPreset===preset.id} className={selectedPreset===preset.id?"selected":""} key={preset.id} onClick={()=>setSelectedPreset(preset.id)}><DesignPresetPreview preset={preset}/><span><b>{preset.name}</b><small>{preset.description}</small></span><i>{selectedPreset===preset.id?"Selected":"Select"}</i></button>)}</div>{setupError&&<p role="alert" className="preset-onboarding-error">{setupError}</p>}<button type="button" className="preset-onboarding-confirm" disabled={!selectedPreset||setupBusy} onClick={()=>void confirmInitialPreset()}>{setupBusy?"Saving your design…":"Start with this preset"}</button></section></main>;

  return (
    <main data-theme={isLightStudioTheme(colorMode) ? "light" : "dark"} data-color-theme={colorMode} className="ide-shell studio-shell flex h-screen min-h-0 flex-col overflow-hidden">
      <EditorToolbar profileImage={profileImage} profileName={profileName} projectName={projectName} saveState={saveState} colorMode={colorMode} onColorModeChange={setColorMode} viewMode={viewMode} onViewModeChange={setViewMode} onOpenPreview={openPreview} onPublish={()=>void openPublishing()} publishAvailable={Boolean(activeProjectId)} onExport={()=>void exportWebsiteZip(resolveWebsiteAssetReferences(websiteJSON,assets))} editorTab={editorTab} onEditorTabChange={setEditorTab} device={device} onDeviceChange={setDevice} canUndo={canUndo} canRedo={canRedo} undoLabel={undoLabel} redoLabel={redoLabel} onUndo={undo} onRedo={redo} />
      <div className="studio-body flex min-h-0 flex-1">
        <EditorSidebar messages={messages} history={history} isProcessing={isProcessing} prompt={prompt} onPromptChange={setPrompt} autoMode={autoMode} onToggleAutoMode={() => setAutoMode((value) => !value)} onSubmit={handleSend} proposal={pendingProposal?.proposal ?? null} onApplyProposal={applyProposal} onDiscardProposal={discardProposal} />
        <section className="ide-workspace flex-1 min-h-0 overflow-hidden">
        <div className="flex h-full flex-col">
          <div ref={viewportRef} className="editor-viewport studio-viewport flex-1 min-h-0 overflow-auto cursor-grab" onDragOver={event=>{if(event.dataTransfer.types.includes("Files"))event.preventDefault()}} onDrop={event=>{if(!event.dataTransfer.files.length)return;event.preventDefault();void uploadFiles(Array.from(event.dataTransfer.files))}}>
            <div className="editor-floating-actions">
              <button type="button" className="asset-library-trigger" onClick={()=>setAssetLibraryOpen(true)}>Assets <span>{assets.length}</span></button>
              {saveState==="Save failed"&&<button type="button" className="asset-library-trigger" onClick={()=>setRetrySave(value=>value+1)}>Retry save</button>}
              {legacyReferences.length>0&&activeProjectId&&<button type="button" className="asset-library-trigger asset-sync-trigger" disabled={assetBusy} onClick={()=>void migrateLegacyAssets()} title="Store browser-only images on the server">{assetBusy?"Syncing…":`Sync ${legacyReferences.length} local image${legacyReferences.length===1?"":"s"}`}</button>}
            </div>
            {migrationProgress&&<span role="status" aria-live="polite" style={{position:"absolute",top:"1rem",right:"1rem",zIndex:20}}>{migrationProgress}</span>}
            <PreviewDashboard visible={viewMode === "dashboard"} website={displayedWebsite} aiActions={history.length} onWebsiteChange={(website) => { if (!websiteLocked) setWebsiteJSON(website, { label: "Apply website JSON" }); }} />
            {!websiteLocked&&editorTab==="design"&&<aside className="editor-control-drawer"><DesignPresetPanel website={websiteJSON} onChange={(website,label) => setWebsiteJSON(website,{label})}/></aside>}
            {!websiteLocked&&editorTab==="theme"&&<aside className="editor-control-drawer"><ThemePanel website={websiteJSON} onChange={(website,options) => setWebsiteJSON(website,options)} onChooseBackground={()=>{setAssetTarget("__background__");setAssetLibraryOpen(true)}}/></aside>}
            {!websiteLocked&&editorTab==="layers"&&<aside className="editor-control-drawer editor-panel"><h2>Layers</h2>{websiteJSON.sections.map(section=><button type="button" key={section.id} onClick={()=>{setSelection({sectionId:section.id});setViewMode("edit")}}>{section.type} · {section.variant}</button>)}</aside>}
            {!websiteLocked&&editorTab==="properties"&&websiteJSON.sections.find(s=>s.id===selection.sectionId)&&<aside className="editor-control-drawer"><SectionProperties sections={websiteJSON.sections} selectedSection={websiteJSON.sections.find(s=>s.id===selection.sectionId)!} defaultBackgroundColor={websiteJSON.theme.surfaceColor} onSelectSection={sectionId=>{setSelection({sectionId});setViewMode("edit")}} onUpdateProp={(key,value)=>updateElement(selection.sectionId,key as EditableElementKey,value)} onUpdateStructuredProps={patch=>updateStructuredProps(selection.sectionId,patch)} onUpdateBackgroundColor={value=>updateSectionBackground(selection.sectionId,value)} onChooseBackgroundImage={()=>{setAssetTarget(`__section_background__:${selection.sectionId}`);setAssetLibraryOpen(true)}} onUpdateBackgroundImage={patch=>updateSectionBackgroundImage(selection.sectionId,patch)} onUpdateButtonStyle={(key,patch)=>updateElementStyle(selection.sectionId,key,patch)} onUpdateButtonLink={(key,value)=>updateElementLink(selection.sectionId,key,value)} onUpdateNavbar={patch=>updateNavbar(selection.sectionId,patch)}/></aside>}
            {viewMode!=="dashboard"&&<div className={`device-canvas ${pendingProposal?"ai-preview-active":""}`} style={{width:device==="desktop"?"100%":device==="tablet"?"768px":"390px"}}><WebsiteRenderer website={displayedWebsite} renderMode={websiteLocked?"preview":viewMode==="edit"?"edit":"preview"} selection={selection} onSelectionChange={setSelection} onUpdateElement={updateElement} onDeleteElement={deleteElement} onUpdateElementStyle={updateElementStyle} onUpdateElementLink={updateElementLink} onUpdateSectionHeight={updateSectionHeight} onRemoveSection={removeSection} onDuplicateSection={duplicateSection} onChangeVariant={changeVariant} onMoveSection={moveSection} onRequestImagePicker={sectionId=>{setAssetTarget(sectionId);setAssetLibraryOpen(true)}} /></div>}
          </div>
        </div>
        </section>
      </div>
      <AssetLibrary assets={assets} open={assetLibraryOpen} hasTarget={Boolean(assetTarget)} busy={assetBusy} error={assetError} onClose={()=>setAssetLibraryOpen(false)} onFiles={files=>void uploadFiles(files)} onSelect={chooseAsset} onSetBackground={setAssetAsBackground} onDelete={id=>void removeAsset(id)}/>
    </main>
  );
}
