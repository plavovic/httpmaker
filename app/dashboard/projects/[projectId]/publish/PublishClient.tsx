"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { readApiResponse, ApiResponseError } from "@/lib/api-response";
import { SLUG_MAX_LENGTH, SLUG_MIN_LENGTH, slugSchema } from "@/features/publishing/slug";
import styles from "./publish.module.css";
import themeStyles from "../../../themes.module.css";
import StudioThemePicker from "@/components/editor/StudioThemePicker";
import type { ColorMode } from "@/types/website";
import { EDITOR_THEME_STORAGE_KEY, isLightStudioTheme, readStoredEditorTheme } from "@/utils/editorStorage";

type Details = { project: { id:string;name:string;slug:string|null;isPublished:boolean;updatedAt:string;publishedAt:string|null;draftRevision:number;publishedRevision:number|null;publicationTitle:string|null;publicationIconUrl:string|null }; preflight:{draftValid:boolean;unresolvedAssetCount:number} };
type Availability = "not-checked"|"checking"|"available"|"used"|"invalid"|"unable";
const formatDate=(value:string|null)=>value?new Intl.DateTimeFormat(undefined,{dateStyle:"medium",timeStyle:"short"}).format(new Date(value)):"—";

export default function PublishClient({projectId}:{projectId:string}) {
  const [details,setDetails]=useState<Details>(); const [slug,setSlug]=useState(""); const [originalSlug,setOriginalSlug]=useState("");
  const [title,setTitle]=useState(""); const [originalTitle,setOriginalTitle]=useState(""); const [iconUrl,setIconUrl]=useState<string|null>(null); const [originalIconUrl,setOriginalIconUrl]=useState<string|null>(null); const [iconUploading,setIconUploading]=useState(false);
  const [availability,setAvailability]=useState<Availability>("not-checked"); const [busy,setBusy]=useState(false); const [message,setMessage]=useState(""); const initialized=useRef(false);
  const [colorMode,setColorMode]=useState<ColorMode>("sky"); const [themeReady,setThemeReady]=useState(false);
  useEffect(()=>{setColorMode(readStoredEditorTheme());setThemeReady(true)},[]);
  const changeTheme=(next:ColorMode)=>{setColorMode(next);try{localStorage.setItem(EDITOR_THEME_STORAGE_KEY,next)}catch{/* Colorway still applies when storage is unavailable. */}};
  const load=useCallback(async()=>{try{const body=await readApiResponse<Details>(await fetch(`/api/projects/${encodeURIComponent(projectId)}/publish`));if(body){setDetails(body);if(!initialized.current){const next=body.project.slug??"";const nextTitle=body.project.publicationTitle??body.project.name;setSlug(next);setOriginalSlug(next);setTitle(nextTitle);setOriginalTitle(nextTitle);setIconUrl(body.project.publicationIconUrl);setOriginalIconUrl(body.project.publicationIconUrl);initialized.current=true}}}catch(reason){setMessage(reason instanceof Error?reason.message:"Unable to load publishing details.")}},[projectId]);
  useEffect(()=>{void load()},[load]);
  const normalized=slug.trim(); const validation=slugSchema.safeParse(normalized); const normalizedTitle=title.trim(); const changed=normalized!==originalSlug||normalizedTitle!==originalTitle||iconUrl!==originalIconUrl;
  useEffect(()=>{if(!validation.success){setAvailability("invalid");return}setAvailability("checking");const controller=new AbortController();const timer=window.setTimeout(async()=>{try{const body=await readApiResponse<{available:boolean}>(await fetch(`/api/projects/${encodeURIComponent(projectId)}/publish/availability?slug=${encodeURIComponent(normalized)}`,{signal:controller.signal}));setAvailability(body?.available?"available":"used")}catch(reason){if(!controller.signal.aborted)setAvailability("unable")}},350);return()=>{window.clearTimeout(timer);controller.abort()}},[normalized,projectId,validation.success]);
  const publicUrl=useMemo(()=>typeof window==="undefined"?`/${normalized}`:`${window.location.origin}/${normalized}`,[normalized]);
  if(!details||!themeReady)return <main className={styles.shell}><p role="status">{message||"Loading publishing details…"}</p></main>;
  const project=details.project; const hasChanges=project.publishedRevision!==project.draftRevision;
  const status=!project.publishedAt?"Never published":!project.isPublished?"Unpublished":hasChanges?"Published with unpublished draft changes":"Published";
  const action=!project.publishedAt?"Publish website":hasChanges?"Republish changes":changed?"Update publishing details":"Published";
  const canSubmit=validation.success&&normalizedTitle.length>0&&normalizedTitle.length<=120&&availability==="available"&&!busy&&!iconUploading&&(hasChanges||changed||!project.isPublished);
  const mutate=async()=>{if(!canSubmit)return;if(project.isPublished&&normalized!==originalSlug&&!window.confirm(`Change the public URL?\n\nOld: ${window.location.origin}/${originalSlug}\nNew: ${publicUrl}\n\nExisting links to the old URL will stop working.`))return;setBusy(true);setMessage("");try{await readApiResponse(await fetch(`/api/projects/${encodeURIComponent(projectId)}/publish`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({slug:normalized,title:normalizedTitle,iconUrl,expectedRevision:project.draftRevision})}));setMessage("Publishing details saved.");await load();setOriginalSlug(normalized);setOriginalTitle(normalizedTitle);setOriginalIconUrl(iconUrl)}catch(reason){setMessage(reason instanceof ApiResponseError?reason.message:"Unable to publish. Please try again.")}finally{setBusy(false)}};
  const uploadIcon=async(file:File)=>{setIconUploading(true);setMessage("");try{const form=new FormData();form.set("file",file);form.set("projectId",projectId);const body=await readApiResponse<{asset:{publicUrl:string}}>(await fetch("/api/assets",{method:"POST",body:form}));if(!body)throw new Error("Icon upload returned no data.");setIconUrl(body.asset.publicUrl);setMessage("Icon uploaded. Publish or update details to make it live.")}catch(reason){setMessage(reason instanceof Error?reason.message:"Unable to upload the icon.")}finally{setIconUploading(false)}};
  const unpublish=async()=>{if(!window.confirm(`Unpublish “${project.name}”? The public URL will stop working.`))return;setBusy(true);try{await readApiResponse(await fetch(`/api/projects/${encodeURIComponent(projectId)}/publish`,{method:"DELETE"}),{allowEmpty:true});setMessage("Website unpublished.");await load()}catch(reason){setMessage(reason instanceof Error?reason.message:"Unable to unpublish.")}finally{setBusy(false)}};
  const copy=async()=>{try{if(!navigator.clipboard)throw new Error();await navigator.clipboard.writeText(publicUrl);setMessage("Public URL copied.")}catch{setMessage("Unable to copy the public URL. Select and copy it manually.")}};
  return <main data-theme={isLightStudioTheme(colorMode)?"light":"dark"} data-color-theme={colorMode} className={`${styles.shell} ${themeStyles.themed}`}>
    <header className={styles.toolbar}><Link href="/dashboard" className={styles.back}>← Back to dashboard</Link><span className={styles.logo}><i>{'{'}</i>HTTPMAKER</span><StudioThemePicker value={colorMode} onChange={changeTheme}/></header>
    <section className={styles.card}>
      <div className={styles.titleRow}><div><p className={styles.eyebrow}>Publishing control</p><h1>{project.name}</h1></div><span className={`${styles.statusBadge} ${project.isPublished?styles.live:""}`}><i/>{status}</span></div>
      <dl><div><dt>Publication status</dt><dd>{status}</dd></div><div><dt>Draft updated</dt><dd>{formatDate(project.updatedAt)}</dd></div>{project.publishedAt&&<div><dt>Last published</dt><dd>{formatDate(project.publishedAt)}</dd></div>}</dl>
      <p className={styles.explainer}>Publishing creates a fixed snapshot. Your later editor changes stay private until you choose Republish changes.</p>
      <div className={styles.branding}>
        <div className={styles.field}><label htmlFor="publication-title">Browser tab title</label><input id="publication-title" value={title} onChange={event=>setTitle(event.target.value)} maxLength={120} required/><small>This title appears in the browser tab and bookmarks.</small></div>
        <div className={styles.iconField}><span className={styles.iconPreview}>{iconUrl?<img src={iconUrl} alt="Current website icon"/>:<b>{normalizedTitle.slice(0,1).toUpperCase()||"W"}</b>}</span><label>Website icon<input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={event=>{const file=event.target.files?.[0];if(file)void uploadIcon(file);event.target.value=""}} disabled={iconUploading}/></label><small>Square PNG, JPG, WebP, or GIF. Up to 10 MB.</small>{iconUrl&&<button type="button" onClick={()=>setIconUrl(null)}>Remove icon</button>}</div>
      </div>
      <div className={styles.field}><label htmlFor="slug">Public URL slug</label><input id="slug" value={slug} onChange={event=>setSlug(event.target.value)} minLength={SLUG_MIN_LENGTH} maxLength={SLUG_MAX_LENGTH} aria-describedby="slug-help slug-status" autoComplete="off"/><small id="slug-help">{SLUG_MIN_LENGTH}–{SLUG_MAX_LENGTH} lowercase letters or numbers, separated by single hyphens. No leading, trailing, or consecutive hyphens.</small></div>
      <div className={styles.urlPanel}><span>PUBLIC URL</span><output>{publicUrl}</output><p id="slug-status" role="status" data-state={availability}>{({"not-checked":"Not checked",checking:"Checking…",available:"Available",used:"Already used",invalid:validation.success?"Invalid":validation.error.issues[0]?.message??"Invalid",unable:"Unable to check"} as Record<Availability,string>)[availability]}</p></div>
      <div className={styles.preflight}><h2>Ready to publish</h2><p data-ready={details.preflight.draftValid}>Database draft is valid</p><p data-ready={details.preflight.unresolvedAssetCount===0}>{details.preflight.unresolvedAssetCount===0?"No unresolved local assets":`${details.preflight.unresolvedAssetCount} unresolved local asset(s) block publishing`}</p></div>
      {message&&<p role="alert" className={styles.message}>{message}</p>}
      <div className={styles.actions}><button className={styles.primary} onClick={()=>void mutate()} disabled={!canSubmit}>{busy?"Working…":action}</button>{project.isPublished&&project.slug&&<><a href={`/${project.slug}`} target="_blank" rel="noreferrer">View live website ↗</a><button type="button" onClick={()=>void copy()}>Copy public URL</button><button type="button" className={styles.danger} disabled={busy} onClick={()=>void unpublish()}>Unpublish website</button></>}</div>
    </section>
  </main>;
}
