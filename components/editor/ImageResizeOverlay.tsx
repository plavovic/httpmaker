"use client";

import { useLayoutEffect, useRef, useState, type PointerEvent } from "react";
import { flushSync } from "react-dom";

type Rect = { left:number; top:number; width:number; height:number };
type Guide = { axis:"x"|"y"; position:number; start:number; length:number; label:string };
type Props = { sectionId:string; elementKey:string; widthPercent?:number; heightPx?:number; offsetX?:number; offsetY?:number; offsetXPercent?:number; offsetYPercent?:number; onCommit:(widthPercent?:number,heightPx?:number)=>void; onMoveCommit:(offsetX:number,offsetY:number,hiddenInPreview:boolean)=>void };
type Direction = -1|0|1;

export default function ImageResizeOverlay({sectionId,elementKey,widthPercent,heightPx,offsetX=0,offsetY=0,offsetXPercent,offsetYPercent,onCommit,onMoveCommit}:Props){
  const [rect,setRect]=useState<Rect>();
  const [size,setSize]=useState("");
  const [guides,setGuides]=useState<Guide[]>([]);
  const locateFrame=useRef(0);
  const selector=`[data-section-id="${CSS.escape(sectionId)}"] [data-editor-element="${CSS.escape(elementKey)}"]`;
  const locate=()=>{cancelAnimationFrame(locateFrame.current);locateFrame.current=requestAnimationFrame(()=>{const element=document.querySelector<HTMLElement>(selector);if(!element)return setRect(undefined);const box=element.getBoundingClientRect();setRect({left:box.left,top:box.top,width:box.width,height:box.height});setSize(`${Math.round(box.width)} × ${Math.round(box.height)}`)})};
  useLayoutEffect(()=>{locate();window.addEventListener("resize",locate);window.addEventListener("scroll",locate,true);return()=>{cancelAnimationFrame(locateFrame.current);window.removeEventListener("resize",locate);window.removeEventListener("scroll",locate,true)}},[sectionId,elementKey,widthPercent,heightPx,offsetXPercent,offsetYPercent]);

  const startResize=(event:PointerEvent<HTMLButtonElement>,horizontal:Direction,vertical:Direction)=>{
    event.preventDefault();event.stopPropagation();
    const handle=event.currentTarget;handle.setPointerCapture(event.pointerId);
    const element=document.querySelector<HTMLElement>(selector);const section=element?.closest<HTMLElement>("[data-section-id]");if(!element||!section)return;
    const elementBox=element.getBoundingClientRect();const sectionBox=section.getBoundingClientRect();const startX=event.clientX;const startY=event.clientY;
    let nextWidth=Math.max(10,Math.min(100,elementBox.width/sectionBox.width*100));let nextHeight=elementBox.height;
    const move=(moveEvent:globalThis.PointerEvent)=>{
      if(horizontal){const pixels=Math.max(sectionBox.width*.1,Math.min(sectionBox.width,elementBox.width+(moveEvent.clientX-startX)*horizontal));nextWidth=Math.round(pixels/sectionBox.width*1000)/10;if(elementKey==="imageUrl"&&(section.dataset.sectionType==="hero"||section.dataset.sectionType==="about")){section.dataset.imageResized="true";section.style.setProperty("--section-image-width",`${nextWidth}%`)}else{element.style.width=`${nextWidth}%`;element.style.maxWidth="100%"}}
      if(vertical){nextHeight=Math.round(Math.max(16,Math.min(2000,elementBox.height+(moveEvent.clientY-startY)*vertical)));element.style.height=`${nextHeight}px`;element.style.minHeight="0"}
      locate();
    };
    const finish=()=>{handle.removeEventListener("pointermove",move);handle.removeEventListener("pointerup",finish);handle.removeEventListener("pointercancel",finish);onCommit(horizontal?nextWidth:undefined,vertical?nextHeight:undefined)};
    handle.addEventListener("pointermove",move);handle.addEventListener("pointerup",finish);handle.addEventListener("pointercancel",finish);
  };

  const startMove=(event:PointerEvent<HTMLDivElement>)=>{
    if((event.target as HTMLElement).closest("button"))return;event.preventDefault();event.stopPropagation();
    const handle=event.currentTarget;handle.setPointerCapture(event.pointerId);const element=document.querySelector<HTMLElement>(selector);const section=element?.closest<HTMLElement>("[data-section-id]");if(!element||!section)return;
    const startX=event.clientX;const startY=event.clientY;const elementBox=element.getBoundingClientRect();const sectionBox=section.getBoundingClientRect();const computedStyle=getComputedStyle(element);const baseX=Number.parseFloat(computedStyle.left)||0;const baseY=Number.parseFloat(computedStyle.top)||0;let nextX=baseX;let nextY=baseY;let hiddenInPreview=false;
    const peers=Array.from(section.querySelectorAll<HTMLElement>("[data-editor-element]")).filter(peer=>peer!==element&&!element.contains(peer)&&!peer.contains(element)).map(peer=>peer.getBoundingClientRect());
    const xTargets=[{value:sectionBox.left+24,label:"Left margin"},{value:sectionBox.left+sectionBox.width/2,label:"Section center"},{value:sectionBox.right-24,label:"Right margin"},...peers.flatMap(peer=>[{value:peer.left,label:"Align left"},{value:peer.left+peer.width/2,label:"Align center"},{value:peer.right,label:"Align right"}])];
    const yTargets=[{value:sectionBox.top+24,label:"Top margin"},{value:sectionBox.top+sectionBox.height/2,label:"Section middle"},{value:sectionBox.bottom-24,label:"Bottom margin"},...peers.flatMap(peer=>[{value:peer.top,label:"Align top"},{value:peer.top+peer.height/2,label:"Align middle"},{value:peer.bottom,label:"Align bottom"}])];
    const snap=(targets:{value:number;label:string}[],anchors:number[])=>{let best:{adjustment:number;position:number;label:string}|undefined;for(const target of targets)for(const anchor of anchors){const adjustment=target.value-anchor;if(Math.abs(adjustment)<=9&&(!best||Math.abs(adjustment)<Math.abs(best.adjustment)))best={adjustment,position:target.value,label:target.label}}return best};
    let guideSignature="";
    const move=(moveEvent:globalThis.PointerEvent)=>{let dx=moveEvent.clientX-startX;let dy=moveEvent.clientY-startY;const xSnap=snap(xTargets,[elementBox.left+dx,elementBox.left+elementBox.width/2+dx,elementBox.right+dx]);const ySnap=snap(yTargets,[elementBox.top+dy,elementBox.top+elementBox.height/2+dy,elementBox.bottom+dy]);if(xSnap)dx+=xSnap.adjustment;if(ySnap)dy+=ySnap.adjustment;nextX=Math.round(baseX+dx);nextY=Math.round(baseY+dy);const centerX=elementBox.left+elementBox.width/2+dx;const centerY=elementBox.top+elementBox.height/2+dy;hiddenInPreview=centerX<sectionBox.left||centerX>sectionBox.right||centerY<sectionBox.top||centerY>sectionBox.bottom;element.style.position="relative";element.style.zIndex="1";element.style.translate=`${Math.round(dx)}px ${Math.round(dy)}px`;const nextSignature=`${xSnap?.label??""}:${ySnap?.label??""}`;if(nextSignature!==guideSignature){guideSignature=nextSignature;setGuides([...(xSnap?[{axis:"x" as const,position:xSnap.position,start:sectionBox.top,length:sectionBox.height,label:xSnap.label}]:[]),...(ySnap?[{axis:"y" as const,position:ySnap.position,start:sectionBox.left,length:sectionBox.width,label:ySnap.label}]:[])])}locate()};
    const finish=()=>{handle.removeEventListener("pointermove",move);handle.removeEventListener("pointerup",finish);handle.removeEventListener("pointercancel",finish);setGuides([]);flushSync(()=>onMoveCommit(nextX,nextY,false));element.style.removeProperty("translate")};
    handle.addEventListener("pointermove",move);handle.addEventListener("pointerup",finish);handle.addEventListener("pointercancel",finish);
  };

  if(!rect)return null;
  const handles:[Direction,Direction,string][]=[[-1,-1,"top-left"],[0,-1,"top"],[1,-1,"top-right"],[-1,0,"left"],[1,0,"right"],[-1,1,"bottom-left"],[0,1,"bottom"],[1,1,"bottom-right"]];
  return <>{guides.map((guide,index)=><div key={`${guide.axis}-${index}`} className={`alignment-guide alignment-guide-${guide.axis}`} style={guide.axis==="x"?{left:guide.position,top:guide.start,height:guide.length}:{left:guide.start,top:guide.position,width:guide.length}}><span>{guide.label}</span></div>)}<div className="image-resize-overlay" style={rect} aria-label="Resize and move selected element" title="Drag to move; double-click text to edit" onPointerDown={startMove} onDoubleClick={event=>{event.preventDefault();event.stopPropagation();document.querySelector<HTMLElement>(selector)?.dispatchEvent(new MouseEvent("dblclick",{bubbles:true,cancelable:true}))}}>
    {handles.map(([x,y,name])=><button key={name} type="button" className={`image-resize-handle ${name}`} aria-label={`Resize from ${name}`} onPointerDown={event=>startResize(event,x,y)}/>)}
    <span>{size}</span>
  </div></>;
}
